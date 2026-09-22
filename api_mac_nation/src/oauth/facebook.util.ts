import { createHmac, timingSafeEqual } from 'crypto';

/** Facebook signed_request from the data-deletion callback. */
export function parseFacebookSignedRequest(
  signedRequest: string,
  appSecret: string,
): Record<string, unknown> | null {
  const parts = signedRequest.split('.');
  if (parts.length !== 2) return null;
  const [encodedSig, encodedPayload] = parts;
  let signature: Buffer;
  let payloadBytes: Buffer;
  try {
    signature = decodeBase64Url(encodedSig);
    payloadBytes = decodeBase64Url(encodedPayload);
  } catch {
    return null;
  }
  const expected = createHmac('sha256', appSecret)
    .update(encodedPayload)
    .digest();
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(signature, expected)
  ) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(payloadBytes.toString('utf8'));
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function isJwtCredential(credential: string) {
  return credential.split('.').length === 3;
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(`${padded}${pad}`, 'base64');
}
