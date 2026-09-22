import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import type { PaymentMethod } from '../common/money';
import { isSnMobile, normalizePhone } from '../common/phone';
import { siteUrl } from '../common/site';
import { StoreService } from '../store/store.service';
import type { Invoice } from '../store/store.types';
import { PaydunyaError } from './paydunya.errors';

const API_BASE = 'https://app.paydunya.com/api/v1';

export type SoftPayMethod = 'wave' | 'orange' | 'free';

export type SoftPayResult = {
  method: SoftPayMethod;
  message: string;
  url?: string;
  qr?: string;
  omUrl?: string;
  maxitUrl?: string;
};

export type PaydunyaIpn = {
  hash?: string;
  status?: string;
  token?: string;
  invoice?: { token?: string; total_amount?: number | string };
  custom_data?: Record<string, string>;
};

type PaydunyaCreateResponse = {
  response_code?: string;
  response_text?: string;
  description?: string;
  token?: string;
};

type PaydunyaConfirmResponse = {
  response_code?: string;
  status?: string;
  hash?: string;
  custom_data?: Record<string, string>;
  invoice?: { token?: string; total_amount?: number | string };
};

type SoftPayApiResponse = {
  success?: boolean;
  message?: string;
  url?: string;
  other_url?: { om_url?: string; maxit_url?: string };
  errors?: { message?: string; description?: string };
};

const SOFTPAY_CHANNELS: Record<SoftPayMethod, string> = {
  wave: 'wave-senegal',
  orange: 'orange-money-senegal',
  free: 'free-money-senegal',
};

function localSnPhone(phone: string) {
  return normalizePhone(phone).replace(/\D/g, '').slice(-9);
}

function payerEmail(email: string, phone: string) {
  const trimmed = (email || '').trim();
  if (trimmed.includes('@')) return trimmed;
  return `${localSnPhone(phone)}@client.mac-nation.sn`;
}

function softPayError(json: SoftPayApiResponse | null) {
  return (
    json?.errors?.description ||
    json?.errors?.message ||
    json?.message ||
    'Paiement Mobile Money indisponible.'
  );
}

function orangeQrFromUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  try {
    const parsed = new URL(url);
    const qr = parsed.searchParams.get('data[qrcode]');
    if (qr) return `data:image/png;base64,${qr.replace(/ /g, '+')}`;
  } catch {
    return '';
  }
  return '';
}

function operatorMessage(method: SoftPayMethod) {
  if (method === 'wave') {
    return 'Ouvre Wave pour valider. MAC NATION reste ouvert.';
  }
  if (method === 'orange') {
    return 'Ouvre Orange Money pour valider. MAC NATION reste ouvert.';
  }
  return 'Ouvre Free Money et compose #150# si demandé. MAC NATION reste ouvert.';
}

@Injectable()
export class PaydunyaService {
  private readonly logger = new Logger(PaydunyaService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly store: StoreService,
  ) {}

  private env(key: string) {
    return (this.config.get<string>(key) || '').trim();
  }

  configured() {
    return Boolean(
      this.env('PAYDUNYA_MASTER_KEY') &&
      this.env('PAYDUNYA_PRIVATE_KEY') &&
      this.env('PAYDUNYA_TOKEN'),
    );
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': this.env('PAYDUNYA_MASTER_KEY'),
      'PAYDUNYA-PRIVATE-KEY': this.env('PAYDUNYA_PRIVATE_KEY'),
      'PAYDUNYA-PUBLIC-KEY': this.env('PAYDUNYA_PUBLIC_KEY'),
      'PAYDUNYA-TOKEN': this.env('PAYDUNYA_TOKEN'),
    };
  }

  expectedHash() {
    return createHash('sha512')
      .update(this.env('PAYDUNYA_MASTER_KEY'))
      .digest('hex');
  }

  hashValid(received: string) {
    const expected = this.expectedHash();
    if (!received || received.length !== expected.length) return false;
    try {
      return timingSafeEqual(
        Buffer.from(received, 'hex'),
        Buffer.from(expected, 'hex'),
      );
    } catch {
      return received === expected;
    }
  }

  async createCheckout(invoice: Invoice, opts?: { channels?: string[] }) {
    if (!this.configured()) throw new PaydunyaError('PAYDUNYA_MISSING');
    if (invoice.amount <= 0) throw new PaydunyaError('AMOUNT_ZERO');
    if (invoice.status === 'payee') throw new PaydunyaError('ALREADY_PAID');
    if (invoice.status === 'annulee') throw new PaydunyaError('CANCELLED');

    const origin = siteUrl(this.config);
    const items: Record<
      string,
      {
        name: string;
        quantity: number;
        unit_price: string;
        total_price: string;
        description: string;
      }
    > = {};
    invoice.items.forEach((line, index) => {
      items[`item_${index}`] = {
        name: line.name,
        quantity: line.qty,
        unit_price: String(line.unitPrice),
        total_price: String(line.qty * line.unitPrice),
        description: '',
      };
    });

    let json: PaydunyaCreateResponse | null = null;
    let status = 0;
    try {
      const res = await fetch(`${API_BASE}/checkout-invoice/create`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          invoice: {
            total_amount: invoice.amount,
            description: `MAC NATION ${invoice.number}`,
            items,
            ...(opts?.channels?.length ? { channels: opts.channels } : {}),
            customer: invoice.clientName
              ? {
                  name: invoice.clientName,
                  ...(invoice.clientEmail
                    ? { email: invoice.clientEmail }
                    : {}),
                  phone: invoice.clientPhone.replace(/\D/g, '').slice(-9),
                }
              : undefined,
          },
          store: {
            name: 'MAC NATION',
            tagline: 'Barbershop Nord Foire, Dakar',
            website_url: origin,
          },
          custom_data: {
            invoice_id: invoice.id,
            invoice_number: invoice.number,
            booking_id: invoice.bookingId || '',
          },
          actions: {
            callback_url: `${origin}/api/paydunya/ipn`,
            return_url: `${origin}/paiement/retour?invoice=${invoice.id}`,
            cancel_url: `${origin}/paiement/annule?invoice=${invoice.id}`,
          },
        }),
      });
      status = res.status;
      json = (await res
        .json()
        .catch(() => null)) as PaydunyaCreateResponse | null;
      if (
        !res.ok ||
        json?.response_code !== '00' ||
        !json.token ||
        !json.response_text
      ) {
        this.logger.error(`PayDunya create ${status}: ${JSON.stringify(json)}`);
        throw new PaydunyaError(
          'PAYDUNYA_FAILED',
          json?.response_text || json?.description || `PAYDUNYA_${status}`,
        );
      }
    } catch (error) {
      if (error instanceof PaydunyaError) throw error;
      this.logger.error(`PayDunya injoignable: ${String(error)}`);
      throw new PaydunyaError('PAYDUNYA_FAILED');
    }

    try {
      await this.store.attachPaydunya(
        invoice.id,
        json.token,
        json.response_text,
      );
    } catch (error) {
      this.logger.error(
        `Sauvegarde du jeton PayDunya échouée: ${String(error)}`,
      );
    }
    return { token: json.token, url: json.response_text };
  }

  async startCheckout(invoiceId: string) {
    const invoice = await this.store.getInvoice(invoiceId);
    if (!invoice) throw new PaydunyaError('INVOICE_MISSING');
    if (
      invoice.paydunyaUrl &&
      invoice.paydunyaToken &&
      invoice.status !== 'payee'
    ) {
      return { token: invoice.paydunyaToken, url: invoice.paydunyaUrl };
    }
    return this.createCheckout(invoice);
  }

  async confirm(token: string) {
    if (!this.configured()) throw new PaydunyaError('PAYDUNYA_MISSING');
    const res = await fetch(
      `${API_BASE}/checkout-invoice/confirm/${encodeURIComponent(token)}`,
      { headers: this.headers() },
    );
    const json = (await res
      .json()
      .catch(() => null)) as PaydunyaConfirmResponse | null;
    if (!json) throw new PaydunyaError('PAYDUNYA_FAILED');
    return json;
  }

  async startSoftPay(opts: {
    invoiceId: string;
    method: SoftPayMethod;
    phone?: string;
    name?: string;
    email?: string;
  }): Promise<SoftPayResult> {
    const invoice = await this.store.getInvoice(opts.invoiceId);
    if (!invoice) throw new PaydunyaError('INVOICE_MISSING');
    const phone = localSnPhone(opts.phone || invoice.clientPhone);
    if (!isSnMobile(phone)) throw new PaydunyaError('PHONE_INVALID');
    const name = (
      opts.name ||
      invoice.clientName ||
      'Client MAC NATION'
    ).trim();
    const email = payerEmail(opts.email || invoice.clientEmail, phone);

    try {
      const checkout = await this.startCheckout(opts.invoiceId);
      return await this.requestOperatorSoftPay(
        opts.method,
        checkout.token,
        name,
        email,
        phone,
      );
    } catch (error) {
      this.logger.warn(
        `SoftPay direct indisponible, bascule sur la page opérateur: ${String(error)}`,
      );
    }

    const checkout = await this.createCheckout(invoice, {
      channels: [SOFTPAY_CHANNELS[opts.method]],
    });
    return {
      method: opts.method,
      url: checkout.url,
      message: operatorMessage(opts.method),
    };
  }

  async refreshInvoicePayment(invoiceId: string, method?: SoftPayMethod) {
    const invoice = await this.store.getInvoice(invoiceId);
    if (!invoice) throw new PaydunyaError('INVOICE_MISSING');
    if (invoice.status === 'payee') return invoice;
    const token = invoice.paydunyaToken;
    if (!token) return invoice;
    const confirmed = await this.confirm(token);
    if ((confirmed.status || '').toLowerCase() !== 'completed') return invoice;
    const paidMethod: PaymentMethod = method || 'paydunya';
    const result = await this.store.markInvoicePaid({
      invoiceId: invoice.id,
      paydunyaToken: token,
      method: paidMethod,
    });
    return result?.invoice || invoice;
  }

  /** Settles an invoice from an IPN callback, matched by id or PayDunya token. */
  async markPaid(invoiceId?: string, token?: string) {
    return this.store.markInvoicePaid({
      invoiceId: invoiceId || undefined,
      paydunyaToken: token || undefined,
      method: 'paydunya',
    });
  }

  parseIpnPayload(raw: unknown): PaydunyaIpn {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return this.parseIpnPayload(JSON.parse(raw));
      } catch {
        return {};
      }
    }
    if (typeof raw !== 'object') return {};
    const o = raw as Record<string, unknown>;
    if (o.data && typeof o.data === 'object') {
      return this.parseIpnPayload(o.data);
    }
    return {
      hash: typeof o.hash === 'string' ? o.hash : undefined,
      status: typeof o.status === 'string' ? o.status : undefined,
      token: typeof o.token === 'string' ? o.token : undefined,
      invoice: o.invoice as PaydunyaIpn['invoice'],
      custom_data: o.custom_data as PaydunyaIpn['custom_data'],
    };
  }

  private async requestOperatorSoftPay(
    method: SoftPayMethod,
    token: string,
    name: string,
    email: string,
    phone: string,
  ): Promise<SoftPayResult> {
    if (method === 'wave') {
      const json = await this.postSoftPay('/softpay/wave-senegal', {
        wave_senegal_fullName: name,
        wave_senegal_email: email,
        wave_senegal_phone: phone,
        wave_senegal_payment_token: token,
      });
      if (!json.url) {
        throw new PaydunyaError(
          'PAYDUNYA_FAILED',
          json.message || 'Wave n’a pas renvoyé de lien de paiement.',
        );
      }
      return {
        method,
        url: json.url,
        message: json.message || operatorMessage(method),
      };
    }

    if (method === 'orange') {
      const json = await this.postSoftPay('/softpay/new-orange-money-senegal', {
        customer_name: name,
        customer_email: email,
        phone_number: phone,
        invoice_token: token,
      });
      const qr = orangeQrFromUrl(json.url || '');
      const omUrl = json.other_url?.om_url || '';
      const maxitUrl = json.other_url?.maxit_url || '';
      if (!qr && !omUrl && !maxitUrl && !json.url) {
        throw new PaydunyaError(
          'PAYDUNYA_FAILED',
          json.message || 'Orange Money n’a pas renvoyé de QR code.',
        );
      }
      return {
        method,
        qr,
        omUrl,
        maxitUrl,
        url: omUrl || json.url,
        message:
          json.message ||
          'Scanne le QR avec Orange Money, ou ouvre l’application.',
      };
    }

    const json = await this.postSoftPay('/softpay/free-money-senegal', {
      customer_name: name,
      customer_email: email,
      phone_number: phone,
      payment_token: token,
    });
    return {
      method,
      url: json.url,
      message: json.message || operatorMessage(method),
    };
  }

  private async postSoftPay(path: string, body: Record<string, string>) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const json = (await res
      .json()
      .catch(() => null)) as SoftPayApiResponse | null;
    if (res.status === 404 || !json) {
      throw new PaydunyaError('SOFTPAY_UNAVAILABLE');
    }
    if (!res.ok || json.success === false) {
      this.logger.error(
        `SoftPay ${path} ${res.status}: ${JSON.stringify(json)}`,
      );
      throw new PaydunyaError('PAYDUNYA_FAILED', softPayError(json));
    }
    return json;
  }
}
