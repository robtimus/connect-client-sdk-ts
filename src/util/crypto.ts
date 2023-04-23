import * as crypto from "crypto";

export const subtle = crypto.webcrypto.subtle;
export const getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
export const randomUUID = crypto.webcrypto.randomUUID.bind(crypto.webcrypto);
