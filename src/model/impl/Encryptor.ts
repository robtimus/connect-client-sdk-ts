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
  constructor(
    private readonly clientSessionId: string,
    private readonly publicKey: PublicKey,
    private readonly engine: CryptoEngine,
    private readonly device: Device
  ) {}

  /**
   * Encrypts a payment request.
   * @param paymentRequest The payment request to encrypt.
   * @returns A promise that contains the encrypted payment request.
   * @throws If the payment request has no payment product set, or if the payment request is not valid.
   */
  async encrypt(paymentRequest: PaymentRequest): Promise<string> {
    if (!paymentRequest.getPaymentProduct()) {
      throw new Error("no PaymentProduct set");
    }
    const validationResult = paymentRequest.validate();
    if (!validationResult.valid) {
      throw validationResult.errors;
    }
    const nonce = this.engine.randomString();
    const encryptedCustomerInput = createEncryptedCustomerInput(this.clientSessionId, nonce, paymentRequest, this.device);
    const payload = JSON.stringify(encryptedCustomerInput);
    return this.engine.encrypt(payload, this.publicKey.keyId, this.publicKey.publicKey);
  }
}

Object.freeze(EncryptorImpl.prototype);

export function newEncryptor(clientSessionId: string, publicKey: PublicKey, engine: CryptoEngine, device: Device): Encryptor {
  return new EncryptorImpl(clientSessionId, publicKey, engine, device);
}
