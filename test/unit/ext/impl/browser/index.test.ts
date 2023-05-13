/**
 * @group unit:browser
 */

import { browser } from "../../../../../src/ext/impl/browser";
import { fetchHttpClient } from "../../../../../src/ext/impl/http/fetch";
import { xhrHttpClient } from "../../../../../src/ext/impl/http/xhr";
import {
  ApplePaySpecificInput,
  GooglePaySpecificInput,
  PaymentContext,
  PaymentProduct302SpecificData,
  PaymentProduct320SpecificData,
} from "../../../../../src/model";
import { Mocks, isMinNode } from "../../../test-util";

describe("Browser", () => {
  const globalMocks = Mocks.global();

  afterEach(() => globalMocks.restore());

  test("getPlatformIdentifier", () => {
    globalMocks.mockIfNecessary("window", {
      navigator: {
        userAgent: "TestAgent",
      },
    });
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

  test("getHttpClient", () => {
    // Fetch is natively available only from Node.js 18 on
    const expected = isMinNode(18) ? fetchHttpClient : xhrHttpClient;
    expect(browser.getHttpClient()).toBe(expected);
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
        const applePayClient = await browser.getApplePayClient(applePaySpecificInput, applePaySpecificData, paymentContext);
        expect(applePayClient).not.toBeUndefined();
      });

      test("cannot make payments", async () => {
        globalMocks.mock("ApplePaySession", {
          canMakePayments: () => false,
        });
        const applePayClient = await browser.getApplePayClient(applePaySpecificInput, applePaySpecificData, paymentContext);
        expect(applePayClient).toBeUndefined();
      });
    });

    test("ApplePaySession not defined", async () => {
      globalMocks.mock("ApplePaySession", undefined);
      const applePayClient = await browser.getApplePayClient(applePaySpecificInput, applePaySpecificData, paymentContext);
      expect(applePayClient).toBeUndefined();
    });
  });

  describe("getGooglePayClient", () => {
    const googlePaySpecificInput: GooglePaySpecificInput = {
      connectMerchantId: "CMID",
      googlePayMerchantId: "GPMID",
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
          isReadyToPay(): Promise<google.payments.api.IsReadyToPayResponse> {
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
        const googlePayClient = await browser.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, paymentContext);
        expect(googlePayClient).not.toBeUndefined();
      });

      test("not ready to pay", async () => {
        class PaymentsClientMock {
          isReadyToPay(): Promise<google.payments.api.IsReadyToPayResponse> {
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
        const googlePayClient = await browser.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, paymentContext);
        expect(googlePayClient).toBeUndefined();
      });
    });

    test("Google Pay not loaded", async () => {
      globalMocks.mock("google", undefined);
      const googlePayClient = await browser.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, paymentContext);
      expect(googlePayClient).toBeUndefined();
    });
  });
});
