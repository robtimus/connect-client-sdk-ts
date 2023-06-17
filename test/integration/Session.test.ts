/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * @group integration
 */

import { PaymentContext, PaymentRequest, Session } from "../../src";
import { fetchHttpClient } from "../../src/ext/impl/http/fetch";
import { Device } from "../../src/ext";
import { createPaymentWithEncryptedCustomerInput, getSessionDetails } from "../s2s-api-util";

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
    getHttpClient: () => fetchHttpClient!,
    getApplePayClient: () => Promise.resolve(undefined),
    getGooglePayClient: () => Promise.resolve(undefined),
  };
  const paymentContext: PaymentContext = {
    amountOfMoney: {
      amount: 1000,
      currencyCode: "EUR",
    },
    countryCode: "NL",
  };

  let session: Session;

  beforeAll(async () => {
    const sessionDetails = await getSessionDetails();
    session = new Session(sessionDetails, paymentContext, device);
  });

  test("get public key", async () => {
    expect(async () => await session.getPublicKey()).not.toThrow();
  });

  test("get products", async () => {
    const products = await session.getBasicPaymentProducts();
    expect(products.paymentProducts).not.toHaveLength(0);
  }, 30000);

  test("get product groups", async () => {
    const groups = await session.getBasicPaymentProductGroups();
    expect(groups.paymentProductGroups).toHaveLength(1);
    const group = groups.findPaymentProductGroup("cards");
    expect(group).not.toBeUndefined();
  }, 30000);

  test("get items", async () => {
    const items = await session.getBasicPaymentItems(true);
    expect(items.paymentItems).not.toHaveLength(0);
    expect(items.findPaymentItem("cards")).toBeTruthy();
    expect(items.paymentItems.filter((item) => item.type === "product")).not.toHaveLength(0);
  });

  test("convert amount", async () => {
    const result = await session.convertAmount({
      amount: 1000,
      source: "EUR",
      target: "USD",
    });
    expect(result.convertedAmount).toBeGreaterThan(0);
  });

  describe("get IIN details", () => {
    test("supported", async () => {
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

    const encryptedCustomerInput = await session.getEncryptor().encrypt(paymentRequest);

    // A 402 response is allowed; that means that the encryption / decryption mechanism works
    try {
      const createPaymentResult = await createPaymentWithEncryptedCustomerInput(encryptedCustomerInput, paymentContext.amountOfMoney);
      expect(createPaymentResult.payment?.id).toBeTruthy();
    } catch (reason) {
      expect(reason).toHaveProperty("status", 402);
    }
  });
});
