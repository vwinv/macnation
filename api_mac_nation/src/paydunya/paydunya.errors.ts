import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export type PaydunyaErrorCode =
  | 'PAYDUNYA_MISSING'
  | 'INVOICE_MISSING'
  | 'ALREADY_PAID'
  | 'CANCELLED'
  | 'AMOUNT_ZERO'
  | 'PHONE_INVALID'
  | 'SOFTPAY_UNAVAILABLE'
  | 'PAYDUNYA_FAILED';

export class PaydunyaError extends Error {
  constructor(
    readonly code: PaydunyaErrorCode,
    message?: string,
  ) {
    super(message || code);
    this.name = 'PaydunyaError';
  }
}

export type ErrorMessages = Partial<Record<PaydunyaErrorCode, string>>;

const DEFAULTS: Record<PaydunyaErrorCode, string> = {
  PAYDUNYA_MISSING: 'Paiement Mobile Money indisponible pour le moment.',
  INVOICE_MISSING: 'Facture introuvable.',
  ALREADY_PAID: 'Cette facture est déjà payée.',
  CANCELLED: 'Cette facture est annulée.',
  AMOUNT_ZERO: 'Montant à confirmer au salon.',
  PHONE_INVALID: 'Indique un numéro sénégalais valide (77, 78, 76, 70…).',
  SOFTPAY_UNAVAILABLE: 'Paiement Mobile Money indisponible pour le moment.',
  PAYDUNYA_FAILED: 'Impossible d’ouvrir le paiement. Réessaie.',
};

/**
 * Turns a PaydunyaError into the same status + French message the Next.js route
 * used to return, so the website keeps reading identical JSON.
 */
export function paydunyaException(
  error: unknown,
  fallback: string,
  overrides: ErrorMessages = {},
): HttpException {
  if (error instanceof HttpException) return error;
  if (!(error instanceof PaydunyaError)) {
    return new BadGatewayException(fallback);
  }
  const message = overrides[error.code] || DEFAULTS[error.code];
  switch (error.code) {
    case 'PAYDUNYA_MISSING':
    case 'SOFTPAY_UNAVAILABLE':
      return new ServiceUnavailableException(message);
    case 'INVOICE_MISSING':
      return new NotFoundException(message);
    case 'ALREADY_PAID':
    case 'CANCELLED':
    case 'AMOUNT_ZERO':
    case 'PHONE_INVALID':
      return new BadRequestException(message);
    default:
      return new BadGatewayException(error.message || fallback);
  }
}
