import * as crypto from "crypto";

export const subtle: SubtleCrypto = crypto.webcrypto.subtle;
export const getRandomValues: (array: Uint8Array) => Uint8Array = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
export const randomUUID: () => string =
  typeof crypto.webcrypto.randomUUID !== "undefined" ? crypto.webcrypto.randomUUID.bind(crypto.webcrypto) : crypto.randomUUID;

export function isAvailable(): boolean {
  return true;
}
