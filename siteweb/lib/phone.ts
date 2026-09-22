export function hasSnPhone(phone: string | undefined | null) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 9;
}

export function whatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return "";
  const intl = digits.startsWith("221") ? digits : `221${digits}`;
  return `https://wa.me/${intl}`;
}

export function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return "";
  const intl = digits.startsWith("221") ? digits : `221${digits}`;
  return `tel:+${intl}`;
}
