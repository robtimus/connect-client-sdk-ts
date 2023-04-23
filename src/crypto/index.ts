export interface CryptoEngine {
  randomString(): string;
  encrypt(payload: string, keyId: string, publicKey: string): Promise<string>;
}
