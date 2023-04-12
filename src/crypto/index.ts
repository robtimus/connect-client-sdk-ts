export interface JOSEEncryptor {
  encrypt(payload: string, keyId: string, publicKey: string): Promise<string>;
}

export const encryptionNotEnabled: JOSEEncryptor = {
  encrypt: () => Promise.reject("encryption is not enabled"),
};
