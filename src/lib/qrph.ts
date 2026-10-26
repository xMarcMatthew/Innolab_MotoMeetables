// QR Ph (EMVCo merchant QR) payload check: starts with "000201", at most 1000 characters, and ends with
// "6304" + a CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) of everything before those 4 hex characters.
// Self-check: crc16("123456789") is 0x29B1, the published check value for CRC-16/CCITT-FALSE.
// The database only checks the format (set_my_payment_qr); this is the real checksum.
export function crc16(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= (text.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function isValidQrPh(text: string): boolean {
  if (text.length > 1000 || !text.startsWith("000201")) return false;
  const match = /6304([0-9A-Fa-f]{4})$/.exec(text);
  if (!match) return false;
  return crc16(text.slice(0, text.length - 4)) === match[1].toUpperCase();
}
