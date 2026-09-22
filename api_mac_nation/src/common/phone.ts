export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('221') && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) {
    return `+221${digits.slice(1)}`;
  }
  if (digits.length === 9 && digits.startsWith('7')) return `+221${digits}`;
  if (input.trim().startsWith('+')) return `+${digits}`;
  return `+${digits}`;
}

export function isSnMobile(input: string) {
  return /^\+2217\d{8}$/.test(normalizePhone(input));
}

export function samePhone(a: string, b: string) {
  return Boolean(a && b && normalizePhone(a) === normalizePhone(b));
}

