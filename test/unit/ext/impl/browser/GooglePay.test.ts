/**
 * @group unit:browser
 */

import { GooglePayClient, GooglePaySpecificData } from "../../../../../src/ext";
import { newGooglePayClient } from "../../../../../src/ext/impl/browser/GooglePay";
import { GooglePaySpecificInput, PaymentContext } from "../../../../../src/model";
import { Mocks } from "../../../test-util";

class PaymentsClientMock {
  static readyToPay = true;

  static capturedReadyToPayRequest?: google.payments.api.IsReadyToPayRequest;
  static capturedButtonOptions?: google.payments.api.ButtonOptions;
  static capturedPaymentDataRequest?: google.payments.api.PaymentDataRequest;

  isReadyToPay(request: google.payments.api.IsReadyToPayRequest): Promise<google.payments.api.IsReadyToPayResponse> {
    PaymentsClientMock.capturedReadyToPayRequest = request;
    return Promise.resolve({
      result: PaymentsClientMock.readyToPay,
    });
  }

  createButton(options: google.payments.api.ButtonOptions): HTMLElement {
    PaymentsClientMock.capturedButtonOptions = options;
    return {} as HTMLElement;
  }

  loadPaymentData(request: google.payments.api.PaymentDataRequest): Promise<google.payments.api.PaymentData> {
    PaymentsClientMock.capturedPaymentDataRequest = request;
    return Promise.resolve({
      apiVersion: 2,
      apiVersionMinor: 0,
      paymentMethodData: {
        type: "CARD",
        tokenizationData: {
          type: "PAYMENT_GATEWAY",
          token: "TOKEN",
        },
      },
    });
  }

  prefetchPaymentData(request: google.payments.api.PaymentDataRequest): void {
    PaymentsClientMock.capturedPaymentDataRequest = request;
  }
}

describe("Google Pay", () => {
  const mocks = Mocks.global();

  const googlePaySpecificInput: GooglePaySpecificInput = {
    connectMerchantId: "CMID",
    googlePayMerchantId: "GPMID",
    merchantName: "TEST",
  };
  const googlePaySpecificData: GooglePaySpecificData = {
    gateway: "GW",
    networks: ["1"],
  };
  const context: PaymentContext = {
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
    PaymentsClientMock.readyToPay = true;
    delete PaymentsClientMock.capturedReadyToPayRequest;
    delete PaymentsClientMock.capturedButtonOptions;
    delete PaymentsClientMock.capturedPaymentDataRequest;

    mocks.mock("google", {
      payments: {
        api: {
          PaymentsClient: PaymentsClientMock,
        },
      },
    });

    jest.spyOn(console, "warn").mockImplementation(() => {
      /* do nothing */
    });
  });

  afterEach(() => mocks.restore());

  test("no networks available", async () => {
    const result = await newGooglePayClient(
      googlePaySpecificInput,
      {
        gateway: "GW",
        networks: [],
      },
      context
    );
    expect(result).toBeUndefined();
  });

  test("no Google Pay available", async () => {
    mocks.restore();

    const result = await newGooglePayClient(googlePaySpecificInput, googlePaySpecificData, context);
    expect(result).toBeUndefined();
  });

  describe("ready to pay", () => {
    test("createButton", async () => {
      const result = (await newGooglePayClient(googlePaySpecificInput, googlePaySpecificData, context)) as GooglePayClient;
      expect(result).toBeTruthy();

      const onClick = jest.fn();
      result.createButton({
        onClick,
        buttonLocale: "en",
        buttonColor: "black",
      });
      expect(PaymentsClientMock.capturedReadyToPayRequest).toStrictEqual({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["1"],
            },
          },
        ],
      });
      expect(PaymentsClientMock.capturedButtonOptions).toStrictEqual({
        onClick,
        buttonLocale: "en",
        buttonColor: "black",
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["1"],
            },
          },
        ],
      });
    });

    describe("prefetchPaymentData", () => {
      async function runTest(input: GooglePaySpecificInput, data: GooglePaySpecificData, expectedCountryCode?: string): Promise<void> {
        const result = (await newGooglePayClient(input, data, context)) as GooglePayClient;
        expect(result).toBeTruthy();

        await result.prefetchPaymentData();
        expect(PaymentsClientMock.capturedReadyToPayRequest).toStrictEqual({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["1"],
              },
            },
          ],
        });
        expect(PaymentsClientMock.capturedPaymentDataRequest).toStrictEqual({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["1"],
              },
              tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: {
                  gateway: "GW",
                  gatewayMerchantId: "CMID",
                },
              },
            },
          ],
          transactionInfo: {
            currencyCode: "EUR",
            countryCode: expectedCountryCode,
            totalPriceStatus: "NOT_CURRENTLY_KNOWN",
          },
          merchantInfo: {
            merchantId: "GPMID",
            merchantName: "TEST",
          },
        });
      }

      test("countryCode from input", async () => {
        await runTest(Object.assign({ transactionCountryCode: "US" }, googlePaySpecificInput), googlePaySpecificData, "US");
      });

      test("countryCode from data", async () => {
        await runTest(
          Object.assign({ transactionCountryCode: "US" }, googlePaySpecificInput),
          Object.assign({ acquirerCountry: "GB" }, googlePaySpecificData),
          "GB"
        );
      });

      test("countryCode from context", async () => {
        await runTest(googlePaySpecificInput, googlePaySpecificData, "NL");
      });
    });

    describe("createPayment", () => {
      async function runTest(input: GooglePaySpecificInput, data: GooglePaySpecificData, expectedCountryCode?: string): Promise<void> {
        const result = (await newGooglePayClient(input, data, context)) as GooglePayClient;
        expect(result).toBeTruthy();

        await result.createPayment();
        expect(PaymentsClientMock.capturedReadyToPayRequest).toStrictEqual({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["1"],
              },
            },
          ],
        });
        expect(PaymentsClientMock.capturedPaymentDataRequest).toStrictEqual({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["1"],
              },
              tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: {
                  gateway: "GW",
                  gatewayMerchantId: "CMID",
                },
              },
            },
          ],
          transactionInfo: {
            currencyCode: "EUR",
            countryCode: expectedCountryCode,
            totalPrice: "10.00",
            totalPriceStatus: "FINAL",
          },
          merchantInfo: {
            merchantId: "GPMID",
            merchantName: "TEST",
          },
        });
      }

      test("countryCode from input", async () => {
        await runTest(Object.assign({ transactionCountryCode: "US" }, googlePaySpecificInput), googlePaySpecificData, "US");
      });

      test("countryCode from data", async () => {
        await runTest(
          Object.assign({ transactionCountryCode: "US" }, googlePaySpecificInput),
          Object.assign({ acquirerCountry: "GB" }, googlePaySpecificData),
          "GB"
        );
      });

      test("countryCode from context", async () => {
        await runTest(googlePaySpecificInput, googlePaySpecificData, "NL");
      });
    });
  });

  test("not ready to pay", async () => {
    PaymentsClientMock.readyToPay = false;

    const result = await newGooglePayClient(googlePaySpecificInput, googlePaySpecificData, context);
    expect(result).toBeUndefined();
    expect(PaymentsClientMock.capturedReadyToPayRequest).toStrictEqual({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: {
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            allowedCardNetworks: ["1"],
          },
        },
      ],
    });
  });
});
