import { Encryptor, KeyValuePair, PaymentRequest, PublicKey } from "..";
import { Device } from "../../ext";
import { CryptoEngine } from "../../ext/crypto";

interface BrowserData {
  javaScriptEnabled: true;
  javaEnabled: boolean;
  colorDepth: number;
  screenHeight: number;
  screenWidth: number;
  innerHeight: number;
  innerWidth: number;
}

interface DeviceInformation {
  timezoneOffsetUtcMinutes: number;
  locale: string;
  browserData: BrowserData;
}

interface EncryptedCustomerInput {
  clientSessionId: string;
  nonce: string;
  paymentProductId: number;
  accountOnFileId?: number;
  tokenize: boolean;
  paymentValues: KeyValuePair[];
  collectedDeviceInformation: DeviceInformation;
}

function collectDeviceInformation(device: Device): DeviceInformation {
  const deviceInformation = device.getDeviceInformation();
  return {
    timezoneOffsetUtcMinutes: deviceInformation.timezoneOffsetUtcMinutes,
    locale: deviceInformation.locale,
    browserData: {
      javaScriptEnabled: true,
      javaEnabled: deviceInformation.javaEnabled,
      colorDepth: deviceInformation.colorDepth,
      screenHeight: deviceInformation.screenHeight,
      screenWidth: deviceInformation.screenWidth,
      innerHeight: deviceInformation.innerHeight,
      innerWidth: deviceInformation.innerWidth,
    },
  };
}

function createEncryptedCustomerInput(
  clientSessionId: string,
  nonce: string,
  paymentRequest: PaymentRequest,
  device: Device
): EncryptedCustomerInput {
  const values = paymentRequest.getUnmaskedValues();

  const encryptedCustomerInput: EncryptedCustomerInput = {
    clientSessionId,
    nonce,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    paymentProductId: paymentRequest.getPaymentProduct()!.id,
    tokenize: paymentRequest.getTokenize(),
    paymentValues: Object.keys(values).map((fieldId) => ({
      key: fieldId,
      value: values[fieldId] as string,
    })),
    collectedDeviceInformation: collectDeviceInformation(device),
  };
  const accountOnFile = paymentRequest.getAccountOnFile();
  if (accountOnFile) {
    encryptedCustomerInput.accountOnFileId = accountOnFile.id;
  }
  return encryptedCustomerInput;
}

class EncryptorImpl implements Encryptor {
  readonly #clientSessionId: string;
  readonly #retrievePublicKey: () => Promise<PublicKey>;
  readonly #engine: CryptoEngine;
  readonly #device: Device;

  constructor(clientSessionId: string, retrievePublicKey: () => Promise<PublicKey>, engine: CryptoEngine, device: Device) {
    this.#clientSessionId = clientSessionId;
    this.#retrievePublicKey = retrievePublicKey;
    this.#engine = engine;
    this.#device = device;
  }

  /**
   * Encrypts a payment request.
   * @param paymentRequest The payment request to encrypt.
   * @returns A promise that contains the encrypted payment request.
   * @throws If the payment request is not valid.
   */
  async encrypt(paymentRequest: PaymentRequest): Promise<string> {
    if (!paymentRequest.isValid()) {
      throw new Error("PaymentRequest has not been successfully validated");
    }
    const nonce = this.#engine.randomString();
    const encryptedCustomerInput = createEncryptedCustomerInput(this.#clientSessionId, nonce, paymentRequest, this.#device);
    const payload = JSON.stringify(encryptedCustomerInput);
    const publicKey = await this.#retrievePublicKey();
    return this.#engine.encrypt(payload, publicKey.keyId, publicKey.publicKey);
  }
}

Object.freeze(EncryptorImpl.prototype);

export function newEncryptor(clientSessionId: string, retrievePublicKey: () => Promise<PublicKey>, engine: CryptoEngine, device: Device): Encryptor {
  return new EncryptorImpl(clientSessionId, retrievePublicKey, engine, device);
}
