import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { paydunyaException, PaydunyaError } from './paydunya.errors';
import { PaydunyaService, type SoftPayMethod } from './paydunya.service';

const SOFTPAY_METHODS: SoftPayMethod[] = ['wave', 'orange', 'free'];

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function softPayMethod(value: unknown): SoftPayMethod | null {
  const method = text(value);
  return SOFTPAY_METHODS.includes(method as SoftPayMethod)
    ? (method as SoftPayMethod)
    : null;
}

@Controller('paydunya')
export class PaydunyaController {
  private readonly logger = new Logger(PaydunyaController.name);

  constructor(private readonly paydunya: PaydunyaService) {}

  @Post('checkout')
  @HttpCode(200)
  async checkout(@Body() body: unknown) {
    const invoiceId = text((body as { invoiceId?: unknown } | null)?.invoiceId);
    if (!invoiceId) throw new BadRequestException('Facture manquante.');
    try {
      const checkout = await this.paydunya.startCheckout(invoiceId);
      return { url: checkout.url, token: checkout.token };
    } catch (error) {
      throw paydunyaException(error, 'Impossible d’ouvrir PayDunya.');
    }
  }

  @Post('softpay')
  @HttpCode(200)
  async softpay(@Body() body: unknown) {
    const payload = (body || {}) as {
      invoiceId?: unknown;
      method?: unknown;
      phone?: unknown;
      name?: unknown;
      email?: unknown;
    };
    const invoiceId = text(payload.invoiceId);
    const method = softPayMethod(payload.method);
    if (!invoiceId) throw new BadRequestException('Facture manquante.');
    if (!method) {
      throw new BadRequestException('Choisis Wave, Orange Money ou Free.');
    }
    try {
      return await this.paydunya.startSoftPay({
        invoiceId,
        method,
        phone: text(payload.phone),
        name: text(payload.name),
        email: text(payload.email),
      });
    } catch (error) {
      throw paydunyaException(error, 'Impossible de lancer le paiement.');
    }
  }

  @Get('status')
  async status(
    @Query('invoice') invoice?: string,
    @Query('method') method?: string,
  ) {
    const invoiceId = text(invoice);
    if (!invoiceId) throw new BadRequestException('Facture manquante.');
    try {
      const found = await this.paydunya.refreshInvoicePayment(
        invoiceId,
        softPayMethod(method) || undefined,
      );
      return { status: found.status, paid: found.status === 'payee' };
    } catch (error) {
      if (error instanceof PaydunyaError && error.code === 'INVOICE_MISSING') {
        throw paydunyaException(error, 'Facture introuvable.');
      }
      this.logger.warn(`Statut PayDunya indisponible: ${String(error)}`);
      return { paid: false, status: 'envoyee' };
    }
  }

  @Get('ipn')
  ipnProbe() {
    return { ok: true };
  }

  @Post('ipn')
  @HttpCode(200)
  async ipn(@Body() body: unknown) {
    const ipn = this.paydunya.parseIpnPayload(body);
    if (!ipn.hash || !this.paydunya.hashValid(ipn.hash)) {
      throw new UnauthorizedException('Hash invalide.');
    }

    const token = ipn.invoice?.token || ipn.token || '';
    const invoiceId = ipn.custom_data?.invoice_id;
    const status = (ipn.status || '').toLowerCase();

    if (token) {
      try {
        const confirmed = await this.paydunya.confirm(token);
        const confirmedStatus = (confirmed.status || status).toLowerCase();
        if (confirmedStatus === 'completed') {
          await this.paydunya.markPaid(invoiceId, token);
        }
      } catch (error) {
        this.logger.error(`Confirmation PayDunya échouée: ${String(error)}`);
        if (status === 'completed') {
          await this.paydunya.markPaid(invoiceId, token);
        }
      }
    } else if (status === 'completed' && invoiceId) {
      await this.paydunya.markPaid(invoiceId, '');
    }

    return { ok: true };
  }
}
