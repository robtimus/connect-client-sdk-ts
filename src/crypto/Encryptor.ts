import { v4 as uuidv4 } from "uuid";
import { Device } from "../model";
import { KeyValuePair, PublicKey } from "../model";
import { PaymentRequest } from "../model/PaymentRequest";

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

function createEncryptedCustomerInput(clientSessionId: string, paymentRequest: PaymentRequest, device: Device): EncryptedCustomerInput {
  const values = paymentRequest.getUnmaskedValues();

  const encryptedCustomerInput: EncryptedCustomerInput = {
    clientSessionId,
    nonce: uuidv4(),
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

export class Encryptor {
  constructor(private readonly clientSessionId: string, private readonly publicKey: PublicKey, private readonly device: Device) {}

  async encrypt(paymentRequest: PaymentRequest): Promise<string> {
    if (!paymentRequest.getPaymentProduct()) {
      throw new Error("no PaymentProduct set");
    }
    const validationResult = paymentRequest.validate();
    if (!validationResult.valid) {
      throw validationResult.errors;
    }
    const joseEncryptor = this.device.getJOSEEncryptor();
    if (!joseEncryptor) {
      throw new Error("encryption not supported");
    }
    const encryptedCustomerInput = createEncryptedCustomerInput(this.clientSessionId, paymentRequest, this.device);
    const payload = JSON.stringify(encryptedCustomerInput);
    return joseEncryptor.encrypt(payload, this.publicKey.keyId, this.publicKey.publicKey);
  }
}

Object.freeze(Encryptor.prototype);
