/**
 * @group unit:crypto
 */

import { newEncryptor } from "../../../src/crypto/Encryptor";
import { PaymentRequest, PublicKey } from "../../../src/model";
import { toPaymentProduct } from "../../../src/model/PaymentProduct";
import { MockDevice } from "../mock.test";

describe("Encryptor", () => {
  const clientSessionId = "client-session-id";
  const publicKey: PublicKey = {
    keyId: "key-id",
    publicKey:
      "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkiJlGL1QjUnGDLpMNBtZPYVtOU121jfFcV4WrZayfw9Ib/1AtPBHP/0ZPocdA23zDh6aB+QiOQEkHZlfnelBNnEzEu4ibda3nDdjSrKveSiQPyB5X+u/IS3CR48B/g4QJ+mcMV9hoFt6Hx3R99A0HWMs4um8elQsgB11MsLmGb1SuLo0S1pgL3EcckXfBDNMUBMQ9EtLC9zQW6Y0kx6GFXHgyjNb4yixXfjo194jfhei80sVQ49Y/SHBt/igATGN1l18IBDtO0eWmWeBckwbNkpkPLAvJfsfa3JpaxbXwg3rTvVXLrIRhvMYqTsQmrBIJDl7F6igPD98Y1FydbKe5QIDAQAB",
  };
  const product = toPaymentProduct({
    accountsOnFile: [
      {
        attributes: [],
        displayHints: {
          labelTemplate: [],
          logo: "",
        },
        id: 1,
        paymentProductId: 1,
      },
    ],
    allowsInstallments: false,
    allowsRecurring: false,
    allowsTokenization: false,
    autoTokenized: false,
    deviceFingerprintEnabled: false,
    displayHints: {
      displayOrder: 0,
      logo: "",
    },
    fields: [
      {
        dataRestrictions: {
          isRequired: true,
          validators: {
            expirationDate: {},
          },
        },
        displayHints: {
          alwaysShow: false,
          displayOrder: 0,
          formElement: {
            type: "",
          },
          obfuscate: false,
          mask: "{{99}}-{{99}}",
        },
        id: "expirationDate",
        type: "",
      },
    ],
    id: 1,
    mobileIntegrationLevel: "",
    paymentMethod: "",
    usesRedirectionTo3rdParty: false,
  });

  test("product not set", async () => {
    const encryptor = newEncryptor(
      clientSessionId,
      publicKey,
      {
        randomString: jest.fn(),
        encrypt: jest.fn(),
      },
      new MockDevice()
    );
    const request = new PaymentRequest();
    const onSuccess = jest.fn();
    const result = await encryptor
      .encrypt(request)
      .then(onSuccess)
      .catch((reason) => reason);
    expect(onSuccess).not.toBeCalled();
    expect(result).toStrictEqual(new Error("no PaymentProduct set"));
  });

  test("validation fails", async () => {
    const encryptor = newEncryptor(
      clientSessionId,
      publicKey,
      {
        randomString: jest.fn(),
        encrypt: jest.fn(),
      },
      new MockDevice()
    );
    const request = new PaymentRequest();
    request.setPaymentProduct(product);
    const onSuccess = jest.fn();
    const result = await encryptor
      .encrypt(request)
      .then(onSuccess)
      .catch((reason) => reason);
    expect(onSuccess).not.toBeCalled();
    expect(result).toStrictEqual([{ fieldId: "expirationDate", ruleId: "required" }]);
  });

  describe("success", () => {
    interface EncryptInput {
      payload: string;
      keyId: string;
      publicKeyValue: string;
    }

    test("without account on file", async () => {
      const encrypt = (payload: string, keyId: string, publicKeyValue: string) => {
        const input: EncryptInput = { payload, keyId, publicKeyValue };
        return Promise.resolve(JSON.stringify(input));
      };
      const device = new MockDevice();
      const encryptor = newEncryptor(
        clientSessionId,
        publicKey,
        {
          randomString: () => "random-nonce",
          encrypt,
        },
        device
      );
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue("expirationDate", "1230");
      const input: EncryptInput = await encryptor.encrypt(request).then(JSON.parse);
      expect(input.keyId).toBe(publicKey.keyId);
      expect(input.publicKeyValue).toBe(publicKey.publicKey);
      const payload = JSON.parse(input.payload);
      const deviceInformation = device.getDeviceInformation();
      expect(payload).toStrictEqual({
        clientSessionId,
        nonce: "random-nonce",
        paymentProductId: product.id,
        tokenize: false,
        paymentValues: [
          {
            key: "expirationDate",
            value: "1230",
          },
        ],
        collectedDeviceInformation: {
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
        },
      });
    });

    test("with account on file", async () => {
      const encrypt = (payload: string, keyId: string, publicKeyValue: string) => {
        const input: EncryptInput = { payload, keyId, publicKeyValue };
        return Promise.resolve(JSON.stringify(input));
      };
      const device = new MockDevice();
      const encryptor = newEncryptor(
        clientSessionId,
        publicKey,
        {
          randomString: () => "random-nonce",
          encrypt,
        },
        device
      );
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setAccountOnFile(product.accountsOnFile[0]);
      request.setValue("expirationDate", "1230");
      request.setTokenize(true);
      const input: EncryptInput = await encryptor.encrypt(request).then(JSON.parse);
      expect(input.keyId).toBe(publicKey.keyId);
      expect(input.publicKeyValue).toBe(publicKey.publicKey);
      const payload = JSON.parse(input.payload);
      const deviceInformation = device.getDeviceInformation();
      expect(payload).toStrictEqual({
        clientSessionId,
        nonce: "random-nonce",
        paymentProductId: product.id,
        accountOnFileId: product.accountsOnFile[0].id,
        tokenize: true,
        paymentValues: [
          {
            key: "expirationDate",
            value: "1230",
          },
        ],
        collectedDeviceInformation: {
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
        },
      });
    });
  });
});
