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

/** MTN or Airtel from a Uganda mobile prefix, or null when the number is not recognized. */
export function inferUgandaMobileNetwork(phone: string): "MTN" | "Airtel" | null {
  const storage = normalizeUgandaPhoneForStorage(phone);
  if (!/^256\d{9}$/.test(storage)) return null;
  const prefix = storage.slice(3, 5);
  if (["77", "78", "76", "79", "31", "39"].includes(prefix)) return "MTN";
  if (["70", "71", "73", "74", "75", "20"].includes(prefix)) return "Airtel";
  return null;
}

export function ugandaPhonesMatch(a: string, b: string): boolean {
  const left = normalizeUgandaPhoneForStorage(a);
  const right = normalizeUgandaPhoneForStorage(b);
  return left.length > 0 && left === right;
}
