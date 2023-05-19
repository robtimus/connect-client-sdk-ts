/**
 * @group integration
 */

import * as connectSdk from "promiseful-connect-sdk";
import { CreatePaymentRequest } from "connect-sdk-nodejs/lib/model/domain/payment";
import { SessionResponse } from "connect-sdk-nodejs/lib/model/domain/sessions";
import { PaymentContext, PaymentRequest, Session, SessionDetails } from "../../src";
import { fetchHttpClient } from "../../src/ext/impl/http/fetch";
import { Device } from "../../src/ext";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("../config.json");

connectSdk.init({
  host: config.apiEndpoint.host,
  scheme: config.apiEndpoint.scheme,
  port: config.apiEndpoint.port,
  enableLogging: config.enableLogging,
  apiKeyId: config.apiKeyId,
  secretApiKey: config.secretApiKey,
  integrator: config.integrator,
});

describe("session", () => {
  const device: Device = {
    getDeviceInformation: () => ({
      platformIdentifier: process.env["OS"] + " Node.js/" + process.versions.node,
      colorDepth: 24,
      innerHeight: 1200,
      innerWidth: 1920,
      javaEnabled: false,
      locale: "en-GB",
      screenHeight: 1200,
      screenWidth: 1920,
      timezoneOffsetUtcMinutes: new Date().getTimezoneOffset(),
    }),
    getHttpClient: () => fetchHttpClient,
    getApplePayClient: () => Promise.resolve(undefined),
    getGooglePayClient: () => Promise.resolve(undefined),
  };
  const sessionResponse = connectSdk.sessions.create(config.merchantId, {});
  const paymentContext: PaymentContext = {
    amountOfMoney: {
      amount: 1000,
      currencyCode: "EUR",
    },
    countryCode: "NL",
  };

  type NoNulls<T> = {
    [P in keyof T]: NonNullable<T[P]>;
  };

  async function createSession(): Promise<Session> {
    const sessionDetails: SessionDetails = (await sessionResponse) as NoNulls<Required<SessionResponse>>;
    return new Session(sessionDetails, paymentContext, device);
  }

  test("get public key", async () => {
    const session = await createSession();
    expect(async () => await session.getPublicKey()).not.toThrow();
  });

  test("get products", async () => {
    const session = await createSession();
    const products = await session.getBasicPaymentProducts();
    expect(products.paymentProducts).not.toHaveLength(0);
  }, 30000);

  test("get product groups", async () => {
    const session = await createSession();
    const groups = await session.getBasicPaymentProductGroups();
    expect(groups.paymentProductGroups).toHaveLength(1);
    const group = groups.findPaymentProductGroup("cards");
    expect(group).not.toBeUndefined();
  }, 30000);

  test("get items", async () => {
    const session = await createSession();
    const items = await session.getBasicPaymentItems(true);
    expect(items.paymentItems).not.toHaveLength(0);
    expect(items.findPaymentItem("cards")).toBeTruthy();
    expect(items.paymentItems.filter((item) => item.type === "product")).not.toHaveLength(0);
  });

  test("convert amount", async () => {
    const session = await createSession();
    const result = await session.convertAmount(1000, "EUR", "USD");
    expect(result.convertedAmount).toBeGreaterThan(0);
  });

  describe("get IIN details", () => {
    test("supported", async () => {
      const session = await createSession();
      const result = await session.getIINDetails("424242");
      expect(result.status).toBe("SUPPORTED");
      // Add an if statement so TypeScript allows us to access properties that exist when status === SUPPORTED
      if (result.status === "SUPPORTED") {
        expect(result.isAllowedInContext).toBe(true);

        const product = await session.getPaymentProduct(result.paymentProductId);
        expect(product.paymentProductGroup).toBe("cards");
        expect(product.paymentMethod).toBe("card");
      }
    });

    test("not supported", async () => {
      const session = await createSession();
      const result = await session.getIINDetails("123456");
      expect(result.status).toBe("UNKNOWN");
      // Add an if statement so TypeScript allows us to access properties that exist when status === SUPPORTED
      if (result.status === "UNKNOWN") {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].id).toBe("IIN_NOT_FOUND");
      }
    });
  });

  test("encryptor", async () => {
    const session = await createSession();

    const cardNumber = "4242424242424242";
    const iinDetails = await session.getIINDetails(cardNumber);
    expect(iinDetails.status).toBe("SUPPORTED");
    // Add an if statement so TypeScript allows us to access properties that exist when status === SUPPORTED
    if (iinDetails.status !== "SUPPORTED") {
      return;
    }
    const product = await session.getPaymentProduct(iinDetails.paymentProductId);

    const paymentRequest = new PaymentRequest();
    paymentRequest.setPaymentProduct(product);
    paymentRequest.setValue("cardNumber", cardNumber);
    paymentRequest.setValue("expiryDate", "1230");
    paymentRequest.setValue("cvv", "123");
    paymentRequest.setValue("cardholderName", "John Doe");
    expect(paymentRequest.validate().valid).toBe(true);

    const encryptedCustomerInput = await session.getEncryptor().then((encryptor) => encryptor.encrypt(paymentRequest));

    const createPaymentRequest: CreatePaymentRequest = {
      encryptedCustomerInput,
      order: {
        amountOfMoney: paymentContext.amountOfMoney,
        customer: {
          billingAddress: {
            countryCode: "NL",
          },
        },
      },
    };
    // A 402 response is allowed; that means that the encryption / decryption mechanism works
    try {
      const createPaymentResult = await connectSdk.payments.create(config.merchantId, createPaymentRequest);
      expect(createPaymentResult.payment?.id).toBeTruthy();
    } catch (reason) {
      expect(reason).toHaveProperty("status", 402);
    }
  });
});
