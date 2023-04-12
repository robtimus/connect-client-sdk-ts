import * as forge from "node-forge";
import { JOSEEncryptor } from ".";

const CEK_KEY_LENGTH = 512;
const IV_LENGTH = 128;

function base64UrlEncode(str: string): string {
  return forge.util.encode64(str).split("=")[0].replace(/\+/g, "-").replace(/\//g, "_");
}

function createProtectedHeader(keyId: string): string {
  return JSON.stringify({
    alg: "RSA-OAEP",
    enc: "A256CBC-HS512",
    kid: keyId,
  });
}

function decodePemPublicKey(publickeyB64Encoded: string): forge.pki.rsa.PublicKey {
  // step 1: base64decode
  const publickeyB64Decoded = forge.util.decode64(publickeyB64Encoded);
  // create a bytebuffer with these bytes
  const buffer2 = forge.util.createBuffer(publickeyB64Decoded, "raw");
  // convert DER to ASN1 object
  const publickeyObject2 = forge.asn1.fromDer(buffer2);
  // convert to publicKey object
  return forge.pki.publicKeyFromAsn1(publickeyObject2) as forge.pki.rsa.PublicKey;
}

function encryptContentEncryptionKey(CEK: string, publicKey: forge.pki.rsa.PublicKey): string {
  // encrypt CEK with OAEP+SHA-1+MGF1Padding
  return publicKey.encrypt(CEK, "RSA-OAEP");
}

function encryptPayload(payload: string, encKey: string, initializationVector: string): string {
  const cipher = forge.cipher.createCipher("AES-CBC", encKey);
  cipher.start({
    iv: initializationVector,
  });
  cipher.update(forge.util.createBuffer(payload));
  cipher.finish();
  return cipher.output.bytes();
}

function calculateAdditionalAuthenticatedDataLength(encodededProtectedHeader: string): string {
  const buffer = forge.util.createBuffer(encodededProtectedHeader);
  const lengthInBits = buffer.length() * 8;

  const buffer2 = forge.util.createBuffer();
  // convert int to 64bit big endian
  buffer2.putInt32(0);
  buffer2.putInt32(lengthInBits);
  return buffer2.bytes();
}

function calculateHMAC(macKey: string, encodededProtectedHeader: string, initializationVector: string, cipherText: string, al: string): string {
  const buffer = forge.util.createBuffer();
  buffer.putBytes(encodededProtectedHeader);
  buffer.putBytes(initializationVector);
  buffer.putBytes(cipherText);
  buffer.putBytes(al);

  const hmacInput = buffer.bytes();

  const hmac = forge.hmac.create();
  hmac.start("sha512", macKey);
  hmac.update(hmacInput);
  return hmac.digest().bytes();
}

class ForgeJOSEEncryptor implements JOSEEncryptor {
  encrypt(payload: string, keyId: string, publicKey: string): Promise<string> {
    const protectedHeader = createProtectedHeader(keyId);
    const encodededProtectedHeader = base64UrlEncode(protectedHeader);

    // Create ContentEncryptionKey, is a random byte[]
    const CEK = forge.random.getBytesSync(CEK_KEY_LENGTH / 8);
    const rsaPublicKey = decodePemPublicKey(publicKey);

    // Encrypt the contentEncryptionKey with the GC gateway publickey and encode it with Base64 encoding
    const encryptedContentEncryptionKey = encryptContentEncryptionKey(CEK, rsaPublicKey);
    const encodedEncryptedContentEncryptionKey = base64UrlEncode(encryptedContentEncryptionKey);

    // Split the contentEncryptionKey in ENC_KEY and MAC_KEY for using hmac
    const macKey = CEK.substring(0, CEK_KEY_LENGTH / 2 / 8);
    const encKey = CEK.substring(CEK_KEY_LENGTH / 2 / 8);

    // Create Initialization Vector
    const initializationVector = forge.random.getBytesSync(IV_LENGTH / 8);
    const encodededinitializationVector = base64UrlEncode(initializationVector);

    // Encrypt content with ContentEncryptionKey and Initialization Vector
    const cipherText = encryptPayload(payload, encKey, initializationVector);
    const encodedCipherText = base64UrlEncode(cipherText);

    // Create Additional Authenticated Data  and Additional Authenticated Data Length
    const al = calculateAdditionalAuthenticatedDataLength(encodededProtectedHeader);

    // Calculates HMAC
    const calculatedHmac = calculateHMAC(macKey, encodededProtectedHeader, initializationVector, cipherText, al);

    // Truncate HMAC Value to Create Authentication Tag
    const authenticationTag = calculatedHmac.substring(0, calculatedHmac.length / 2);
    const encodedAuthenticationTag = base64UrlEncode(authenticationTag);

    return Promise.resolve(`${encodededProtectedHeader}.${encodedEncryptedContentEncryptionKey}.${encodededinitializationVector}.${encodedCipherText}.${encodedAuthenticationTag}`);
  }
}

Object.freeze(ForgeJOSEEncryptor.prototype);

export const forgeEncryptor: JOSEEncryptor = new ForgeJOSEEncryptor();
