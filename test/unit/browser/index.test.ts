/**
 * @group unit:browser
 */

import { Browser } from "../../../src/browser";
import { xhrHttpClient } from "../../../src/browser/xhr";
import { fetchHttpClient } from "../../../src/http/fetch";
import {
  ApplePaySpecificInput,
  GooglePaySpecificInput,
  PaymentContext,
  PaymentProduct302SpecificData,
  PaymentProduct320SpecificData,
} from "../../../src/model";
import { Mocks } from "../mock.test";

describe("Browser", () => {
  const globalMocks = Mocks.global();

  afterEach(() => globalMocks.restore());

  test("getPlatformIdentifier", () => {
    globalMocks.mockIfNecessary("window", {
      navigator: {
        userAgent: "TestAgent",
      },
    });
    const browser = new Browser();
    expect(browser.getPlatformIdentifier()).toBe(window.navigator.userAgent);
  });

  test("getDeviceInformation", () => {
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
    const browser = new Browser();
    expect(browser.getDeviceInformation()).toStrictEqual({
      timezoneOffsetUtcMinutes: new Date().getTimezoneOffset(),
      locale: window.navigator.language,
      javaEnabled: window.navigator.javaEnabled(),
      colorDepth: window.screen.colorDepth,
      screenHeight: window.screen.height,
      screenWidth: window.screen.width,
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
    });
  });

  describe("getHttpClient", () => {
    test("fetch defined", () => {
      globalMocks.mockIfNecessary("fetch", {});
      const browser = new Browser();
      expect(browser.getHttpClient()).toBe(fetchHttpClient);
    });

    test("fetch not defined", () => {
      globalMocks.mock("fetch", undefined);
      const browser = new Browser();
      expect(browser.getHttpClient()).toStrictEqual(xhrHttpClient);
    });
  });

  describe("getApplePayClient", () => {
    const applePaySpecificInput: ApplePaySpecificInput = {
      merchantName: "TEST",
    };
    const applePaySpecificData: PaymentProduct302SpecificData = {
      networks: ["1"],
    };

    const paymentContext: PaymentContext = {
      amountOfMoney: {
        amount: 1000,
        currencyCode: "EUR",
      },
      countryCode: "NL",
      paymentProductSpecificInputs: {
        applePay: applePaySpecificInput,
      },
    };

    describe("ApplePaySession defined", () => {
      test("can make payments", async () => {
        globalMocks.mock("ApplePaySession", {
          canMakePayments: () => true,
        });
        const browser = new Browser();
        const applePayClient = await browser.getApplePayClient(applePaySpecificInput, applePaySpecificData, paymentContext);
        expect(applePayClient).not.toBeUndefined();
      });

      test("cannot make payments", async () => {
        globalMocks.mock("ApplePaySession", {
          canMakePayments: () => false,
        });
        const browser = new Browser();
        const applePayClient = await browser.getApplePayClient(applePaySpecificInput, applePaySpecificData, paymentContext);
        expect(applePayClient).toBeUndefined();
      });
    });

    test("ApplePaySession not defined", async () => {
      globalMocks.mock("ApplePaySession", undefined);
      const browser = new Browser();
      const applePayClient = await browser.getApplePayClient(applePaySpecificInput, applePaySpecificData, paymentContext);
      expect(applePayClient).toBeUndefined();
    });
  });

  describe("getGooglePayClient", () => {
    const googlePaySpecificInput: GooglePaySpecificInput = {
      gatewayMerchantId: "GMID",
      merchantId: "MID",
    };
    const googlePaySpecificData: PaymentProduct320SpecificData = {
      gateway: "GW",
      networks: ["VISA"],
    };

    const paymentContext: PaymentContext = {
      amountOfMoney: {
        amount: 1000,
        currencyCode: "EUR",
      },
      countryCode: "NL",
      paymentProductSpecificInputs: {
        googlePay: googlePaySpecificInput,
      },
    };

    beforeEach(() => {
      jest.spyOn(console, "warn").mockImplementation(() => {
        /* do nothing */
      });
    });

    describe("Google Pay loaded", () => {
      test("ready to pay", async () => {
        class PaymentsClientMock {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          isReadyToPay(request: google.payments.api.IsReadyToPayRequest): Promise<google.payments.api.IsReadyToPayResponse> {
            return Promise.resolve({
              result: true,
            });
          }
        }

        globalMocks.mock("google", {
          payments: {
            api: {
              PaymentsClient: PaymentsClientMock,
            },
          },
        });
        const browser = new Browser();
        const googlePayClient = await browser.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, paymentContext);
        expect(googlePayClient).not.toBeUndefined();
      });

      test("not ready to pay", async () => {
        class PaymentsClientMock {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          isReadyToPay(request: google.payments.api.IsReadyToPayRequest): Promise<google.payments.api.IsReadyToPayResponse> {
            return Promise.resolve({
              result: false,
            });
          }
        }

        globalMocks.mock("google", {
          payments: {
            api: {
              PaymentsClient: PaymentsClientMock,
            },
          },
        });
        const browser = new Browser();
        const googlePayClient = await browser.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, paymentContext);
        expect(googlePayClient).toBeUndefined();
      });
    });

    test("Google Pay not loaded", async () => {
      globalMocks.mock("google", undefined);
      const browser = new Browser();
      const googlePayClient = await browser.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, paymentContext);
      expect(googlePayClient).toBeUndefined();
    });
  });
});
