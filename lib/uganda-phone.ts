/** Normalize Uganda MSISDN to storage form 256XXXXXXXXX. */
export function normalizeUgandaPhoneForStorage(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 && digits.startsWith("0")) {
    return `256${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `256${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("256")) {
    return digits;
  }
  return digits;
}

export function ugandaPhoneLocalDisplay(phone: string): string {
  const storage = normalizeUgandaPhoneForStorage(phone);
  if (storage.length === 12 && storage.startsWith("256")) {
    return `0${storage.slice(3)}`;
  }
  return phone.trim();
}

export function ugandaPhonesMatch(a: string, b: string): boolean {
  const left = normalizeUgandaPhoneForStorage(a);
  const right = normalizeUgandaPhoneForStorage(b);
  return left.length > 0 && left === right;
}
