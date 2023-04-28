/**
 * @group unit:session
 */

import { Session } from "../../src/Session";
import { api } from "../../src/communicator/model";
import {
  CustomerDetailsRequest,
  DeviceFingerprintRequest,
  MobilePaymentProductSession302SpecificInput,
  PaymentContext,
  PaymentRequest,
  SessionDetails,
} from "../../src/model";
import { PP_APPLE_PAY, PP_BANCONTACT, PP_GOOGLE_PAY, toBasicPaymentProducts, toPaymentProduct } from "../../src/model/impl/PaymentProduct";
import { ApplePayClient, GooglePayClient } from "../../src/ext";
import { sdkIdentifier } from "../../src/util/metadata";
import { HttpResponse } from "../../src/ext/http";
import { CapturedHttpRequest, MockDevice, Mocks, notImplementedResponse } from "./test-util";

describe("Session", () => {
  const sessionDetails: SessionDetails = {
    clientSessionId: "client-session-id",
    assetUrl: "http://localhost/assets",
    clientApiUrl: "http://localhost/client",
    customerId: "customer-id",
  };
  const minimalPaymentContext: PaymentContext = {
    amountOfMoney: {
      amount: 1000,
      currencyCode: "EUR",
    },
    countryCode: "NL",
  };
  const fullPaymentContext: PaymentContext = {
    amountOfMoney: {
      amount: 1000,
      currencyCode: "EUR",
    },
    countryCode: "NL",
    isInstallments: false,
    isRecurring: true,
    locale: "en_GB",
    paymentProductSpecificInputs: {
      applePay: {
        merchantName: "TEST",
        acquirerCountry: "GB",
      },
      bancontact: {
        forceBasicFlow: true,
      },
      googlePay: {
        gatewayMerchantId: "GMID",
        merchantId: "MID",
        acquirerCountry: "GB",
        merchantName: "TEST",
      },
    },
  };

  const products: api.PaymentProducts = {
    paymentProducts: [
      {
        accountsOnFile: [
          {
            attributes: [],
            displayHints: {
              labelTemplate: [],
              logo: "1.png",
            },
            id: 1,
            paymentProductId: 1,
          },
        ],
        allowsInstallments: false,
        allowsRecurring: true,
        allowsTokenization: true,
        autoTokenized: false,
        deviceFingerprintEnabled: true,
        displayHints: {
          displayOrder: 1,
          logo: "1.png",
        },
        fields: [
          {
            dataRestrictions: {
              isRequired: true,
              validators: {},
            },
            displayHints: {
              alwaysShow: true,
              displayOrder: 2,
              formElement: {
                type: "text",
              },
              obfuscate: false,
            },
            id: "expirationDate",
            type: "numerictype",
          },
          {
            dataRestrictions: {
              isRequired: true,
              validators: {},
            },
            displayHints: {
              alwaysShow: true,
              displayOrder: 1,
              formElement: {
                type: "text",
              },
              obfuscate: false,
              tooltip: {
                image: "card.png",
              },
            },
            id: "cardNumber",
            type: "numerictype",
          },
          {
            dataRestrictions: {
              isRequired: true,
              validators: {},
            },
            id: "cvv",
            type: "numerictype",
          },
          {
            dataRestrictions: {
              isRequired: false,
              validators: {},
            },
            id: "cardHolder",
            type: "string",
          },
        ],
        id: 1,
        mobileIntegrationLevel: "OPTIMIZED",
        paymentMethod: "cards",
        paymentProductGroup: "cards",
        usesRedirectionTo3rdParty: false,
      },
      {
        allowsInstallments: false,
        allowsRecurring: true,
        allowsTokenization: true,
        autoTokenized: false,
        deviceFingerprintEnabled: true,
        displayHints: {
          displayOrder: 809,
          logo: "809.png",
        },
        id: 809,
        mobileIntegrationLevel: "OPTIMIZED",
        paymentMethod: "redirect",
        usesRedirectionTo3rdParty: false,
      },
      {
        allowsInstallments: false,
        allowsRecurring: true,
        allowsTokenization: true,
        autoTokenized: false,
        deviceFingerprintEnabled: true,
        displayHints: {
          displayOrder: 2,
          logo: "2.png",
        },
        id: 2,
        mobileIntegrationLevel: "OPTIMIZED",
        paymentMethod: "cards",
        paymentProductGroup: "cards",
        usesRedirectionTo3rdParty: false,
      },
      {
        allowsInstallments: false,
        allowsRecurring: true,
        allowsTokenization: false,
        autoTokenized: false,
        deviceFingerprintEnabled: false,
        displayHints: {
          displayOrder: PP_APPLE_PAY,
          logo: `${PP_APPLE_PAY}.png`,
        },
        id: PP_APPLE_PAY,
        mobileIntegrationLevel: "OPTIMIZED",
        paymentMethod: "mobile",
        paymentProduct302SpecificData: {
          networks: ["1", "2"],
        },
        usesRedirectionTo3rdParty: false,
      },
      {
        allowsInstallments: false,
        allowsRecurring: true,
        allowsTokenization: false,
        autoTokenized: false,
        deviceFingerprintEnabled: false,
        displayHints: {
          displayOrder: PP_BANCONTACT,
          logo: `${PP_BANCONTACT}.png`,
        },
        id: PP_BANCONTACT,
        mobileIntegrationLevel: "OPTIMIZED",
        paymentMethod: "redirect",
        usesRedirectionTo3rdParty: false,
      },
      {
        allowsInstallments: false,
        allowsRecurring: true,
        allowsTokenization: false,
        autoTokenized: false,
        deviceFingerprintEnabled: false,
        displayHints: {
          displayOrder: PP_GOOGLE_PAY,
          logo: `${PP_GOOGLE_PAY}.png`,
        },
        id: PP_GOOGLE_PAY,
        mobileIntegrationLevel: "OPTIMIZED",
        paymentMethod: "mobile",
        paymentProduct320SpecificData: {
          gateway: "GW",
          networks: ["VISA"],
        },
        usesRedirectionTo3rdParty: false,
      },
    ],
  };
  const groups: api.PaymentProductGroups = {
    paymentProductGroups: [
      {
        accountsOnFile: [
          {
            attributes: [],
            displayHints: {
              labelTemplate: [],
              logo: "1.png",
            },
            id: 1,
            paymentProductId: 1,
          },
        ],
        allowsInstallments: false,
        deviceFingerprintEnabled: true,
        displayHints: {
          displayOrder: 1,
          logo: "cards.png",
        },
        id: "cards",
      },
    ],
  };

  const globalMocks = Mocks.global();

  beforeEach(() => {
    jest.spyOn(console, "debug").mockImplementation(() => {
      /* do nothing */
    });
    jest.spyOn(console, "error").mockImplementation(() => {
      /* do nothing */
    });
  });

  afterEach(() => globalMocks.restore());

  function expectRequest(
    request: CapturedHttpRequest,
    params: Record<string, string | number | boolean | string[] | number[] | boolean[] | undefined> = {},
    body?: object
  ): void {
    expect(request.headers["Authorization"]).toBe(`GCS v1Client:${sessionDetails.clientSessionId}`);
    expect(request.headers["X-GCS-ClientMetaInfo"]).toBeTruthy;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const clientMetaInfo = JSON.parse(atob(request.headers["X-GCS-ClientMetaInfo"]!));
    expect(clientMetaInfo).toStrictEqual({
      screenSize: "1920x1200",
      platformIdentifier: "MockDevice",
      sdkIdentifier,
      sdkCreator: "robtimus",
    });
    expect(request.params).toStrictEqual(params);
    expect(request.body).toStrictEqual(body);
  }

  test("updatePaymentContext", () => {
    const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
    expect(session.getPaymentContext()).toBe(minimalPaymentContext);

    session.updatePaymentContext({
      amountOfMoney: {
        amount: 2000,
        currencyCode: "EUR",
      },
      isRecurring: true,
      locale: "en_GB",
      paymentProductSpecificInputs: {
        applePay: {
          merchantName: "TEST",
        },
      },
    });
    expect(session.getPaymentContext()).not.toBe(minimalPaymentContext);
    expect(session.getPaymentContext()).toStrictEqual({
      amountOfMoney: {
        amount: 2000,
        currencyCode: "EUR",
      },
      countryCode: "NL",
      isRecurring: true,
      locale: "en_GB",
      paymentProductSpecificInputs: {
        applePay: {
          merchantName: "TEST",
        },
      },
    });
  });

  describe("getEncryptor", () => {
    const publicKey: api.PublicKey = {
      keyId: "key-id",
      publicKey:
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkiJlGL1QjUnGDLpMNBtZPYVtOU121jfFcV4WrZayfw9Ib/1AtPBHP/0ZPocdA23zDh6aB+QiOQEkHZlfnelBNnEzEu4ibda3nDdjSrKveSiQPyB5X+u/IS3CR48B/g4QJ+mcMV9hoFt6Hx3R99A0HWMs4um8elQsgB11MsLmGb1SuLo0S1pgL3EcckXfBDNMUBMQ9EtLC9zQW6Y0kx6GFXHgyjNb4yixXfjo194jfhei80sVQ49Y/SHBt/igATGN1l18IBDtO0eWmWeBckwbNkpkPLAvJfsfa3JpaxbXwg3rTvVXLrIRhvMYqTsQmrBIJDl7F6igPD98Y1FydbKe5QIDAQAB",
    };

    describe("successful", () => {
      const device = new MockDevice().mockGet(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/crypto/publickey`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(publicKey)),
        },
        expectRequest
      );

      test("with custom crypto engine", async () => {
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        session.setCryptoEngine({
          randomString: jest.fn(),
          encrypt: jest.fn(),
        });
        expect(async () => await session.getEncryptor()).not.toThrow();
      });

      test("with SubleCrypto crypto engine", async () => {
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        expect(async () => await session.getEncryptor()).not.toThrow();
      });
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      session.setCryptoEngine({
        randomString: jest.fn(),
        encrypt: jest.fn(),
      });
      const onSuccess = jest.fn();
      const result = await session
        .getEncryptor()
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    test("no crypto engine", async () => {
      const device = new MockDevice().mockGet(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/crypto/publickey`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(publicKey)),
        },
        expectRequest
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      // In Node.js environments (16+), crypto.subtle is always available, therefore the default crypto engine will always be set
      // Set it to undefined this way instead, to mock the case where crypto.subtle is not available
      Object.defineProperty(session, "cryptoEngine", {
        value: undefined,
      });
      const onSuccess = jest.fn();
      const result = await session
        .getEncryptor()
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(new Error("encryption not supported"));
    });
  });

  describe("getPublicKey", () => {
    test("successful", async () => {
      const publicKey: api.PublicKey = {
        keyId: "key-id",
        publicKey:
          "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkiJlGL1QjUnGDLpMNBtZPYVtOU121jfFcV4WrZayfw9Ib/1AtPBHP/0ZPocdA23zDh6aB+QiOQEkHZlfnelBNnEzEu4ibda3nDdjSrKveSiQPyB5X+u/IS3CR48B/g4QJ+mcMV9hoFt6Hx3R99A0HWMs4um8elQsgB11MsLmGb1SuLo0S1pgL3EcckXfBDNMUBMQ9EtLC9zQW6Y0kx6GFXHgyjNb4yixXfjo194jfhei80sVQ49Y/SHBt/igATGN1l18IBDtO0eWmWeBckwbNkpkPLAvJfsfa3JpaxbXwg3rTvVXLrIRhvMYqTsQmrBIJDl7F6igPD98Y1FydbKe5QIDAQAB",
      };
      const device = new MockDevice().mockGet(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/crypto/publickey`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(publicKey)),
        },
        expectRequest
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.getPublicKey();
      expect(result).toStrictEqual(publicKey);
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getPublicKey()
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    test("caching", async () => {
      const publicKey: api.PublicKey = {
        keyId: "key-id",
        publicKey:
          "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkiJlGL1QjUnGDLpMNBtZPYVtOU121jfFcV4WrZayfw9Ib/1AtPBHP/0ZPocdA23zDh6aB+QiOQEkHZlfnelBNnEzEu4ibda3nDdjSrKveSiQPyB5X+u/IS3CR48B/g4QJ+mcMV9hoFt6Hx3R99A0HWMs4um8elQsgB11MsLmGb1SuLo0S1pgL3EcckXfBDNMUBMQ9EtLC9zQW6Y0kx6GFXHgyjNb4yixXfjo194jfhei80sVQ49Y/SHBt/igATGN1l18IBDtO0eWmWeBckwbNkpkPLAvJfsfa3JpaxbXwg3rTvVXLrIRhvMYqTsQmrBIJDl7F6igPD98Y1FydbKe5QIDAQAB",
      };
      const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/crypto/publickey`, {
        statusCode: 200,
        contentType: "application/json",
        body: JSON.parse(JSON.stringify(publicKey)),
      });
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result1 = await session.getPublicKey();
      const result2 = await session.getPublicKey();
      expect(result2).toBe(result1);
      expect(device.capturedRequests()).toHaveLength(1);
    });
  });

  describe("getThirdPartyStatus", () => {
    test("successful", async () => {
      const paymentId = "payment-id";
      const thirdPartyStatusResponse: api.ThirdPartyStatusResponse = {
        thirdPartyStatus: "WAITING",
      };
      const device = new MockDevice().mockGet(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/payments/${paymentId}/thirdpartystatus`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(thirdPartyStatusResponse)),
        },
        expectRequest
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.getThirdPartyStatus(paymentId);
      expect(result).toStrictEqual(thirdPartyStatusResponse);
    });

    test("HTTP error", async () => {
      const paymentId = "payment-id";
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getThirdPartyStatus(paymentId)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    test("caching not enabled", async () => {
      const paymentId = "payment-id";
      const thirdPartyStatusResponse: api.ThirdPartyStatusResponse = {
        thirdPartyStatus: "WAITING",
      };
      const device = new MockDevice().mockGet(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/payments/${paymentId}/thirdpartystatus`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(thirdPartyStatusResponse)),
        }
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result1 = await session.getThirdPartyStatus(paymentId);
      const result2 = await session.getThirdPartyStatus(paymentId);
      expect(result2).toStrictEqual(result1);
      expect(device.capturedRequests()).toHaveLength(2);
    });
  });

  describe("getBasicPaymentItems", () => {
    describe("don't use groups", () => {
      describe("success", () => {
        test("Apple Pay and Google Pay not enabled", async () => {
          const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products)),
          });
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentItems(false);
          expect(result.paymentItems).toHaveLength(4);
          expect(result.paymentItems[0].id).toBe(1);
          expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[1].id).toBe(2);
          expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
          expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[2].id).toBe(809);
          expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[3].id).toBe(3012);
          expect(result.paymentItems[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentItems[3].accountsOnFile).toStrictEqual([]);
        });

        test("Apple Pay not enabled", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockGooglePayClient(true);
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentItems(false);
          expect(result.paymentItems).toHaveLength(5);
          expect(result.paymentItems[0].id).toBe(1);
          expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[1].id).toBe(2);
          expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
          expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[2].id).toBe(320);
          expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/320.png`);
          expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[3].id).toBe(809);
          expect(result.paymentItems[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentItems[3].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[4].id).toBe(3012);
          expect(result.paymentItems[4].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentItems[4].accountsOnFile).toStrictEqual([]);
        });

        test("Google Pay not enabled", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockApplePayClient(true);
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentItems(false);
          expect(result.paymentItems).toHaveLength(5);
          expect(result.paymentItems[0].id).toBe(1);
          expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[1].id).toBe(2);
          expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
          expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[2].id).toBe(302);
          expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/302.png`);
          expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[3].id).toBe(809);
          expect(result.paymentItems[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentItems[3].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[4].id).toBe(3012);
          expect(result.paymentItems[4].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentItems[4].accountsOnFile).toStrictEqual([]);
        });

        describe("Apple Pay and Google Pay enabled", () => {
          test("minimal payment context", async () => {
            const device = new MockDevice()
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products)),
              })
              .mockApplePayClient(true)
              .mockGooglePayClient(true);
            const session = new Session(sessionDetails, minimalPaymentContext, device);
            const result = await session.getBasicPaymentItems(false);
            expect(result.paymentItems).toHaveLength(4);
            expect(result.paymentItems[0].id).toBe(1);
            expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
            expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
            expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
            expect(result.paymentItems[1].id).toBe(2);
            expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
            expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[2].id).toBe(809);
            expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
            expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[3].id).toBe(3012);
            expect(result.paymentItems[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
            expect(result.paymentItems[3].accountsOnFile).toStrictEqual([]);
          });

          test("full payment context", async () => {
            const device = new MockDevice()
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products)),
              })
              .mockApplePayClient(true)
              .mockGooglePayClient(true);
            const session = new Session(sessionDetails, fullPaymentContext, device);
            const result = await session.getBasicPaymentItems(false);
            expect(result.paymentItems).toHaveLength(6);
            expect(result.paymentItems[0].id).toBe(1);
            expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
            expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
            expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
            expect(result.paymentItems[1].id).toBe(2);
            expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
            expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[2].id).toBe(302);
            expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/302.png`);
            expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[3].id).toBe(320);
            expect(result.paymentItems[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/320.png`);
            expect(result.paymentItems[3].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[4].id).toBe(809);
            expect(result.paymentItems[4].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
            expect(result.paymentItems[4].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[5].id).toBe(3012);
            expect(result.paymentItems[5].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
            expect(result.paymentItems[5].accountsOnFile).toStrictEqual([]);
          });
        });
      });

      test("HTTP error", async () => {
        // don't mock anything -> will lead to an error response
        const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
        const onSuccess = jest.fn();
        const result = await session
          .getBasicPaymentItems(false)
          .then(onSuccess)
          .catch((reason) => reason);
        expect(onSuccess).not.toBeCalled();
        expect(result).toStrictEqual(notImplementedResponse());
      });

      test("caching", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(products)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getBasicPaymentItems(false);
        const result2 = await session.getBasicPaymentItems(false);
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });
    });

    describe("use groups", () => {
      describe("success", () => {
        test("Apple Pay and Google Pay not enabled", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(groups)),
            });
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentItems(true);
          expect(result.paymentItems).toHaveLength(3);
          expect(result.paymentItems[0].id).toBe("cards");
          expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/cards.png`);
          expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[1].id).toBe(809);
          expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[2].id).toBe(3012);
          expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
        });

        test("Apple Pay not enabled", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(groups)),
            })
            .mockGooglePayClient(true);
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentItems(true);
          expect(result.paymentItems).toHaveLength(4);
          expect(result.paymentItems[0].id).toBe("cards");
          expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/cards.png`);
          expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[1].id).toBe(320);
          expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/320.png`);
          expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[2].id).toBe(809);
          expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[3].id).toBe(3012);
          expect(result.paymentItems[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentItems[3].accountsOnFile).toStrictEqual([]);
        });

        test("Google Pay not enabled", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(groups)),
            })
            .mockApplePayClient(true);
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentItems(true);
          expect(result.paymentItems).toHaveLength(4);
          expect(result.paymentItems[0].id).toBe("cards");
          expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/cards.png`);
          expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentItems[1].id).toBe(302);
          expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/302.png`);
          expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[2].id).toBe(809);
          expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentItems[3].id).toBe(3012);
          expect(result.paymentItems[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentItems[3].accountsOnFile).toStrictEqual([]);
        });

        describe("Apple Pay and Google Pay enabled", () => {
          test("minimal payment context", async () => {
            const device = new MockDevice()
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products)),
              })
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(groups)),
              })
              .mockApplePayClient(true)
              .mockGooglePayClient(true);
            const session = new Session(sessionDetails, minimalPaymentContext, device);
            const result = await session.getBasicPaymentItems(true);
            expect(result.paymentItems).toHaveLength(3);
            expect(result.paymentItems[0].id).toBe("cards");
            expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/cards.png`);
            expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
            expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
            expect(result.paymentItems[1].id).toBe(809);
            expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
            expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[2].id).toBe(3012);
            expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
            expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
          });

          test("full payment context", async () => {
            const device = new MockDevice()
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products)),
              })
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(groups)),
              })
              .mockApplePayClient(true)
              .mockGooglePayClient(true);
            const session = new Session(sessionDetails, fullPaymentContext, device);
            const result = await session.getBasicPaymentItems(true);
            expect(result.paymentItems).toHaveLength(5);
            expect(result.paymentItems[0].id).toBe("cards");
            expect(result.paymentItems[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/cards.png`);
            expect(result.paymentItems[0].accountsOnFile).toHaveLength(1);
            expect(result.paymentItems[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
            expect(result.paymentItems[1].id).toBe(302);
            expect(result.paymentItems[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/302.png`);
            expect(result.paymentItems[1].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[2].id).toBe(320);
            expect(result.paymentItems[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/320.png`);
            expect(result.paymentItems[2].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[3].id).toBe(809);
            expect(result.paymentItems[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
            expect(result.paymentItems[3].accountsOnFile).toStrictEqual([]);
            expect(result.paymentItems[4].id).toBe(3012);
            expect(result.paymentItems[4].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
            expect(result.paymentItems[4].accountsOnFile).toStrictEqual([]);
          });
        });
      });

      test("retrieve products error", async () => {
        // don't mock products -> will lead to an error response
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const onSuccess = jest.fn();
        const result = await session
          .getBasicPaymentItems(true)
          .then(onSuccess)
          .catch((reason) => reason);
        expect(onSuccess).not.toBeCalled();
        expect(result).toStrictEqual(notImplementedResponse());
      });

      test("retrieve groups error", async () => {
        // don't mock groups -> will lead to an error response
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(products)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const onSuccess = jest.fn();
        const result = await session
          .getBasicPaymentItems(true)
          .then(onSuccess)
          .catch((reason) => reason);
        expect(onSuccess).not.toBeCalled();
        expect(result).toStrictEqual(notImplementedResponse());
      });

      test("caching", async () => {
        const device = new MockDevice()
          .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products)),
          })
          .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(groups)),
          });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getBasicPaymentItems(true);
        const result2 = await session.getBasicPaymentItems(true);
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("getBasicPaymentProductGroups", () => {
    describe("success", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(groups)),
          },
          (request) =>
            expectRequest(request, {
              countryCode: minimalPaymentContext.countryCode,
              currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
              amount: minimalPaymentContext.amountOfMoney.amount,
              hide: ["fields"],
            })
        );
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getBasicPaymentProductGroups();
        expect(result.paymentProductGroups).toHaveLength(groups.paymentProductGroups.length);
        for (const i in result.paymentProductGroups) {
          expect(result.paymentProductGroups[i].id).toBe(groups.paymentProductGroups[i].id);
        }
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(groups)),
          },
          (request) =>
            expectRequest(request, {
              countryCode: fullPaymentContext.countryCode,
              currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
              amount: fullPaymentContext.amountOfMoney.amount,
              locale: fullPaymentContext.locale,
              isRecurring: fullPaymentContext.isRecurring,
              hide: ["fields"],
            })
        );
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result = await session.getBasicPaymentProductGroups();
        expect(result.paymentProductGroups).toHaveLength(groups.paymentProductGroups.length);
        for (const i in result.paymentProductGroups) {
          expect(result.paymentProductGroups[i].id).toBe(groups.paymentProductGroups[i].id);
        }
      });
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getBasicPaymentProductGroups()
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getBasicPaymentProductGroups();
        const result2 = await session.getBasicPaymentProductGroups();
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups)),
        });
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result1 = await session.getBasicPaymentProductGroups();
        const result2 = await session.getBasicPaymentProductGroups();
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getBasicPaymentProductGroups();
        session.updatePaymentContext(fullPaymentContext);
        await session.getBasicPaymentProductGroups();
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("getPaymentProductGroup", () => {
    describe("success", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/cards?`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(groups.paymentProductGroups[0])),
          },
          (request) =>
            expectRequest(request, {
              countryCode: minimalPaymentContext.countryCode,
              currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
              amount: minimalPaymentContext.amountOfMoney.amount,
            })
        );
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getPaymentProductGroup("cards");
        expect(result.id).toBe("cards");
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/cards?`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(groups.paymentProductGroups[0])),
          },
          (request) =>
            expectRequest(request, {
              countryCode: fullPaymentContext.countryCode,
              currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
              amount: fullPaymentContext.amountOfMoney.amount,
              locale: fullPaymentContext.locale,
              isRecurring: fullPaymentContext.isRecurring,
            })
        );
        const session = new Session(sessionDetails, fullPaymentContext, device);
        session.setProvidedPaymentItem();
        const result = await session.getPaymentProductGroup("cards");
        expect(result.id).toBe("cards");
      });

      describe("provided", () => {
        test("retrieve same", async () => {
          const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
          session.setProvidedPaymentItem(groups.paymentProductGroups[0]);
          const result = await session.getPaymentProductGroup("cards");
          expect(result.id).toBe("cards");
        });

        test("retrieve other", async () => {
          const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/cards?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(groups.paymentProductGroups[0])),
          });
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          session.setProvidedPaymentItem(products.paymentProducts[0]);
          const result = await session.getPaymentProductGroup("cards");
          expect(result.id).toBe("cards");
        });
      });
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getPaymentProductGroup("cards")
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/cards?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups.paymentProductGroups[0])),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getPaymentProductGroup("cards");
        const result2 = await session.getPaymentProductGroup("cards");
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/cards?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups.paymentProductGroups[0])),
        });
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result1 = await session.getPaymentProductGroup("cards");
        const result2 = await session.getPaymentProductGroup("cards");
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/cards?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups.paymentProductGroups[0])),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPaymentProductGroup("cards");
        session.updatePaymentContext(fullPaymentContext);
        await session.getPaymentProductGroup("cards");
        expect(device.capturedRequests()).toHaveLength(2);
      });

      test("different groups", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups.paymentProductGroups[0])),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPaymentProductGroup("cards1");
        await session.getPaymentProductGroup("cards2");
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("getPaymentProductGroupDeviceFingerprint", () => {
    const deviceFingerprintRequest: DeviceFingerprintRequest = {
      collectorCallback: "callback",
    };

    test("successful", async () => {
      const deviceFingerprintResponse: api.DeviceFingerprintResponse = {
        deviceFingerprintTransactionId: "transaction-id",
        html: "<span>foo</span>",
      };
      const device = new MockDevice().mockPost(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/cards/deviceFingerprint`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(deviceFingerprintResponse)),
        },
        (request) => expectRequest(request, {}, deviceFingerprintRequest)
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.getPaymentProductGroupDeviceFingerprint("cards", deviceFingerprintRequest);
      expect(result).toStrictEqual(deviceFingerprintResponse);
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getPaymentProductGroupDeviceFingerprint("cards", deviceFingerprintRequest)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    test("caching not enabled", async () => {
      const deviceFingerprintResponse: api.DeviceFingerprintResponse = {
        deviceFingerprintTransactionId: "transaction-id",
        html: "<span>foo</span>",
      };
      const device = new MockDevice().mockPost(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/productgroups/cards/deviceFingerprint`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(deviceFingerprintResponse)),
        }
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result1 = await session.getPaymentProductGroupDeviceFingerprint("cards", deviceFingerprintRequest);
      const result2 = await session.getPaymentProductGroupDeviceFingerprint("cards", deviceFingerprintRequest);
      expect(result2).toStrictEqual(result1);
      expect(device.capturedRequests()).toHaveLength(2);
    });
  });

  describe("getBasicPaymentProducts", () => {
    describe("success", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice()
          .mockGet(
            `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`,
            {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            },
            (request) =>
              expectRequest(request, {
                countryCode: minimalPaymentContext.countryCode,
                currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
                amount: minimalPaymentContext.amountOfMoney.amount,
                hide: ["fields"],
              })
          )
          // enable both clients; the lack of necessary PP specific inputs will filter out Apple Pay and Google Pay
          .mockApplePayClient(true)
          .mockGooglePayClient(true);
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getBasicPaymentProducts();
        expect(result.paymentProducts).toHaveLength(4);
        expect(result.paymentProducts[0].id).toBe(1);
        expect(result.paymentProducts[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
        expect(result.paymentProducts[0].accountsOnFile).toHaveLength(1);
        expect(result.paymentProducts[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
        expect(result.paymentProducts[1].id).toBe(2);
        expect(result.paymentProducts[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
        expect(result.paymentProducts[1].accountsOnFile).toStrictEqual([]);
        expect(result.paymentProducts[2].id).toBe(809);
        expect(result.paymentProducts[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
        expect(result.paymentProducts[2].accountsOnFile).toStrictEqual([]);
        expect(result.paymentProducts[3].id).toBe(3012);
        expect(result.paymentProducts[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
        expect(result.paymentProducts[3].accountsOnFile).toStrictEqual([]);
      });

      describe("full payment context", () => {
        test("Apple Pay and Google Pay not enabled", async () => {
          const device = new MockDevice().mockGet(
            `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`,
            {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            },
            (request) =>
              expectRequest(request, {
                countryCode: fullPaymentContext.countryCode,
                currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
                amount: fullPaymentContext.amountOfMoney.amount,
                locale: fullPaymentContext.locale,
                isRecurring: fullPaymentContext.isRecurring,
                hide: ["fields"],
              })
          );
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentProducts();
          expect(result.paymentProducts).toHaveLength(4);
          expect(result.paymentProducts[0].id).toBe(1);
          expect(result.paymentProducts[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentProducts[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[1].id).toBe(2);
          expect(result.paymentProducts[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
          expect(result.paymentProducts[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[2].id).toBe(809);
          expect(result.paymentProducts[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentProducts[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[3].id).toBe(3012);
          expect(result.paymentProducts[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentProducts[3].accountsOnFile).toStrictEqual([]);
        });

        test("Apple Pay and Google Pay errors", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockApplePayClient("throw")
            .mockGooglePayClient("throw");
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentProducts();
          expect(result.paymentProducts).toHaveLength(4);
          expect(result.paymentProducts[0].id).toBe(1);
          expect(result.paymentProducts[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentProducts[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[1].id).toBe(2);
          expect(result.paymentProducts[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
          expect(result.paymentProducts[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[2].id).toBe(809);
          expect(result.paymentProducts[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentProducts[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[3].id).toBe(3012);
          expect(result.paymentProducts[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentProducts[3].accountsOnFile).toStrictEqual([]);
        });

        test("Apple Pay not enabled", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockGooglePayClient(true);
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentProducts();
          expect(result.paymentProducts).toHaveLength(5);
          expect(result.paymentProducts[0].id).toBe(1);
          expect(result.paymentProducts[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentProducts[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[1].id).toBe(2);
          expect(result.paymentProducts[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
          expect(result.paymentProducts[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[2].id).toBe(320);
          expect(result.paymentProducts[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/320.png`);
          expect(result.paymentProducts[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[3].id).toBe(809);
          expect(result.paymentProducts[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentProducts[3].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[4].id).toBe(3012);
          expect(result.paymentProducts[4].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentProducts[4].accountsOnFile).toStrictEqual([]);
        });

        test("Google Pay not enabled", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockApplePayClient(true);
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentProducts();
          expect(result.paymentProducts).toHaveLength(5);
          expect(result.paymentProducts[0].id).toBe(1);
          expect(result.paymentProducts[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentProducts[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[1].id).toBe(2);
          expect(result.paymentProducts[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
          expect(result.paymentProducts[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[2].id).toBe(302);
          expect(result.paymentProducts[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/302.png`);
          expect(result.paymentProducts[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[3].id).toBe(809);
          expect(result.paymentProducts[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentProducts[3].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[4].id).toBe(3012);
          expect(result.paymentProducts[4].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentProducts[4].accountsOnFile).toStrictEqual([]);
        });

        test("Apple Pay and Google Pay enabled", async () => {
          const device = new MockDevice()
            .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products)),
            })
            .mockApplePayClient(true)
            .mockGooglePayClient(true);
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getBasicPaymentProducts();
          expect(result.paymentProducts).toHaveLength(6);
          expect(result.paymentProducts[0].id).toBe(1);
          expect(result.paymentProducts[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[0].accountsOnFile).toHaveLength(1);
          expect(result.paymentProducts[0].accountsOnFile[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/1.png`);
          expect(result.paymentProducts[1].id).toBe(2);
          expect(result.paymentProducts[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/2.png`);
          expect(result.paymentProducts[1].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[2].id).toBe(302);
          expect(result.paymentProducts[2].displayHints.logo).toBe(`${sessionDetails.assetUrl}/302.png`);
          expect(result.paymentProducts[2].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[3].id).toBe(320);
          expect(result.paymentProducts[3].displayHints.logo).toBe(`${sessionDetails.assetUrl}/320.png`);
          expect(result.paymentProducts[3].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[4].id).toBe(809);
          expect(result.paymentProducts[4].displayHints.logo).toBe(`${sessionDetails.assetUrl}/809.png`);
          expect(result.paymentProducts[4].accountsOnFile).toStrictEqual([]);
          expect(result.paymentProducts[5].id).toBe(3012);
          expect(result.paymentProducts[5].displayHints.logo).toBe(`${sessionDetails.assetUrl}/3012.png`);
          expect(result.paymentProducts[5].accountsOnFile).toStrictEqual([]);
        });
      });
    });

    test("only disabled products", async () => {
      const device = new MockDevice()
        .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(
            JSON.stringify({
              paymentProducts: products.paymentProducts.filter((product) => product.id === PP_APPLE_PAY || product.id === PP_GOOGLE_PAY),
            })
          ),
        })
        // enable both clients; the lack of necessary PP specific inputs will filter out Apple Pay and Google Pay
        .mockApplePayClient(true)
        .mockGooglePayClient(true);
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const onSuccess = jest.fn();
      const result = await session
        .getBasicPaymentProducts()
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toHaveProperty("message", "No payment products available");
      expect(result).toHaveProperty("json");
      const json = result.json as api.PaymentProducts;
      expect(json.paymentProducts).toHaveLength(2);
      expect(json.paymentProducts[0].id).toBe(302);
      expect(json.paymentProducts[0].displayHints.logo).toBe(`${sessionDetails.assetUrl}/302.png`);
      expect(json.paymentProducts[1].id).toBe(320);
      expect(json.paymentProducts[1].displayHints.logo).toBe(`${sessionDetails.assetUrl}/320.png`);
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getBasicPaymentProducts()
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(products)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getBasicPaymentProducts();
        const result2 = await session.getBasicPaymentProducts();
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(products)),
        });
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result1 = await session.getBasicPaymentProducts();
        const result2 = await session.getBasicPaymentProducts();
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(products)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getBasicPaymentProducts();
        session.updatePaymentContext(fullPaymentContext);
        await session.getBasicPaymentProducts();
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("getPaymentProduct", () => {
    async function expectProductNotFound(session: Session, paymentProductId: number): Promise<api.ErrorResponse> {
      try {
        const product = await session.getPaymentProduct(paymentProductId);
        fail(`Expected an error, got ${product}`);
      } catch (e) {
        expect(e).toHaveProperty("statusCode", 404);
        expect(e).toHaveProperty("contentType", "application/json");
        expect(e).toHaveProperty("body");
        const httpResponse = e as HttpResponse;
        expect(httpResponse.body).toHaveProperty("errorId");
        expect(httpResponse.body).toHaveProperty("errors");
        const errorResponse = httpResponse.body as api.ErrorResponse;
        expect(errorResponse.errors).toStrictEqual([
          {
            category: "CONNECT_PLATFORM_ERROR",
            code: "1007",
            httpStatusCode: 404,
            id: "UNKNOWN_PRODUCT_ID",
            propertyName: "productId",
            message: "UNKNOWN_PRODUCT_ID",
          },
        ]);
        return errorResponse;
      }
    }

    describe("success", () => {
      describe("minimal payment context", () => {
        test("Apple Pay", async () => {
          const device = new MockDevice().mockGet(
            `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_APPLE_PAY}?`,
            {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_APPLE_PAY))),
            },
            (request) =>
              expectRequest(request, {
                countryCode: minimalPaymentContext.countryCode,
                currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
                amount: minimalPaymentContext.amountOfMoney.amount,
              })
          );
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          await expectProductNotFound(session, PP_APPLE_PAY);
          await expectProductNotFound(session, PP_APPLE_PAY);
          expect(device.capturedRequests()).toHaveLength(1);
        });

        test("Bancontact", async () => {
          const device = new MockDevice().mockGet(
            `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_BANCONTACT}?`,
            {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_BANCONTACT))),
            },
            (request) =>
              expectRequest(request, {
                countryCode: minimalPaymentContext.countryCode,
                currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
                amount: minimalPaymentContext.amountOfMoney.amount,
              })
          );
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          const result = await session.getPaymentProduct(PP_BANCONTACT);
          expect(result.id).toBe(PP_BANCONTACT);
        });

        test("Google Pay", async () => {
          const device = new MockDevice().mockGet(
            `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_GOOGLE_PAY}?`,
            {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY))),
            },
            (request) =>
              expectRequest(request, {
                countryCode: minimalPaymentContext.countryCode,
                currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
                amount: minimalPaymentContext.amountOfMoney.amount,
              })
          );
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          await expectProductNotFound(session, PP_GOOGLE_PAY);
          await expectProductNotFound(session, PP_GOOGLE_PAY);
          expect(device.capturedRequests()).toHaveLength(1);
        });

        test("other", async () => {
          const device = new MockDevice().mockGet(
            `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`,
            {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts[0])),
            },
            (request) =>
              expectRequest(request, {
                countryCode: minimalPaymentContext.countryCode,
                currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
                amount: minimalPaymentContext.amountOfMoney.amount,
              })
          );
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          const result = await session.getPaymentProduct(1);
          expect(result.id).toBe(1);
          expect(result.fields).toHaveLength(4);
          expect(result.fields[0].id).toBe("cvv");
          expect(result.fields[1].id).toBe("cardHolder");
          expect(result.fields[2].id).toBe("cardNumber");
          expect(result.fields[2].displayHints?.tooltip?.image).toBe(`${sessionDetails.assetUrl}/card.png`);
          expect(result.fields[3].id).toBe("expirationDate");
        });
      });

      describe("full payment context", () => {
        describe("Apple Pay", () => {
          test("not enabled", async () => {
            const device = new MockDevice().mockGet(
              `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_APPLE_PAY}?`,
              {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_APPLE_PAY))),
              },
              (request) =>
                expectRequest(request, {
                  countryCode: fullPaymentContext.countryCode,
                  currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
                  amount: fullPaymentContext.amountOfMoney.amount,
                  locale: fullPaymentContext.locale,
                  isRecurring: fullPaymentContext.isRecurring,
                })
            );
            const session = new Session(sessionDetails, fullPaymentContext, device);
            await expectProductNotFound(session, PP_APPLE_PAY);
            await expectProductNotFound(session, PP_APPLE_PAY);
            expect(device.capturedRequests()).toHaveLength(1);
          });

          test("enabled", async () => {
            const device = new MockDevice()
              .mockGet(
                `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_APPLE_PAY}?`,
                {
                  statusCode: 200,
                  contentType: "application/json",
                  body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_APPLE_PAY))),
                },
                (request) =>
                  expectRequest(request, {
                    countryCode: fullPaymentContext.countryCode,
                    currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
                    amount: fullPaymentContext.amountOfMoney.amount,
                    locale: fullPaymentContext.locale,
                    isRecurring: fullPaymentContext.isRecurring,
                  })
              )
              .mockApplePayClient(true);
            const session = new Session(sessionDetails, fullPaymentContext, device);
            const result = await session.getPaymentProduct(PP_APPLE_PAY);
            expect(result.id).toBe(PP_APPLE_PAY);
          });
        });

        test("Bancontact", async () => {
          const device = new MockDevice().mockGet(
            `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_BANCONTACT}?`,
            {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_BANCONTACT))),
            },
            (request) =>
              expectRequest(request, {
                countryCode: fullPaymentContext.countryCode,
                currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
                amount: fullPaymentContext.amountOfMoney.amount,
                locale: fullPaymentContext.locale,
                isRecurring: fullPaymentContext.isRecurring,
                forceBasicFlow: true,
              })
          );
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result = await session.getPaymentProduct(PP_BANCONTACT);
          expect(result.id).toBe(PP_BANCONTACT);
        });

        describe("Google Pay", () => {
          test("not enabled", async () => {
            const device = new MockDevice().mockGet(
              `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_GOOGLE_PAY}?`,
              {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY))),
              },
              (request) =>
                expectRequest(request, {
                  countryCode: fullPaymentContext.countryCode,
                  currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
                  amount: fullPaymentContext.amountOfMoney.amount,
                  locale: fullPaymentContext.locale,
                  isRecurring: fullPaymentContext.isRecurring,
                })
            );
            const session = new Session(sessionDetails, fullPaymentContext, device);
            await expectProductNotFound(session, PP_GOOGLE_PAY);
            await expectProductNotFound(session, PP_GOOGLE_PAY);
            expect(device.capturedRequests()).toHaveLength(1);
          });

          test("enabled", async () => {
            const device = new MockDevice()
              .mockGet(
                `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_GOOGLE_PAY}?`,
                {
                  statusCode: 200,
                  contentType: "application/json",
                  body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY))),
                },
                (request) =>
                  expectRequest(request, {
                    countryCode: fullPaymentContext.countryCode,
                    currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
                    amount: fullPaymentContext.amountOfMoney.amount,
                    locale: fullPaymentContext.locale,
                    isRecurring: fullPaymentContext.isRecurring,
                  })
              )
              .mockGooglePayClient(true);
            const session = new Session(sessionDetails, fullPaymentContext, device);
            const result = await session.getPaymentProduct(PP_GOOGLE_PAY);
            expect(result.id).toBe(PP_GOOGLE_PAY);
          });
        });

        test("other", async () => {
          const device = new MockDevice().mockGet(
            `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`,
            {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts[0])),
            },
            (request) =>
              expectRequest(request, {
                countryCode: fullPaymentContext.countryCode,
                currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
                amount: fullPaymentContext.amountOfMoney.amount,
                locale: fullPaymentContext.locale,
                isRecurring: fullPaymentContext.isRecurring,
              })
          );
          const session = new Session(sessionDetails, fullPaymentContext, device);
          session.setProvidedPaymentItem();
          const result = await session.getPaymentProduct(1);
          expect(result.id).toBe(1);
        });
      });

      describe("provided", () => {
        test("retrieve same", async () => {
          const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
          session.setProvidedPaymentItem(products.paymentProducts[0]);
          const result = await session.getPaymentProduct(1);
          expect(result.id).toBe(1);
        });

        test("retrieve other", async () => {
          const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products.paymentProducts[0])),
          });
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          session.setProvidedPaymentItem(products.paymentProducts[1]);
          const result = await session.getPaymentProduct(1);
          expect(result.id).toBe(1);
        });
      });
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getPaymentProduct(1)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      describe("minimal payment context", () => {
        test("Apple Pay", async () => {
          const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_APPLE_PAY}?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_APPLE_PAY))),
          });
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          const result1 = await expectProductNotFound(session, PP_APPLE_PAY);
          const result2 = await expectProductNotFound(session, PP_APPLE_PAY);
          expect(result2).toStrictEqual(result1);
          expect(device.capturedRequests()).toHaveLength(1);
        });

        test("Google Pay", async () => {
          const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_GOOGLE_PAY}?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY))),
          });
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          const result1 = await expectProductNotFound(session, PP_GOOGLE_PAY);
          const result2 = await expectProductNotFound(session, PP_GOOGLE_PAY);
          expect(result2).toStrictEqual(result1);
          expect(device.capturedRequests()).toHaveLength(1);
        });

        test("other", async () => {
          const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products.paymentProducts[0])),
          });
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          const result1 = await session.getPaymentProduct(1);
          const result2 = await session.getPaymentProduct(1);
          expect(result2).toStrictEqual(result1);
          expect(device.capturedRequests()).toHaveLength(1);
        });
      });

      describe("full payment context", () => {
        describe("Apple Pay", () => {
          test("not enabled", async () => {
            const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_APPLE_PAY}?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_APPLE_PAY))),
            });
            const session = new Session(sessionDetails, fullPaymentContext, device);
            const result1 = await expectProductNotFound(session, PP_APPLE_PAY);
            const result2 = await expectProductNotFound(session, PP_APPLE_PAY);
            expect(result2).toStrictEqual(result1);
            expect(device.capturedRequests()).toHaveLength(1);
          });

          test("enabled", async () => {
            const device = new MockDevice()
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_APPLE_PAY}?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_APPLE_PAY))),
              })
              .mockApplePayClient(true);
            const session = new Session(sessionDetails, fullPaymentContext, device);
            const result1 = await session.getPaymentProduct(PP_APPLE_PAY);
            const result2 = await session.getPaymentProduct(PP_APPLE_PAY);
            expect(result2).toStrictEqual(result1);
            expect(device.capturedRequests()).toHaveLength(1);
          });
        });

        describe("Google Pay", () => {
          test("not enabled", async () => {
            const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_GOOGLE_PAY}?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY))),
            });
            const session = new Session(sessionDetails, fullPaymentContext, device);
            const result1 = await expectProductNotFound(session, PP_GOOGLE_PAY);
            const result2 = await expectProductNotFound(session, PP_GOOGLE_PAY);
            expect(result2).toStrictEqual(result1);
            expect(device.capturedRequests()).toHaveLength(1);
          });

          test("enabled", async () => {
            const device = new MockDevice()
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_GOOGLE_PAY}?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY))),
              })
              .mockGooglePayClient(true);
            const session = new Session(sessionDetails, fullPaymentContext, device);
            const result1 = await session.getPaymentProduct(PP_GOOGLE_PAY);
            const result2 = await session.getPaymentProduct(PP_GOOGLE_PAY);
            expect(result2).toStrictEqual(result1);
            expect(device.capturedRequests()).toHaveLength(1);
          });
        });

        test("other", async () => {
          const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products.paymentProducts[0])),
          });
          const session = new Session(sessionDetails, fullPaymentContext, device);
          const result1 = await session.getPaymentProduct(1);
          const result2 = await session.getPaymentProduct(1);
          expect(result2).toStrictEqual(result1);
          expect(device.capturedRequests()).toHaveLength(1);
        });
      });

      describe("payment context update", () => {
        describe("Apple Pay", () => {
          test("not enabled", async () => {
            const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_APPLE_PAY}?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_APPLE_PAY))),
            });
            const session = new Session(sessionDetails, minimalPaymentContext, device);
            const result1 = await expectProductNotFound(session, PP_APPLE_PAY);
            session.updatePaymentContext(fullPaymentContext);
            const result2 = await expectProductNotFound(session, PP_APPLE_PAY);
            expect(result2).toStrictEqual(result1);
            expect(device.capturedRequests()).toHaveLength(2);
          });

          test("enabled", async () => {
            const device = new MockDevice()
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_APPLE_PAY}?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_APPLE_PAY))),
              })
              .mockApplePayClient(true);
            const session = new Session(sessionDetails, minimalPaymentContext, device);
            await expectProductNotFound(session, PP_APPLE_PAY);
            session.updatePaymentContext(fullPaymentContext);
            await session.getPaymentProduct(PP_APPLE_PAY);
            expect(device.capturedRequests()).toHaveLength(2);
          });
        });

        describe("Google Pay", () => {
          test("not enabled", async () => {
            const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_GOOGLE_PAY}?`, {
              statusCode: 200,
              contentType: "application/json",
              body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY))),
            });
            const session = new Session(sessionDetails, minimalPaymentContext, device);
            const result1 = await expectProductNotFound(session, PP_GOOGLE_PAY);
            session.updatePaymentContext(fullPaymentContext);
            const result2 = await expectProductNotFound(session, PP_GOOGLE_PAY);
            expect(result2).toStrictEqual(result1);
            expect(device.capturedRequests()).toHaveLength(2);
          });

          test("enabled", async () => {
            const device = new MockDevice()
              .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/${PP_GOOGLE_PAY}?`, {
                statusCode: 200,
                contentType: "application/json",
                body: JSON.parse(JSON.stringify(products.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY))),
              })
              .mockGooglePayClient(true);
            const session = new Session(sessionDetails, minimalPaymentContext, device);
            await expectProductNotFound(session, PP_GOOGLE_PAY);
            session.updatePaymentContext(fullPaymentContext);
            await session.getPaymentProduct(PP_GOOGLE_PAY);
            expect(device.capturedRequests()).toHaveLength(2);
          });
        });

        test("other", async () => {
          const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products.paymentProducts[0])),
          });
          const session = new Session(sessionDetails, minimalPaymentContext, device);
          const result1 = await session.getPaymentProduct(1);
          session.updatePaymentContext(fullPaymentContext);
          const result2 = await session.getPaymentProduct(1);
          expect(result2).toStrictEqual(result1);
          expect(device.capturedRequests()).toHaveLength(2);
        });
      });

      test("different products", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(groups.paymentProductGroups[0])),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPaymentProduct(1);
        await session.getPaymentProduct(2);
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("getPaymentProductDirectory", () => {
    const directory: api.Directory = {
      entries: [
        {
          issuerId: "IID",
          issuerName: "Issuer",
          countryNames: ["NL"],
        },
      ],
    };

    describe("success", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/directory?`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(directory)),
          },
          (request) =>
            expectRequest(request, {
              countryCode: minimalPaymentContext.countryCode,
              currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
            })
        );
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getPaymentProductDirectory(1);
        expect(result).toStrictEqual(directory);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/directory?`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(directory)),
          },
          (request) =>
            expectRequest(request, {
              countryCode: fullPaymentContext.countryCode,
              currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
            })
        );
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result = await session.getPaymentProductDirectory(1);
        expect(result).toStrictEqual(directory);
      });
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getPaymentProductDirectory(1)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/directory?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(directory)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getPaymentProductDirectory(1);
        const result2 = await session.getPaymentProductDirectory(1);
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/directory?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(directory)),
        });
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result1 = await session.getPaymentProductDirectory(1);
        const result2 = await session.getPaymentProductDirectory(1);
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/directory?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(directory)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPaymentProductDirectory(1);
        session.updatePaymentContext({
          countryCode: "GB",
        });
        await session.getPaymentProductDirectory(1);
        expect(device.capturedRequests()).toHaveLength(2);
      });

      test("different products", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(directory)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPaymentProductDirectory(1);
        await session.getPaymentProductDirectory(2);
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("getCustomerDetails", () => {
    const customerDetails: api.GetCustomerDetailsResponse = {
      fiscalNumber: "0123456789012",
      city: "Stockholm",
      street: "Gustav Adolfs torg 22",
      zip: "111 52",
      firstName: "Gustav",
      surname: "Adolfs",
      emailAddress: "gustav.adolfs@stockholm.se",
      phoneNumber: "0123456789",
      languageCode: "",
    };
    const customerDetailsRequest: CustomerDetailsRequest = {
      countryCode: "SE",
      values: [
        {
          key: "fiscalNumber",
          value: "012345678901",
        },
      ],
    };

    test("success", async () => {
      const device = new MockDevice().mockPost(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/customerDetails`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(customerDetails)),
        },
        (request) => expectRequest(request, {}, customerDetailsRequest)
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.getCustomerDetails(1, customerDetailsRequest);
      expect(result).toStrictEqual(customerDetails);
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getCustomerDetails(1, customerDetailsRequest)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      test("no values", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/customerDetails`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(customerDetails)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getCustomerDetails(1, { countryCode: "SE", values: [] });
        const result2 = await session.getCustomerDetails(1, { countryCode: "SE", values: [] });
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("some values", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/customerDetails`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(customerDetails)),
        });
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result1 = await session.getCustomerDetails(1, customerDetailsRequest);
        const result2 = await session.getCustomerDetails(1, customerDetailsRequest);
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("different values", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/customerDetails`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(customerDetails)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getCustomerDetails(1, { countryCode: "SE", values: [{ key: "fiscalNumber", value: "012345678901" }] });
        await session.getCustomerDetails(1, { countryCode: "SE", values: [{ key: "fiscalNumber2", value: "012345678901" }] });
        await session.getCustomerDetails(1, { countryCode: "SE", values: [{ key: "fiscalNumber", value: "012345678902" }] });
        await session.getCustomerDetails(1, { countryCode: "NO", values: [{ key: "fiscalNumber", value: "012345678901" }] });
        expect(device.capturedRequests()).toHaveLength(4);
      });

      test("different products", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(customerDetails)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getCustomerDetails(1, customerDetailsRequest);
        await session.getCustomerDetails(2, customerDetailsRequest);
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("getPaymentProductDeviceFingerprint", () => {
    const deviceFingerprintRequest: DeviceFingerprintRequest = {
      collectorCallback: "callback",
    };

    test("successful", async () => {
      const deviceFingerprintResponse: api.DeviceFingerprintResponse = {
        deviceFingerprintTransactionId: "transaction-id",
        html: "<span>foo</span>",
      };
      const device = new MockDevice().mockPost(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/deviceFingerprint`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(deviceFingerprintResponse)),
        },
        (request) => expectRequest(request, {}, deviceFingerprintRequest)
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.getPaymentProductDeviceFingerprint(1, deviceFingerprintRequest);
      expect(result).toStrictEqual(deviceFingerprintResponse);
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getPaymentProductDeviceFingerprint(1, deviceFingerprintRequest)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    test("caching not enabled", async () => {
      const deviceFingerprintResponse: api.DeviceFingerprintResponse = {
        deviceFingerprintTransactionId: "transaction-id",
        html: "<span>foo</span>",
      };
      const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/deviceFingerprint`, {
        statusCode: 200,
        contentType: "application/json",
        body: JSON.parse(JSON.stringify(deviceFingerprintResponse)),
      });
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result1 = await session.getPaymentProductDeviceFingerprint(1, deviceFingerprintRequest);
      const result2 = await session.getPaymentProductDeviceFingerprint(1, deviceFingerprintRequest);
      expect(result2).toStrictEqual(result1);
      expect(device.capturedRequests()).toHaveLength(2);
    });
  });

  describe("getPaymentProductNetworks", () => {
    const networksResponse: api.PaymentProductNetworksResponse = {
      networks: ["VISA"],
    };

    describe("success", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/networks?`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(networksResponse)),
          },
          (request) =>
            expectRequest(request, {
              countryCode: minimalPaymentContext.countryCode,
              currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
              amount: minimalPaymentContext.amountOfMoney.amount,
            })
        );
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getPaymentProductNetworks(1);
        expect(result).toStrictEqual(networksResponse);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/networks?`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(networksResponse)),
          },
          (request) =>
            expectRequest(request, {
              countryCode: fullPaymentContext.countryCode,
              currencyCode: fullPaymentContext.amountOfMoney.currencyCode,
              amount: fullPaymentContext.amountOfMoney.amount,
              isRecurring: fullPaymentContext.isRecurring,
            })
        );
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result = await session.getPaymentProductNetworks(1);
        expect(result).toStrictEqual(networksResponse);
      });
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getPaymentProductNetworks(1)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/networks?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(networksResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getPaymentProductNetworks(1);
        const result2 = await session.getPaymentProductNetworks(1);
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/networks?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(networksResponse)),
        });
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result1 = await session.getPaymentProductNetworks(1);
        const result2 = await session.getPaymentProductNetworks(1);
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1/networks?`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(networksResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPaymentProductNetworks(1);
        session.updatePaymentContext({
          countryCode: "GB",
        });
        await session.getPaymentProductNetworks(1);
        expect(device.capturedRequests()).toHaveLength(2);
      });

      test("different products", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(networksResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPaymentProductNetworks(1);
        await session.getPaymentProductNetworks(2);
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("createApplePaySession", () => {
    const applePaySpecificInput: MobilePaymentProductSession302SpecificInput = {
      displayName: "TEST",
      domainName: "localhost",
      validationUrl: "http://localhost",
    };

    test("successful", async () => {
      const createSessionResponse: api.CreatePaymentProductSessionResponse = {
        paymentProductSession302SpecificOutput: {
          sessionObject: "session-object",
        },
      };
      const device = new MockDevice().mockPost(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/302/sessions`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(createSessionResponse)),
        },
        (request) =>
          expectRequest(
            request,
            {},
            {
              paymentProductSession302SpecificInput: applePaySpecificInput,
            }
          )
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.createApplePaySession(applePaySpecificInput);
      expect(result).toStrictEqual(createSessionResponse.paymentProductSession302SpecificOutput);
    });

    test("no Apple Pay specific output returned", async () => {
      const createSessionResponse: api.CreatePaymentProductSessionResponse = {};
      const device = new MockDevice().mockPost(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/302/sessions`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(createSessionResponse)),
        },
        (request) =>
          expectRequest(
            request,
            {},
            {
              paymentProductSession302SpecificInput: applePaySpecificInput,
            }
          )
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const onSuccess = jest.fn();
      const result = await session
        .createApplePaySession(applePaySpecificInput)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(new Error("no paymentProductSession302SpecificOutput returned"));
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .createApplePaySession(applePaySpecificInput)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    test("caching not enabled", async () => {
      const createSessionResponse: api.CreatePaymentProductSessionResponse = {
        paymentProductSession302SpecificOutput: {
          sessionObject: "session-object",
        },
      };
      const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/302/sessions`, {
        statusCode: 200,
        contentType: "application/json",
        body: JSON.parse(JSON.stringify(createSessionResponse)),
      });
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result1 = await session.createApplePaySession(applePaySpecificInput);
      const result2 = await session.createApplePaySession(applePaySpecificInput);
      expect(result2).toStrictEqual(result1);
      expect(device.capturedRequests()).toHaveLength(2);
    });
  });

  describe("convertAmount", () => {
    test("successful", async () => {
      const convertAmountResponse: api.ConvertAmountResponse = {
        convertedAmount: 1234,
      };
      const device = new MockDevice().mockGet(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/convert/amount`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(convertAmountResponse)),
        },
        (request) =>
          expectRequest(request, {
            amount: 1000,
            source: "EUR",
            target: "USD",
          })
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.convertAmount(1000, "EUR", "USD");
      expect(result).toStrictEqual(convertAmountResponse);
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .convertAmount(1000, "EUR", "USD")
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      const convertAmountResponse: api.ConvertAmountResponse = {
        convertedAmount: 1234,
      };

      test("same input", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/convert/amount`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(convertAmountResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.convertAmount(1000, "EUR", "USD");
        const result2 = await session.convertAmount(1000, "EUR", "USD");
        expect(result2).toBe(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("different inputs", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/convert/amount`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(convertAmountResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.convertAmount(1000, "EUR", "USD");
        await session.convertAmount(1001, "EUR", "USD");
        await session.convertAmount(1000, "GBP", "USD");
        await session.convertAmount(1000, "EUR", "GBP");
        expect(device.capturedRequests()).toHaveLength(4);
      });
    });
  });

  describe("getIINDetails", () => {
    test("not enough digits", async () => {
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const result = await session.getIINDetails("12345");
      expect(result).toStrictEqual({
        status: "NOT_ENOUGH_DIGITS",
      });
    });

    describe("allowed in context", () => {
      const iinDetailsResponse: api.GetIINDetailsResponse = {
        countryCode: "NL",
        paymentProductId: 1,
        isAllowedInContext: true,
      };

      test("minimal payment context", async () => {
        const device = new MockDevice().mockPost(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(iinDetailsResponse)),
          },
          (request) =>
            expectRequest(
              request,
              {},
              {
                bin: "123456",
                paymentContext: {
                  amountOfMoney: fullPaymentContext.amountOfMoney,
                  countryCode: fullPaymentContext.countryCode,
                },
              }
            )
        );
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getIINDetails("1234567");
        expect(result).toStrictEqual(Object.assign({ status: "SUPPORTED" }, iinDetailsResponse));
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockPost(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(iinDetailsResponse)),
          },
          (request) =>
            expectRequest(
              request,
              {},
              {
                bin: "12345678",
                paymentContext: {
                  amountOfMoney: fullPaymentContext.amountOfMoney,
                  countryCode: fullPaymentContext.countryCode,
                  isInstallments: fullPaymentContext.isInstallments,
                  isRecurring: fullPaymentContext.isRecurring,
                },
              }
            )
        );
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result = await session.getIINDetails("1234567890");
        expect(result).toStrictEqual(Object.assign({ status: "SUPPORTED" }, iinDetailsResponse));
      });
    });

    test("not allowed in context", async () => {
      const iinDetailsResponse: api.GetIINDetailsResponse = {
        countryCode: "NL",
        paymentProductId: 1,
        isAllowedInContext: false,
      };
      const device = new MockDevice().mockPost(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`,
        {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(iinDetailsResponse)),
        },
        (request) =>
          expectRequest(
            request,
            {},
            {
              bin: "123456",
              paymentContext: {
                amountOfMoney: fullPaymentContext.amountOfMoney,
                countryCode: fullPaymentContext.countryCode,
              },
            }
          )
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.getIINDetails("123456");
      expect(result).toStrictEqual(Object.assign({ status: "NOT_ALLOWED" }, iinDetailsResponse));
    });

    test("not known", async () => {
      const errorResponse: api.ErrorResponse = {
        errorId: "error-id",
        errors: [],
      };
      const device = new MockDevice().mockPost(
        `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`,
        {
          statusCode: 404,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(errorResponse)),
        },
        (request) =>
          expectRequest(
            request,
            {},
            {
              bin: "123456",
              paymentContext: {
                amountOfMoney: fullPaymentContext.amountOfMoney,
                countryCode: fullPaymentContext.countryCode,
              },
            }
          )
      );
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const result = await session.getIINDetails("123456");
      expect(result).toStrictEqual(Object.assign({ status: "UNKNOWN" }, errorResponse));
    });

    describe("allowedInContext not set", () => {
      const iinDetailsResponse: api.GetIINDetailsResponse = {
        countryCode: "NL",
        paymentProductId: 1,
      };

      test("product found", async () => {
        const device = new MockDevice()
          .mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(iinDetailsResponse)),
          })
          .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(products.paymentProducts[0])),
          });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getIINDetails("123456");
        expect(result).toStrictEqual(Object.assign({ status: "SUPPORTED", isAllowedInContext: true }, iinDetailsResponse));
      });

      test("product not found", async () => {
        const device = new MockDevice()
          .mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(iinDetailsResponse)),
          })
          .mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`, {
            statusCode: 404,
            contentType: "application/json",
            body: {},
          });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getIINDetails("123456");
        expect(result).toStrictEqual(Object.assign({ status: "NOT_ALLOWED", isAllowedInContext: false }, iinDetailsResponse));
      });

      test("product HTTP error", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(iinDetailsResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getIINDetails("123456");
        expect(result).toStrictEqual(Object.assign({ status: "NOT_ALLOWED", isAllowedInContext: false }, iinDetailsResponse));
      });
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getIINDetails("123456")
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      const iinDetailsResponse: api.GetIINDetailsResponse = {
        countryCode: "NL",
        paymentProductId: 1,
        isAllowedInContext: true,
      };

      test("minimal payment context", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(iinDetailsResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getIINDetails("1234567");
        const result2 = await session.getIINDetails("123456");
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(iinDetailsResponse)),
        });
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result1 = await session.getIINDetails("1234567890");
        const result2 = await session.getIINDetails("12345678");
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(iinDetailsResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getIINDetails("1234567");
        session.updatePaymentContext(fullPaymentContext);
        await session.getIINDetails("1234567");
        expect(device.capturedRequests()).toHaveLength(2);
      });

      test("different BIN", async () => {
        const device = new MockDevice().mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/getIINdetails`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(iinDetailsResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getIINDetails("1234567");
        await session.getIINDetails("12345678");
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("getPrivacyPolicy", () => {
    describe("success", () => {
      const privacyPolicyResponse: api.GetPrivacyPolicyResponse = {
        htmlContent: "<span>foo</span>",
      };

      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/privacypolicy`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(privacyPolicyResponse)),
          },
          (request) => expectRequest(request)
        );
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result = await session.getPrivacyPolicy();
        expect(result).toStrictEqual(privacyPolicyResponse);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(
          `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/privacypolicy`,
          {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(privacyPolicyResponse)),
          },
          (request) =>
            expectRequest(request, {
              paymentProductId: 1,
              locale: fullPaymentContext.locale,
            })
        );
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result = await session.getPrivacyPolicy(1);
        expect(result).toStrictEqual(privacyPolicyResponse);
      });
    });

    test("HTTP error", async () => {
      // don't mock anything -> will lead to an error response
      const session = new Session(sessionDetails, minimalPaymentContext, new MockDevice());
      const onSuccess = jest.fn();
      const result = await session
        .getPrivacyPolicy()
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(notImplementedResponse());
    });

    describe("caching", () => {
      const privacyPolicyResponse: api.GetPrivacyPolicyResponse = {
        htmlContent: "<span>foo</span>",
      };

      test("minimal payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/privacypolicy`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(privacyPolicyResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const result1 = await session.getPrivacyPolicy();
        const result2 = await session.getPrivacyPolicy();
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("full payment context", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/privacypolicy`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(privacyPolicyResponse)),
        });
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const result1 = await session.getPrivacyPolicy();
        const result2 = await session.getPrivacyPolicy();
        expect(result2).toStrictEqual(result1);
        expect(device.capturedRequests()).toHaveLength(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/privacypolicy`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(privacyPolicyResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPrivacyPolicy();
        session.updatePaymentContext(fullPaymentContext);
        await session.getPrivacyPolicy();
        expect(device.capturedRequests()).toHaveLength(2);
      });

      test("different product", async () => {
        const device = new MockDevice().mockGet(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/services/privacypolicy`, {
          statusCode: 200,
          contentType: "application/json",
          body: JSON.parse(JSON.stringify(privacyPolicyResponse)),
        });
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        await session.getPrivacyPolicy();
        await session.getPrivacyPolicy(1);
        expect(device.capturedRequests()).toHaveLength(2);
      });
    });
  });

  describe("ApplePay", () => {
    describe("invalid product", () => {
      test("wrong id", async () => {
        const device = new MockDevice().mockApplePayClient(true);
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(1);
        const onSuccess = jest.fn();
        const result = await session
          .ApplePay(product)
          .then(onSuccess)
          .catch((reason) => reason);
        expect(onSuccess).not.toBeCalled();
        expect(result).toStrictEqual(new Error("Not a valid Apple Pay product: " + JSON.stringify(product)));
      });

      test("no Apple Pay specific data", async () => {
        const device = new MockDevice().mockApplePayClient(true);
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const json = JSON.parse(JSON.stringify(products.paymentProducts[0]));
        json.id = PP_APPLE_PAY;
        const product = toPaymentProduct(json);
        const onSuccess = jest.fn();
        const result = await session
          .ApplePay(product)
          .then(onSuccess)
          .catch((reason) => reason);
        expect(onSuccess).not.toBeCalled();
        expect(result).toStrictEqual(new Error("Not a valid Apple Pay product: " + JSON.stringify(product)));
      });
    });

    test("Apple Pay not enabled", async () => {
      const device = new MockDevice().mockApplePayClient(true);
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const product = toBasicPaymentProducts(products).getPaymentProduct(PP_APPLE_PAY);
      const onSuccess = jest.fn();
      const result = await session
        .ApplePay(product)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(new Error("Apple Pay is not available"));
    });

    describe("Apple Pay enabled", () => {
      test("createPayment", async () => {
        const createSessionResponse: api.CreatePaymentProductSessionResponse = {
          paymentProductSession302SpecificOutput: {
            sessionObject: "session-object",
          },
        };
        const onSession = jest.fn();
        const applePayClient: ApplePayClient = {
          createPayment: (sessionFactory) => {
            return sessionFactory({}).then(onSession);
          },
        };
        const device = new MockDevice()
          .mockPost(`${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/302/sessions`, {
            statusCode: 200,
            contentType: "application/json",
            body: JSON.parse(JSON.stringify(createSessionResponse)),
          })
          .mockApplePayClient(applePayClient);
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_APPLE_PAY);
        await session.ApplePay(product).then((applePay) => applePay.createPayment());
        expect(onSession).toHaveBeenCalledWith(createSessionResponse.paymentProductSession302SpecificOutput);
      });
    });

    describe("caching", () => {
      test("Apple Pay not enabled", async () => {
        const device = new MockDevice();
        const spy = jest.spyOn(device, "getApplePayClient");
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_APPLE_PAY);
        await session.ApplePay(product).catch(jest.fn());
        await session.ApplePay(product).catch(jest.fn());
        expect(spy).toBeCalledTimes(1);
      });

      test("Apple Pay enabled", async () => {
        const device = new MockDevice().mockApplePayClient(true);
        const spy = jest.spyOn(device, "getApplePayClient");
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_APPLE_PAY);
        await session.ApplePay(product).catch(jest.fn());
        await session.ApplePay(product).catch(jest.fn());
        expect(spy).toBeCalledTimes(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockApplePayClient(true);
        const spy = jest.spyOn(device, "getApplePayClient");
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_APPLE_PAY);
        await session.ApplePay(product).catch(jest.fn());
        session.updatePaymentContext({});
        await session.ApplePay(product).catch(jest.fn());
        expect(spy).toBeCalledTimes(2);
      });
    });
  });

  describe("GooglePay", () => {
    describe("invalid product", () => {
      test("wrong id", async () => {
        const device = new MockDevice().mockGooglePayClient(true);
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(1);
        const onSuccess = jest.fn();
        const result = await session
          .GooglePay(product)
          .then(onSuccess)
          .catch((reason) => reason);
        expect(onSuccess).not.toBeCalled();
        expect(result).toStrictEqual(new Error("Not a valid Google Pay product: " + JSON.stringify(product)));
      });

      test("no Google Pay specific data", async () => {
        const device = new MockDevice().mockGooglePayClient(true);
        const session = new Session(sessionDetails, minimalPaymentContext, device);
        const json = JSON.parse(JSON.stringify(products.paymentProducts[0]));
        json.id = PP_GOOGLE_PAY;
        const product = toPaymentProduct(json);
        const onSuccess = jest.fn();
        const result = await session
          .GooglePay(product)
          .then(onSuccess)
          .catch((reason) => reason);
        expect(onSuccess).not.toBeCalled();
        expect(result).toStrictEqual(new Error("Not a valid Google Pay product: " + JSON.stringify(product)));
      });
    });

    test("Google Pay not enabled", async () => {
      const device = new MockDevice().mockGooglePayClient(true);
      const session = new Session(sessionDetails, minimalPaymentContext, device);
      const product = toBasicPaymentProducts(products).getPaymentProduct(PP_GOOGLE_PAY);
      const onSuccess = jest.fn();
      const result = await session
        .GooglePay(product)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(result).toStrictEqual(new Error("Google Pay is not available"));
    });

    describe("Google Pay enabled", () => {
      test("createButton", async () => {
        const googlePayClient: GooglePayClient = {
          createButton: jest.fn(),
          prefetchPaymentData: jest.fn(),
          createPayment: jest.fn(),
        };
        const device = new MockDevice().mockGooglePayClient(googlePayClient);
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_GOOGLE_PAY);
        await session.GooglePay(product).then((googlePay) =>
          googlePay.createButton({
            onClick: jest.fn,
          })
        );
        expect(googlePayClient.createButton).toHaveBeenCalled();
      });

      test("prefetchPaymentData", async () => {
        const googlePayClient: GooglePayClient = {
          createButton: jest.fn(),
          prefetchPaymentData: jest.fn(),
          createPayment: jest.fn(),
        };
        const device = new MockDevice().mockGooglePayClient(googlePayClient);
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_GOOGLE_PAY);
        await session.GooglePay(product).then((googlePay) => googlePay.prefetchPaymentData());
        expect(googlePayClient.prefetchPaymentData).toHaveBeenCalled();
      });

      test("createPayment", async () => {
        const googlePayClient: GooglePayClient = {
          createButton: jest.fn(),
          prefetchPaymentData: jest.fn(),
          createPayment: jest.fn(),
        };
        const device = new MockDevice().mockGooglePayClient(googlePayClient);
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_GOOGLE_PAY);
        await session.GooglePay(product).then((googlePay) => googlePay.createPayment());
        expect(googlePayClient.createPayment).toHaveBeenCalled();
      });
    });

    describe("caching", () => {
      test("Google Pay not enabled", async () => {
        const device = new MockDevice();
        const spy = jest.spyOn(device, "getGooglePayClient");
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_GOOGLE_PAY);
        await session.GooglePay(product).catch(jest.fn());
        await session.GooglePay(product).catch(jest.fn());
        expect(spy).toBeCalledTimes(1);
      });

      test("Google Pay enabled", async () => {
        const device = new MockDevice().mockGooglePayClient(true);
        const spy = jest.spyOn(device, "getGooglePayClient");
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_GOOGLE_PAY);
        await session.GooglePay(product).catch(jest.fn());
        await session.GooglePay(product).catch(jest.fn());
        expect(spy).toBeCalledTimes(1);
      });

      test("payment context update", async () => {
        const device = new MockDevice().mockGooglePayClient(true);
        const spy = jest.spyOn(device, "getGooglePayClient");
        const session = new Session(sessionDetails, fullPaymentContext, device);
        const product = toBasicPaymentProducts(products).getPaymentProduct(PP_GOOGLE_PAY);
        await session.GooglePay(product).catch(jest.fn());
        session.updatePaymentContext({});
        await session.GooglePay(product).catch(jest.fn());
        expect(spy).toBeCalledTimes(2);
      });
    });
  });

  test("URLs have trailing slash", async () => {
    const device = new MockDevice().mockGet(
      `${sessionDetails.clientApiUrl}/v1/${sessionDetails.customerId}/products/1?`,
      {
        statusCode: 200,
        contentType: "application/json",
        body: JSON.parse(JSON.stringify(products.paymentProducts[0])),
      },
      (request) =>
        expect(request.params).toStrictEqual({
          countryCode: minimalPaymentContext.countryCode,
          currencyCode: minimalPaymentContext.amountOfMoney.currencyCode,
          amount: minimalPaymentContext.amountOfMoney.amount,
        })
    );
    const session = new Session(
      {
        assetUrl: sessionDetails.assetUrl + "/",
        clientApiUrl: sessionDetails.clientApiUrl + "/",
        clientSessionId: sessionDetails.clientSessionId,
        customerId: sessionDetails.customerId,
      },
      minimalPaymentContext,
      device
    );
    const result = await session.getPaymentProduct(1);
    expect(result.id).toBe(1);
    expect(result.fields).toHaveLength(4);
    expect(result.fields[0].id).toBe("cvv");
    expect(result.fields[1].id).toBe("cardHolder");
    expect(result.fields[2].id).toBe("cardNumber");
    expect(result.fields[2].displayHints?.tooltip?.image).toBe(`${sessionDetails.assetUrl}/card.png`);
    expect(result.fields[3].id).toBe("expirationDate");
  });

  test("default device", async () => {
    globalMocks.mockIfNecessary("window", {
      navigator: {
        language: "en-GB",
        javaEnabled: () => false,
      },
      screen: {
        colorDepth: 32,
        screenHeight: 1200,
        screenWidth: 1920,
      },
      innerHeight: 1200,
      innerWidth: 1920,
    });
    const session = new Session(sessionDetails, minimalPaymentContext);
    // Use encryption with a custom crypto engine to show that a Browser device is used
    // Overwrite getPublicKey to prevent making actual HTTP requests
    Object.defineProperty(session, "getPublicKey", {
      value: () =>
        Promise.resolve({
          keyId: "key-id",
          publicKey:
            "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkiJlGL1QjUnGDLpMNBtZPYVtOU121jfFcV4WrZayfw9Ib/1AtPBHP/0ZPocdA23zDh6aB+QiOQEkHZlfnelBNnEzEu4ibda3nDdjSrKveSiQPyB5X+u/IS3CR48B/g4QJ+mcMV9hoFt6Hx3R99A0HWMs4um8elQsgB11MsLmGb1SuLo0S1pgL3EcckXfBDNMUBMQ9EtLC9zQW6Y0kx6GFXHgyjNb4yixXfjo194jfhei80sVQ49Y/SHBt/igATGN1l18IBDtO0eWmWeBckwbNkpkPLAvJfsfa3JpaxbXwg3rTvVXLrIRhvMYqTsQmrBIJDl7F6igPD98Y1FydbKe5QIDAQAB",
        }),
    });
    const encrypt = (payload: string) => {
      return Promise.resolve(payload);
    };
    session.setCryptoEngine({
      randomString: jest.fn(),
      encrypt,
    });
    const encryptor = await session.getEncryptor();
    const request = new PaymentRequest();
    request.setPaymentProduct(toPaymentProduct(products.paymentProducts[0]));
    request.setValue("expirationDate", "1230");
    request.setValue("cardNumber", "4242424242424242");
    request.setValue("cvv", "123");
    const payload = await encryptor.encrypt(request).then(JSON.parse);
    expect(payload).toHaveProperty("collectedDeviceInformation", {
      timezoneOffsetUtcMinutes: new Date().getTimezoneOffset(),
      locale: window.navigator.language,
      browserData: {
        javaScriptEnabled: true,
        javaEnabled: window.navigator.javaEnabled(),
        colorDepth: window.screen.colorDepth,
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
      },
    });
  });
});
