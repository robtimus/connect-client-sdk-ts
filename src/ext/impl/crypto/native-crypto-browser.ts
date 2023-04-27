// byteToHex copied from https://github.com/uuidjs/uuid/blob/v9.0.0/src/stringify.js

const byteToHex: string[] = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

export function randomUUID(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID !== "undefined") {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues !== "undefined") {
      const random = crypto.getRandomValues(new Uint8Array(16));
      random[6] = (random[6] & 0x0f) | 0x40;
      random[8] = (random[8] & 0x3f) | 0x80;
      return (
        byteToHex[random[0]] +
        byteToHex[random[1]] +
        byteToHex[random[2]] +
        byteToHex[random[3]] +
        "-" +
        byteToHex[random[4]] +
        byteToHex[random[5]] +
        "-" +
        byteToHex[random[6]] +
        byteToHex[random[7]] +
        "-" +
        byteToHex[random[8]] +
        byteToHex[random[9]] +
        "-" +
        byteToHex[random[10]] +
        byteToHex[random[11]] +
        byteToHex[random[12]] +
        byteToHex[random[13]] +
        byteToHex[random[14]] +
        byteToHex[random[15]]
      );
    }
  }
  throw new Error("Neither crypto.randomUUID nor crypto.getRandomValues is available");
}

export function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues !== "undefined") {
    return crypto.getRandomValues(array);
  }
  throw new Error("crypto.getRandomValues is not available");
}

export const subtle: SubtleCrypto | undefined = typeof crypto !== "undefined" ? crypto.subtle : undefined;

export function isAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.getRandomValues !== "undefined" && typeof crypto.subtle !== "undefined";
}
