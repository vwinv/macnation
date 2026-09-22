import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import type { PaymentMethod } from '../common/money';
import { isSnMobile, normalizePhone } from '../common/phone';
import { NotifyService } from '../notify/notify.service';
import { paytechIpnUrl, siteUrl } from '../common/site';
import { StoreService } from '../store/store.service';
import type { Invoice, PendingPayment } from '../store/store.types';
import { PaytechError } from './paytech.errors';

/** Official PayTech API base — https://doc.intech.sn/doc_paytech.php */
const API_BASE = 'https://paytech.sn/api';

export type SoftPayMethod = 'wave' | 'orange' | 'free';

export type PaytechCheckout = {
  method: SoftPayMethod | 'all';
  message: string;
  url: string;
  token: string;
};

type RequestPaymentResponse = {
  success?: number | boolean;
  token?: string;
  redirect_url?: string;
  redirectUrl?: string;
  message?: string;
};

type IpnBody = {
  type_event?: string;
  custom_field?: string | Record<string, unknown>;
  ref_command?: string;
  item_price?: number | string;
  final_item_price?: number | string;
  token?: string;
  payment_method?: string;
  client_phone?: string;
  api_key_sha256?: string;
  api_secret_sha256?: string;
  hmac_compute?: string;
};

/**
 * Names from the official `target_payment` list
 * (Orange Money, Wave, Free Money).
 */
const TARGET: Record<SoftPayMethod, string> = {
  wave: 'Wave',
  orange: 'Orange Money',
  free: 'Free Money',
};

const ALL_TARGETS = 'Orange Money, Wave, Free Money';

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function equalHex(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return a === b;
  }
}

function nationalPhone(phone: string) {
  return normalizePhone(phone).replace(/\D/g, '').slice(-9);
}

/** Wave / PayTech reject punctuation and the middle-dot used in labels. */
function asciiLabel(value: string) {
  const clean = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 .,_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return clean || 'MAC NATION';
}

function uniqueSessionRef(seed: string) {
  const compact = seed.replace(/[^a-zA-Z0-9]/g, '').slice(-16);
  return `MN${compact}${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function paymentMethodFromPaytech(value: string): PaymentMethod {
  const lower = value.toLowerCase();
  if (lower.includes('wave')) return 'wave';
  if (lower.includes('orange')) return 'orange';
  if (lower.includes('free')) return 'free';
  return 'paydunya';
}

function operatorMessage(method: SoftPayMethod | 'all') {
  if (method === 'wave') return 'Ouvre Wave pour valider. MAC NATION reste ouvert.';
  if (method === 'orange') {
    return 'Ouvre Orange Money pour valider. MAC NATION reste ouvert.';
  }
  if (method === 'free') {
    return 'Ouvre Free Money et compose #150# si demandé. MAC NATION reste ouvert.';
  }
  return 'Choisis Wave, Orange Money ou Free Money sur PayTech.';
}

@Injectable()
export class PaytechService {
  private readonly logger = new Logger(PaytechService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly store: StoreService,
    private readonly notify: NotifyService,
  ) {}

  private env(key: string) {
    return (this.config.get<string>(key) || '').trim();
  }

  configured() {
    return Boolean(this.env('PAYTECH_API_KEY') && this.env('PAYTECH_API_SECRET'));
  }

  private payEnv() {
    return this.env('PAYTECH_ENV') === 'prod' ? 'prod' : 'test';
  }

  private headers(contentType: string) {
    return {
      Accept: 'application/json',
      'Content-Type': contentType,
      API_KEY: this.env('PAYTECH_API_KEY'),
      API_SECRET: this.env('PAYTECH_API_SECRET'),
    };
  }

  /**
   * HMAC-SHA256 recommended by PayTech:
   * message = `${item_price}|${ref_command}|${api_key}` signed with API_SECRET.
   */
  hmacValid(itemPrice: string, refCommand: string, received: string) {
    const message = `${itemPrice}|${refCommand}|${this.env('PAYTECH_API_KEY')}`;
    const expected = createHmac('sha256', this.env('PAYTECH_API_SECRET'))
      .update(message)
      .digest('hex');
    return equalHex(expected.toLowerCase(), received.toLowerCase());
  }

  /** Classic SHA256 of API_KEY / API_SECRET compared to IPN hashes. */
  sha256KeysValid(keyHash: string, secretHash: string) {
    const expectedKey = createHash('sha256')
      .update(this.env('PAYTECH_API_KEY'))
      .digest('hex');
    const expectedSecret = createHash('sha256')
      .update(this.env('PAYTECH_API_SECRET'))
      .digest('hex');
    return (
      equalHex(expectedKey.toLowerCase(), keyHash.toLowerCase()) &&
      equalHex(expectedSecret.toLowerCase(), secretHash.toLowerCase())
    );
  }

  ipnAuthentic(body: IpnBody) {
    const hmac = text(body.hmac_compute);
    if (hmac) {
      const prices = [
        String(body.final_item_price ?? ''),
        String(body.item_price ?? ''),
      ].filter((value, index, all) => value && all.indexOf(value) === index);
      const ref = text(body.ref_command);
      return prices.some((price) => this.hmacValid(price, ref, hmac.toLowerCase()));
    }
    return this.sha256KeysValid(
      text(body.api_key_sha256),
      text(body.api_secret_sha256),
    );
  }

  parseCustomField(raw: string): { invoiceId?: string; pendingId?: string } {
    const value = text(raw);
    if (!value) return {};
    const tryParse = (input: string) => {
      try {
        const parsed = JSON.parse(input) as {
          invoiceId?: unknown;
          pendingId?: unknown;
        };
        return {
          invoiceId: text(parsed?.invoiceId) || undefined,
          pendingId: text(parsed?.pendingId) || undefined,
        };
      } catch {
        return {};
      }
    };
    const direct = tryParse(value);
    if (direct.invoiceId || direct.pendingId) return direct;
    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      return tryParse(decoded);
    } catch {
      return {};
    }
  }

  async startCheckout(opts: {
    invoiceId?: string;
    pendingId?: string;
    method?: SoftPayMethod;
    phone?: string;
    name?: string;
    email?: string;
    source?: 'site' | 'app';
  }): Promise<PaytechCheckout> {
    if (!this.configured()) throw new PaytechError('PAYTECH_MISSING');
    if (opts.pendingId) return this.startPendingCheckout(opts);
    const invoiceId = text(opts.invoiceId);
    if (!invoiceId) throw new PaytechError('INVOICE_MISSING');
    const invoice = await this.store.getInvoice(invoiceId);
    if (!invoice) throw new PaytechError('INVOICE_MISSING');
    if (invoice.amount <= 0) throw new PaytechError('AMOUNT_ZERO');
    if (invoice.status === 'payee') throw new PaytechError('ALREADY_PAID');
    if (invoice.status === 'annulee') throw new PaytechError('CANCELLED');

    const phone = normalizePhone(opts.phone || invoice.clientPhone);
    if (opts.method && !isSnMobile(phone)) {
      throw new PaytechError('PHONE_INVALID');
    }

    const created = await this.requestPayment({
      itemName: invoice.items[0]?.name || 'MAC NATION',
      amount: invoice.amount,
      refCommand: uniqueSessionRef(invoice.id),
      customField: { invoiceId: invoice.id },
      method: opts.method,
      source: opts.source || 'site',
      successQuery: `invoice=${encodeURIComponent(invoice.id)}`,
    });
    const url = this.withAutofill(created.url, {
      method: opts.method,
      phone,
      name: opts.name || invoice.clientName,
    });

    try {
      await this.store.attachPaydunya(invoice.id, created.token, url);
    } catch (error) {
      this.logger.warn(`Sauvegarde du jeton PayTech échouée: ${String(error)}`);
    }

    const method = opts.method || 'all';
    return {
      method,
      token: created.token,
      url,
      message: operatorMessage(method),
    };
  }

  async refreshPending(pendingId: string) {
    const pending = await this.store.getPendingPayment(pendingId);
    if (!pending) throw new PaytechError('INVOICE_MISSING');
    if (pending.invoiceId) {
      const invoice = await this.store.getInvoice(pending.invoiceId);
      if (invoice) return invoice;
    }
    return null;
  }

  async refreshInvoice(invoiceId: string) {
    const invoice = await this.store.getInvoice(invoiceId);
    if (!invoice) throw new PaytechError('INVOICE_MISSING');
    return invoice;
  }

  async handleIpn(raw: unknown) {
    const body = this.parseIpn(raw);
    if (!this.ipnAuthentic(body)) {
      return { ok: false as const, reason: 'unauthentic' };
    }

    const event = text(body.type_event);
    if (event === 'sale_canceled') {
      this.logger.log(`PayTech sale_canceled ${text(body.ref_command)}`);
      return { ok: true as const, event };
    }
    if (event && event !== 'sale_complete') {
      this.logger.log(`PayTech IPN ignoré: ${event}`);
      return { ok: true as const, event };
    }

    const customRaw =
      typeof body.custom_field === 'string'
        ? body.custom_field
        : JSON.stringify(body.custom_field ?? {});
    const fromCustom = this.parseCustomField(customRaw);
    const token = text(body.token);
    const method = paymentMethodFromPaytech(text(body.payment_method));

    const pendingSettled = await this.store.fulfillPendingPayment({
      pendingId: fromCustom.pendingId,
      paytechRef: text(body.ref_command) || undefined,
      token: token || undefined,
      method,
    });
    if (pendingSettled) {
      if (pendingSettled.created) {
        await this.notifyFulfilled(
          pendingSettled.pending,
          pendingSettled.generatedPassword,
        );
      }
      return { ok: true as const, event: event || 'sale_complete' };
    }

    const invoiceId = fromCustom.invoiceId || text(body.ref_command);
    const settled = await this.store.markInvoicePaid({
      invoiceId: invoiceId || undefined,
      paydunyaToken: token || undefined,
      method,
    });
    if (!settled) {
      this.logger.warn(
        `PayTech IPN sans facture (ref=${invoiceId} token=${token})`,
      );
    }
    return { ok: true as const, event: event || 'sale_complete' };
  }

  private parseIpn(raw: unknown): IpnBody {
    if (!raw || typeof raw !== 'object') return {};
    return raw as IpnBody;
  }

  private async startPendingCheckout(opts: {
    pendingId?: string;
    method?: SoftPayMethod;
    phone?: string;
    name?: string;
    email?: string;
    source?: 'site' | 'app';
  }): Promise<PaytechCheckout> {
    const pending = await this.store.getPendingPayment(text(opts.pendingId));
    if (!pending) throw new PaytechError('INVOICE_MISSING');
    if (pending.status === 'paid') throw new PaytechError('ALREADY_PAID');
    if (pending.status === 'expired') throw new PaytechError('PENDING_EXPIRED');
    if (pending.amount <= 0) throw new PaytechError('AMOUNT_ZERO');

    const rotated = await this.store.rotatePendingRef(pending.id);
    const phone = normalizePhone(
      opts.phone ||
        (pending.payload.kind === 'booking'
          ? pending.payload.phone
          : pending.payload.clientPhone),
    );
    if (opts.method && !isSnMobile(phone)) {
      throw new PaytechError('PHONE_INVALID');
    }
    const itemName =
      pending.payload.kind === 'booking'
        ? pending.payload.serviceName
        : pending.payload.items[0]?.name || pending.payload.label;
    const created = await this.requestPayment({
      itemName,
      amount: pending.amount,
      refCommand: rotated.paytechRef,
      customField: { pendingId: pending.id },
      method: opts.method,
      source: opts.source || 'site',
      successQuery: `pending=${encodeURIComponent(pending.id)}`,
    });
    const url = this.withAutofill(created.url, {
      method: opts.method,
      phone,
      name:
        opts.name ||
        (pending.payload.kind === 'booking'
          ? pending.payload.name
          : pending.payload.clientName),
    });
    await this.store.attachPaytechPending(
      pending.id,
      created.token,
      url,
      rotated.paytechRef,
    );
    const method = opts.method || 'all';
    return {
      method,
      token: created.token,
      url,
      message: operatorMessage(method),
    };
  }

  private async notifyFulfilled(
    pending: PendingPayment,
    generatedPassword?: string,
  ) {
    try {
      if (pending.payload.kind === 'booking') {
        const booking = pending.payload;
        await this.notify.bookingCreated({
          name: booking.name,
          phone: booking.phone,
          email: booking.email,
          serviceName: booking.serviceName,
          dateLabel: booking.dateLabel,
          time: booking.time,
          place: booking.place,
          address: booking.address,
        });
        if (generatedPassword) {
          await this.notify.accountCreated({
            name: booking.name,
            phone: booking.phone,
            email: booking.email,
            password: generatedPassword,
          });
        }
        return;
      }
      await this.notify.checkoutCreated({
        name: pending.payload.clientName,
        phone: pending.payload.clientPhone,
        email: pending.payload.clientEmail,
        label: pending.payload.label,
        amountLabel: `${pending.amount} F`,
        note: pending.payload.note,
        kind: pending.payload.kind,
      });
      if (generatedPassword) {
        await this.notify.accountCreated({
          name: pending.payload.clientName,
          phone: pending.payload.clientPhone,
          email: pending.payload.clientEmail,
          password: generatedPassword,
        });
      }
    } catch (error) {
      this.logger.warn(`Notification post-paiement échouée: ${String(error)}`);
    }
  }

  private async requestPayment(opts: {
    itemName: string;
    amount: number;
    refCommand: string;
    customField: Record<string, string>;
    method?: SoftPayMethod;
    source: 'site' | 'app';
    successQuery: string;
  }) {
    const origin = siteUrl(this.config);
    const httpsOrigin = origin.startsWith('https://');
    const itemName = asciiLabel(opts.itemName || 'MAC NATION');
    const successUrl =
      opts.source === 'app' || !httpsOrigin
        ? 'https://paytech.sn/mobile/success'
        : `${origin}/paiement/retour?${opts.successQuery}`;
    const cancelUrl =
      opts.source === 'app' || !httpsOrigin
        ? 'https://paytech.sn/mobile/cancel'
        : `${origin}/paiement/annule`;

    const params: Record<string, string> = {
      item_name: itemName,
      item_price: String(Math.round(opts.amount)),
      currency: 'XOF',
      ref_command: opts.refCommand,
      command_name: asciiLabel(itemName),
      env: this.payEnv(),
      target_payment: opts.method ? TARGET[opts.method] : ALL_TARGETS,
      ipn_url: paytechIpnUrl(this.config),
      success_url: successUrl,
      cancel_url: cancelUrl,
      custom_field: JSON.stringify(opts.customField),
    };

    let json: RequestPaymentResponse | null = null;
    let status = 0;
    try {
      const res = await fetch(`${API_BASE}/payment/request-payment`, {
        method: 'POST',
        headers: this.headers('application/x-www-form-urlencoded'),
        body: new URLSearchParams(params).toString(),
      });
      status = res.status;
      json = (await res.json().catch(() => null)) as RequestPaymentResponse | null;
    } catch (error) {
      this.logger.error(`PayTech injoignable: ${String(error)}`);
      throw new PaytechError('PAYTECH_FAILED');
    }

    const ok = json?.success === 1 || json?.success === true;
    const token = text(json?.token);
    const url = text(json?.redirect_url) || text(json?.redirectUrl);
    if (!ok || !token || !url) {
      this.logger.error(`PayTech request-payment ${status}: ${JSON.stringify(json)}`);
      throw new PaytechError(
        'PAYTECH_FAILED',
        text(json?.message) || undefined,
      );
    }
    return { token, url };
  }

  /**
   * Autofill query params from the official docs, only when a single
   * `target_payment` is set: pn, nn, fn, tp, nac.
   * Wave rejects auto-submit (`nac=1` / `pn=+221…`) with
   * "Format de requete invalid" — leave Wave on the PayTech form.
   */
  private withAutofill(
    url: string,
    opts: { method?: SoftPayMethod; phone: string; name: string },
  ) {
    if (!opts.method || opts.method === 'wave' || !isSnMobile(opts.phone)) {
      return url;
    }
    const national = nationalPhone(opts.phone);
    const query = new URLSearchParams({
      pn: `221${national}`,
      nn: national,
      fn: asciiLabel(opts.name) || 'Client MAC NATION',
      tp: TARGET[opts.method],
      nac: '1',
    });
    return `${url}?${query.toString()}`;
  }
}
