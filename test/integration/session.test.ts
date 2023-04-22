/**
 * @group integration
 */

import * as connectSdk from "promiseful-connect-sdk";
import { Device, PaymentContext, Session, SessionDetails } from "../../src";
import { fetchHttpClient } from "../../src/http/fetch";

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
    getPlatformIdentifier: () => process.env["OS"] + " Node.js/" + process.versions.node,
    getDeviceInformation: () => ({
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

  function replaceHost(url: string): string {
    const index = url.indexOf("/client");
    const port = config.apiEndpoint.port === -1 ? "" : ":" + config.apiEndpoint.port;
    return `${config.apiEndpoint.scheme}://${config.apiEndpoint.host}${port}${url.substring(index)}`;
  }

  async function createSession(): Promise<Session> {
    const sessionDetails: SessionDetails = await sessionResponse.then((response) => {
      response.clientApiUrl = replaceHost(response.clientApiUrl || "");
      return response;
    }) as SessionDetails;
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
});
