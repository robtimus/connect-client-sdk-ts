import * as crypto from "crypto";

export const subtle: SubtleCrypto = crypto.webcrypto.subtle;
export const getRandomValues: (array: Uint8Array) => Uint8Array = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
export const randomUUID: () => string = crypto.webcrypto.randomUUID.bind(crypto.webcrypto);

export function isAvailable(): boolean {
  return true;
}
