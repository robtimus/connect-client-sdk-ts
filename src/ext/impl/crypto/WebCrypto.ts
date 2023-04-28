import { CryptoEngine } from "../../crypto";
import * as crypto from "./native-crypto";

const CEK_KEY_LENGTH = 512;
const IV_LENGTH = 128;

// from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey#examples
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode(...Array.from(new Uint8Array(buf)));
}

function createProtectedHeader(keyId: string): string {
  return JSON.stringify({
    alg: "RSA-OAEP",
    enc: "A256CBC-HS512",
    kid: keyId,
  });
}

function decodePemPublicKey(publickeyB64Encoded: string): Promise<CryptoKey> {
  const publickeyB64Decoded = atob(publickeyB64Encoded);
  const binaryDER = str2ab(publickeyB64Decoded);

  return crypto.subtle.importKey(
    "spki",
    binaryDER,
    {
      name: "RSA-OAEP",
      hash: "SHA-1",
    },
    false,
    ["encrypt"]
  );
}

async function encryptContentEncryptionKey(CEK: string, publicKey: CryptoKey): Promise<string> {
  return crypto.subtle
    .encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      str2ab(CEK)
    )
    .then(ab2str);
}

async function encryptPayload(payload: string, encKey: string, initializationVector: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    str2ab(encKey),
    {
      name: "AES-CBC",
    },
    false,
    ["encrypt"]
  );
  return crypto.subtle
    .encrypt(
      {
        name: "AES-CBC",
        iv: str2ab(initializationVector),
      },
      key,
      str2ab(payload)
    )
    .then(ab2str);
}

function calculateAdditionalAuthenticatedDataLength(encodededProtectedHeader: string): string {
  const array = new Uint8Array(8);
  let remaining = encodededProtectedHeader.length * 8;
  for (let i = array.length - 1; i >= 0; i--) {
    array[i] = remaining % 256;
    remaining /= 256;
  }
  return ab2str(array);
}

async function calculateHMAC(
  macKey: string,
  encodededProtectedHeader: string,
  initializationVector: string,
  cipherText: string,
  al: string
): Promise<string> {
  const hmacInput = [encodededProtectedHeader, initializationVector, cipherText, al].join("");

  const key = await crypto.subtle.importKey(
    "raw",
    str2ab(macKey),
    {
      name: "HMAC",
      hash: "SHA-512",
    },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, str2ab(hmacInput)).then(ab2str);
}

class WebCryptoCryptoEngine implements CryptoEngine {
  randomString(): string {
    return crypto.randomUUID();
  }

  async encrypt(payload: string, keyId: string, publicKey: string): Promise<string> {
    const protectedHeader = createProtectedHeader(keyId);
    const encodededProtectedHeader = btoa(protectedHeader);

    // Create ContentEncryptionKey, is a random byte[]
    const CEK = ab2str(crypto.getRandomValues(new Uint8Array(CEK_KEY_LENGTH / 8)));
    const rsaPublicKey = await decodePemPublicKey(publicKey);

    // Encrypt the contentEncryptionKey with the GC gateway publickey and encode it with Base64 encoding
    const encryptedContentEncryptionKey = await encryptContentEncryptionKey(CEK, rsaPublicKey);
    const encodedEncryptedContentEncryptionKey = btoa(encryptedContentEncryptionKey);

    // Split the contentEncryptionKey in ENC_KEY and MAC_KEY for using hmac
    const macKey = CEK.substring(0, CEK_KEY_LENGTH / 2 / 8);
    const encKey = CEK.substring(CEK_KEY_LENGTH / 2 / 8);

    // Create Initialization Vector
    const initializationVector = ab2str(crypto.getRandomValues(new Uint8Array(IV_LENGTH / 8)));
    const encodededinitializationVector = btoa(initializationVector);

    // Encrypt content with ContentEncryptionKey and Initialization Vector
    const cipherText = await encryptPayload(payload, encKey, initializationVector);
    const encodedCipherText = btoa(cipherText);

    // Create Additional Authenticated Data  and Additional Authenticated Data Length
    const al = calculateAdditionalAuthenticatedDataLength(encodededProtectedHeader);

    // Calculates HMAC
    const calculatedHmac = await calculateHMAC(macKey, encodededProtectedHeader, initializationVector, cipherText, al);

    // Truncate HMAC Value to Create Authentication Tag
    const authenticationTag = calculatedHmac.substring(0, calculatedHmac.length / 2);
    const encodedAuthenticationTag = btoa(authenticationTag);

    return Promise.resolve(
      [
        encodededProtectedHeader,
        encodedEncryptedContentEncryptionKey,
        encodededinitializationVector,
        encodedCipherText,
        encodedAuthenticationTag,
      ].join(".")
    );
  }
}

Object.freeze(WebCryptoCryptoEngine.prototype);

/**
 * Returns whether or not the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API">Web Crypto API</a> is available.
 * This can be used to determine whether or not {@link webCryptoCryptoEngine} can be used.
 * @returns True if {@link webCryptoCryptoEngine} can be used, or false otherwise.
 */
export function isWebCryptoAvailable(): boolean {
  return crypto.isAvailable();
}

/**
 * A crypto engine backed by the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API">Web Crypto API</a>.
 * This will work in modern browsers and supported Node.js versions. Attempting to use it in older browsers or Node.js versions will fail.
 * If needed, use {@link isWebCryptoAvailable} to determine whether or not this crypto engine can be used.
 */
export const webCryptoCryptoEngine: CryptoEngine = new WebCryptoCryptoEngine();
