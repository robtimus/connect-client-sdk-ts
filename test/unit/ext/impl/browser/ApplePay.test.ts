/**
 * @group unit:browser
 */

import { URL } from "url";
import { ApplePayClient, ApplePaySpecificData } from "../../../../../src/ext";
import { newApplePayClient } from "../../../../../src/ext/impl/browser/ApplePay";
import {
  ApplePaySpecificInput,
  MobilePaymentProductSession302SpecificInput,
  MobilePaymentProductSession302SpecificOutput,
  PaymentContext,
} from "../../../../../src/model";
import { Mocks } from "../../../test-util";

class ApplePaySessionMock {
  static STATUS_SUCCESS = 1;
  static STATUS_FAILURE = 2;

  static supportedVersions: number[] = [14];

  static mockSuccess = true;

  static capturedVersion?: number;
  static capturedPaymentRequest?: ApplePayJS.ApplePayPaymentRequest;
  static capturedMerchantSession?: unknown;
  static capturedPaymentResult?: number | ApplePayJS.ApplePayPaymentAuthorizationResult;
  static aborted = false;

  constructor(version: number, paymentRequest: ApplePayJS.ApplePayPaymentRequest) {
    ApplePaySessionMock.capturedVersion = version;
    ApplePaySessionMock.capturedPaymentRequest = paymentRequest;
  }

  static supportsVersion(version: number): boolean {
    return ApplePaySessionMock.supportedVersions.includes(version);
  }

  static canMakePayments(): boolean {
    return true;
  }

  onvalidatemerchant?: (event: ApplePayJS.ApplePayValidateMerchantEvent) => void;
  onpaymentauthorized?: (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => void;

  begin(): void {
    const onvalidatemerchant = this.onvalidatemerchant;
    if (!onvalidatemerchant) {
      throw new Error("onvalidatemerchant not set");
    }
    const event: ApplePayJS.ApplePayValidateMerchantEvent = {
      validationURL: "http://localhost/validate",
    } as ApplePayJS.ApplePayValidateMerchantEvent;
    onvalidatemerchant(event);
  }

  completeMerchantValidation(merchantSession: unknown): void {
    ApplePaySessionMock.capturedMerchantSession = merchantSession;

    const onpaymentauthorized = this.onpaymentauthorized;
    if (!onpaymentauthorized) {
      throw new Error("onpaymentauthorized not set");
    }
    if (!ApplePaySessionMock.mockSuccess) {
      throw new Error("Payment failure");
    }

    const payment: ApplePayJS.ApplePayPayment = {} as ApplePayJS.ApplePayPayment;
    payment.token = {
      paymentData: "paymentData",
    } as ApplePayJS.ApplePayPaymentToken;
    const event: ApplePayJS.ApplePayPaymentAuthorizedEvent = {
      payment,
    } as ApplePayJS.ApplePayPaymentAuthorizedEvent;
    onpaymentauthorized(event);
  }

  completePayment(result: number | ApplePayJS.ApplePayPaymentAuthorizationResult): void {
    ApplePaySessionMock.capturedPaymentResult = result;
  }

  abort(): void {
    ApplePaySessionMock.aborted = true;

    const onpaymentauthorized = this.onpaymentauthorized;
    if (!onpaymentauthorized) {
      throw new Error("onpaymentauthorized not set");
    }
    const payment: ApplePayJS.ApplePayPayment = {} as ApplePayJS.ApplePayPayment;
    const event: ApplePayJS.ApplePayPaymentAuthorizedEvent = {
      payment,
    } as ApplePayJS.ApplePayPaymentAuthorizedEvent;
    onpaymentauthorized(event);
  }
}

describe("Apple Pay", () => {
  const mocks = Mocks.global();

  const applePaySpecificInput: ApplePaySpecificInput = {
    merchantName: "TEST",
  };
  const applePaySpecificData: ApplePaySpecificData = {
    networks: ["VISA"],
  };
  const context: PaymentContext = {
    amountOfMoney: {
      amount: 1000,
      currencyCode: "EUR",
    },
    countryCode: "NL",
    paymentProductSpecificInputs: {
      applePay: applePaySpecificInput,
    },
  };

  beforeEach(() => {
    ApplePaySessionMock.supportedVersions = [14];
    ApplePaySessionMock.mockSuccess = true;
    delete ApplePaySessionMock.capturedVersion;
    delete ApplePaySessionMock.capturedPaymentRequest;
    delete ApplePaySessionMock.capturedMerchantSession;
    delete ApplePaySessionMock.capturedPaymentResult;
    ApplePaySessionMock.aborted = false;

    mocks.mock("ApplePaySession", ApplePaySessionMock);
    mocks.mock("window", {
      location: new URL("http://localhost"),
    });
  });

  afterEach(() => mocks.restore());

  describe("createPayment", () => {
    test("no supported version", async () => {
      ApplePaySessionMock.supportedVersions = [];

      const onSuccess = jest.fn();
      const factory = jest.fn();
      const client = newApplePayClient(applePaySpecificInput, applePaySpecificData, context) as ApplePayClient;
      expect(client).toBeTruthy();
      const result = await client
        .createPayment(factory)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(onSuccess).not.toBeCalled();
      expect(factory).not.toBeCalled();
      expect(result).toStrictEqual(new Error("No supported ApplePay JS API version found"));
    });

    describe("success", () => {
      async function runTest(input: ApplePaySpecificInput, data: ApplePaySpecificData, expectedCountryCode: string): Promise<void> {
        let capturedInput: MobilePaymentProductSession302SpecificInput | undefined;
        const factory = (input: MobilePaymentProductSession302SpecificInput) => {
          capturedInput = input;
          const output: MobilePaymentProductSession302SpecificOutput = {
            sessionObject: JSON.stringify({
              id: "sessionId",
            }),
          };
          return Promise.resolve(output);
        };
        const client = newApplePayClient(input, data, context) as ApplePayClient;
        expect(client).toBeTruthy();
        const result = await client.createPayment(factory);
        expect(result).toStrictEqual({
          paymentData: "paymentData",
        });
        expect(capturedInput).toStrictEqual({
          displayName: applePaySpecificInput.merchantName,
          domainName: "localhost",
          validationUrl: "http://localhost/validate",
        });
        expect(ApplePaySessionMock.capturedVersion).toBe(14);
        expect(ApplePaySessionMock.capturedPaymentRequest).toStrictEqual({
          countryCode: expectedCountryCode,
          currencyCode: "EUR",
          merchantCapabilities: ["supports3DS"],
          supportedNetworks: ["VISA"],
          total: {
            label: "TEST",
            amount: "10.00",
          },
        });
        expect(ApplePaySessionMock.capturedMerchantSession).toStrictEqual({
          id: "sessionId",
        });
        expect(ApplePaySessionMock.capturedPaymentResult).toBe(ApplePaySessionMock.STATUS_SUCCESS);
        expect(ApplePaySessionMock.aborted).toBe(false);
      }

      test("countryCode from input", async () => {
        await runTest(Object.assign({ merchantCountryCode: "US" }, applePaySpecificInput), applePaySpecificData, "US");
      });

      test("countryCode from data", async () => {
        await runTest(
          Object.assign({ merchantCountryCode: "US" }, applePaySpecificInput),
          Object.assign({ acquirerCountry: "GB" }, applePaySpecificData),
          "GB"
        );
      });

      test("countryCode from context", async () => {
        // acquirerCountry is not used
        await runTest(applePaySpecificInput, applePaySpecificData, "NL");
      });
    });

    test("failure", async () => {
      ApplePaySessionMock.mockSuccess = false;

      let capturedInput: MobilePaymentProductSession302SpecificInput | undefined;
      const factory = (input: MobilePaymentProductSession302SpecificInput) => {
        capturedInput = input;
        const output: MobilePaymentProductSession302SpecificOutput = {
          sessionObject: JSON.stringify({
            id: "sessionId",
          }),
        };
        return Promise.resolve(output);
      };
      const onSuccess = jest.fn();
      const client = newApplePayClient(applePaySpecificInput, applePaySpecificData, context) as ApplePayClient;
      expect(client).toBeTruthy();
      const result = await client
        .createPayment(factory)
        .then(onSuccess)
        .catch((reason) => reason);
      expect(result).toStrictEqual(new Error("Error authorizing payment"));
      expect(capturedInput).toStrictEqual({
        displayName: applePaySpecificInput.merchantName,
        domainName: "localhost",
        validationUrl: "http://localhost/validate",
      });
      expect(ApplePaySessionMock.capturedVersion).toBe(14);
      expect(ApplePaySessionMock.capturedPaymentRequest).toStrictEqual({
        countryCode: "NL",
        currencyCode: "EUR",
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["VISA"],
        total: {
          label: "TEST",
          amount: "10.00",
        },
      });
      expect(ApplePaySessionMock.capturedMerchantSession).toStrictEqual({
        id: "sessionId",
      });
      expect(ApplePaySessionMock.capturedPaymentResult).toBe(ApplePaySessionMock.STATUS_FAILURE);
      expect(ApplePaySessionMock.aborted).toBe(true);
    });
  });
});
