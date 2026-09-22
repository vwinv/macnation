import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export type PaytechErrorCode =
  | 'PAYTECH_MISSING'
  | 'INVOICE_MISSING'
  | 'ALREADY_PAID'
  | 'CANCELLED'
  | 'AMOUNT_ZERO'
  | 'PHONE_INVALID'
  | 'PAYTECH_FAILED'
  | 'PENDING_EXPIRED';

export class PaytechError extends Error {
  constructor(
    readonly code: PaytechErrorCode,
    message?: string,
  ) {
    super(message || code);
    this.name = 'PaytechError';
  }
}

export type PaytechErrorMessages = Partial<Record<PaytechErrorCode, string>>;

const DEFAULTS: Record<PaytechErrorCode, string> = {
  PAYTECH_MISSING: 'Paiement Mobile Money indisponible pour le moment.',
  INVOICE_MISSING: 'Facture introuvable.',
  ALREADY_PAID: 'Cette facture est déjà payée.',
  CANCELLED: 'Cette facture est annulée.',
  AMOUNT_ZERO: 'Montant à confirmer au salon.',
  PHONE_INVALID: 'Indique un numéro sénégalais valide (77, 78, 76, 70…).',
  PAYTECH_FAILED: 'Impossible d’ouvrir le paiement. Réessaie.',
  PENDING_EXPIRED: 'Session de paiement expirée. Reprends la réservation.',
};

export function paytechException(
  error: unknown,
  fallback: string,
  overrides: PaytechErrorMessages = {},
): HttpException {
  if (error instanceof HttpException) return error;
  if (!(error instanceof PaytechError)) {
    return new BadGatewayException(fallback);
  }
  const message = overrides[error.code] || DEFAULTS[error.code];
  switch (error.code) {
    case 'PAYTECH_MISSING':
      return new ServiceUnavailableException(message);
    case 'INVOICE_MISSING':
      return new NotFoundException(message);
    case 'ALREADY_PAID':
    case 'CANCELLED':
    case 'AMOUNT_ZERO':
    case 'PHONE_INVALID':
    case 'PENDING_EXPIRED':
      return new BadRequestException(message);
    default:
      return new BadGatewayException(error.message || fallback);
  }
}
