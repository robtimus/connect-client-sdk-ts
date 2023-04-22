/**
 * @group unit:validation
 */

import { v4 as uuidv4 } from "uuid";
import { Encryptor } from "../../../src/crypto/Encryptor";
import { PaymentRequest } from "../../../src/model/PaymentRequest";
import { PublicKey } from "../../../src/model";
import { toPaymentProduct } from "../../../src/model/PaymentProduct";
import { MockDevice } from "../mock.test";

describe("Encryptor", () => {
  const clientSessionId = uuidv4();
  const publicKey: PublicKey = {
    keyId: uuidv4(),
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
    const encryptor = new Encryptor(
      clientSessionId,
      publicKey,
      {
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
    const encryptor = new Encryptor(
      clientSessionId,
      publicKey,
      {
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
      payload?: string;
      keyId?: string;
      publicKeyValue?: string;
    }

    test("without account on file", async () => {
      let inputCaptor: EncryptInput = {};
      const encrypt = (payload: string, keyId: string, publicKeyValue: string) => {
        inputCaptor = { payload, keyId, publicKeyValue };
        return Promise.resolve("encrypted");
      };
      const device = new MockDevice();
      const encryptor = new Encryptor(clientSessionId, publicKey, { encrypt }, device);
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue("expirationDate", "1230");
      await encryptor.encrypt(request);
      expect(inputCaptor.keyId).toBe(publicKey.keyId);
      expect(inputCaptor.publicKeyValue).toBe(publicKey.publicKey);

      const payload = JSON.parse(inputCaptor.payload || "{}");
      expect(payload).toHaveProperty("clientSessionId", clientSessionId);
      expect(payload).toHaveProperty("nonce");
      expect(payload).toHaveProperty("paymentProductId", product.id);
      expect(payload).not.toHaveProperty("accountOnFileId");
      expect(payload).toHaveProperty("tokenize", false);
      expect(payload).toHaveProperty("paymentValues", [{ key: "expirationDate", value: "1230" }]);
      const deviceInformation = device.getDeviceInformation();
      expect(payload).toHaveProperty("collectedDeviceInformation", {
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
      });
    });

    test("without account on file", async () => {
      let inputCaptor: EncryptInput = {};
      const encrypt = (payload: string, keyId: string, publicKeyValue: string) => {
        inputCaptor = { payload, keyId, publicKeyValue };
        return Promise.resolve("encrypted");
      };
      const device = new MockDevice();
      const encryptor = new Encryptor(clientSessionId, publicKey, { encrypt }, device);
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue("expirationDate", "1230");
      await encryptor.encrypt(request);
      expect(inputCaptor.keyId).toBe(publicKey.keyId);
      expect(inputCaptor.publicKeyValue).toBe(publicKey.publicKey);

      const payload = JSON.parse(inputCaptor.payload || "{}");
      expect(payload).toHaveProperty("clientSessionId", clientSessionId);
      expect(payload).toHaveProperty("nonce");
      expect(payload).toHaveProperty("paymentProductId", product.id);
      expect(payload).not.toHaveProperty("accountOnFileId");
      expect(payload).toHaveProperty("tokenize", false);
      expect(payload).toHaveProperty("paymentValues", [{ key: "expirationDate", value: "1230" }]);
      const deviceInformation = device.getDeviceInformation();
      expect(payload).toHaveProperty("collectedDeviceInformation", {
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
      });
    });

    test("with account on file", async () => {
      let inputCaptor: EncryptInput = {};
      const encrypt = (payload: string, keyId: string, publicKeyValue: string) => {
        inputCaptor = { payload, keyId, publicKeyValue };
        return Promise.resolve("encrypted");
      };
      const device = new MockDevice();
      const encryptor = new Encryptor(clientSessionId, publicKey, { encrypt }, device);
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setAccountOnFile(product.accountsOnFile[0]);
      request.setValue("expirationDate", "1230");
      request.setTokenize(true);
      await encryptor.encrypt(request);
      expect(inputCaptor.keyId).toBe(publicKey.keyId);
      expect(inputCaptor.publicKeyValue).toBe(publicKey.publicKey);

      const payload = JSON.parse(inputCaptor.payload || "{}");
      expect(payload).toHaveProperty("clientSessionId", clientSessionId);
      expect(payload).toHaveProperty("nonce");
      expect(payload).toHaveProperty("paymentProductId", product.id);
      expect(payload).toHaveProperty("accountOnFileId", product.accountsOnFile[0].id);
      expect(payload).toHaveProperty("tokenize", true);
      expect(payload).toHaveProperty("paymentValues", [{ key: "expirationDate", value: "1230" }]);
      const deviceInformation = device.getDeviceInformation();
      expect(payload).toHaveProperty("collectedDeviceInformation", {
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
      });
    });
  });
});
