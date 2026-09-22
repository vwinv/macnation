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
import { paytechException } from './paytech.errors';
import { PaytechService, type SoftPayMethod } from './paytech.service';

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

@Controller('paytech')
export class PaytechController {
  private readonly logger = new Logger(PaytechController.name);

  constructor(private readonly paytech: PaytechService) {}

  @Post('checkout')
  @HttpCode(200)
  checkout(@Body() body: unknown) {
    return this.start(body);
  }

  /** Same body as checkout — kept so le bouton Wave/Orange/Free du site reste inchangé. */
  @Post('softpay')
  @HttpCode(200)
  softpay(@Body() body: unknown) {
    return this.start(body);
  }

  @Get('status')
  async status(
    @Query('invoice') invoice?: string,
    @Query('pending') pending?: string,
  ) {
    const pendingId = text(pending);
    if (pendingId) {
      try {
        return await this.paytech.refreshPending(pendingId);
      } catch (error) {
        throw paytechException(error, 'Paiement introuvable.');
      }
    }
    const invoiceId = text(invoice);
    if (!invoiceId) throw new BadRequestException('Facture manquante.');
    try {
      return await this.paytech.refreshInvoice(invoiceId);
    } catch (error) {
      throw paytechException(error, 'Facture introuvable.');
    }
  }

  @Get('ipn')
  ipnProbe() {
    return { ok: true };
  }

  @Post('ipn')
  @HttpCode(200)
  async ipn(@Body() body: unknown) {
    const result = await this.paytech.handleIpn(body);
    if (!result.ok) {
      this.logger.warn('IPN PayTech rejeté (HMAC / SHA256 invalides).');
      throw new UnauthorizedException('Notification PayTech invalide.');
    }
    return { ok: true };
  }

  private async start(body: unknown) {
    const payload = (body || {}) as {
      invoiceId?: unknown;
      pendingId?: unknown;
      method?: unknown;
      phone?: unknown;
      name?: unknown;
      email?: unknown;
      source?: unknown;
    };
    const invoiceId = text(payload.invoiceId);
    const pendingId = text(payload.pendingId);
    if (!invoiceId && !pendingId) {
      throw new BadRequestException('Paiement manquant.');
    }
    const method = softPayMethod(payload.method);
    const source = text(payload.source) === 'app' ? 'app' : 'site';
    try {
      return await this.paytech.startCheckout({
        invoiceId: invoiceId || undefined,
        pendingId: pendingId || undefined,
        method: method || undefined,
        phone: text(payload.phone),
        name: text(payload.name),
        email: text(payload.email),
        source,
      });
    } catch (error) {
      throw paytechException(error, 'Impossible d’ouvrir PayTech.');
    }
  }
}
