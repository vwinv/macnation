import type { ConfigService } from '@nestjs/config';

export const DEFAULT_SITE_URL = 'https://mac-nation.vercel.app';

/** Origin of the public website, used for PayTech IPN and return pages. */
export function siteUrl(config: ConfigService) {
  const explicit =
    config.get<string>('SITE_URL') || config.get<string>('APP_URL') || '';
  return (explicit || DEFAULT_SITE_URL).replace(/\/$/, '');
}

/** PayTech n’accepte que du HTTPS et exige `ipn_url` si aucun IPN n’est défini au dashboard. */
export function paytechIpnUrl(config: ConfigService) {
  const explicit = (config.get<string>('PAYTECH_IPN_URL') || '').trim().replace(
    /\/$/,
    '',
  );
  if (explicit.startsWith('https://')) return explicit;
  const origin = siteUrl(config);
  const httpsOrigin = origin.startsWith('https://') ? origin : DEFAULT_SITE_URL;
  return `${httpsOrigin}/api/paytech/ipn`;
}
