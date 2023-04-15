export interface JOSEEncryptor {
  encrypt(payload: string, keyId: string, publicKey: string): Promise<string>;
}
