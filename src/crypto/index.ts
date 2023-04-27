import { PaymentRequest } from "../model";

/**
 * An interface describing cryptography engines. Implementations are used to encrypt payment requests.
 */
export interface CryptoEngine {
  /**
   * Creates a random string each time it's called.
   */
  randomString(): string;
  /**
   * Encrypts a string using a provided public key.
   * @param payload The payload to encrypt.
   * @param keyId The identifier of the key that is used to encrypt sensitive data. Retrieved from the Ingenico Connect Client API.
   * @param publicKey The public key that is used to encrypt the sensitive data with. Retrieved from the Ingenico Connect Client API.
   * @returns A promise that contains the encrypted payload.
   */
  encrypt(payload: string, keyId: string, publicKey: string): Promise<string>;
}

/**
 * Responsible for encrypting {@link PaymentRequest} objects.
 */
export interface Encryptor {
  /**
   * Encrypts a payment request.
   * @param paymentRequest The payment request to encrypt.
   * @returns A promise that contains the encrypted payment request.
   * @throws If the payment request has no payment product set, or if the payment request is not valid.
   */
  encrypt(paymentRequest: PaymentRequest): Promise<string>;
}
