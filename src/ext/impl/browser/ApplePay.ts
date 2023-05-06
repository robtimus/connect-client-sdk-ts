import { ApplePayClient } from "../..";
import {
  ApplePaySpecificInput,
  MobilePaymentProductSession302SpecificInput,
  MobilePaymentProductSession302SpecificOutput,
  PaymentContext,
  PaymentProduct302SpecificData,
} from "../../../model";
import { formatAmount } from "../../../util/amounts";

class ApplePayClientImpl implements ApplePayClient {
  constructor(
    private readonly applePaySpecificInput: ApplePaySpecificInput,
    private readonly applePaySpecificData: PaymentProduct302SpecificData,
    private readonly context: PaymentContext
  ) {}

  async createPayment(
    sessionFactory: (input: MobilePaymentProductSession302SpecificInput) => Promise<MobilePaymentProductSession302SpecificOutput>
  ): Promise<ApplePayJS.ApplePayPaymentToken> {
    const paymentRequest: ApplePayJS.ApplePayPaymentRequest = {
      currencyCode: this.context.amountOfMoney.currencyCode,
      countryCode: this.applePaySpecificInput.acquirerCountry || this.context.countryCode,
      total: {
        label: this.applePaySpecificInput.lineItem || this.applePaySpecificInput.merchantName,
        amount: formatAmount(this.context.amountOfMoney.amount),
      },
      supportedNetworks: this.applePaySpecificData.networks,
      merchantCapabilities: ["supports3DS"],
    };

    let version = 14;
    while (version > 0 && !ApplePaySession.supportsVersion(version)) {
      version--;
    }
    if (version === 0) {
      throw new Error("No supported ApplePay JS API version found");
    }

    return new Promise((resolve, reject) => {
      const applePaySession = new ApplePaySession(version, paymentRequest);
      applePaySession.onvalidatemerchant = (event) => {
        const input: MobilePaymentProductSession302SpecificInput = {
          displayName: this.applePaySpecificInput.merchantName,
          validationUrl: event.validationURL,
          domainName: window.location.hostname,
        };
        sessionFactory(input)
          .then((applePaySpecificOutput) => {
            applePaySession.completeMerchantValidation(JSON.parse(applePaySpecificOutput.sessionObject));
          })
          .catch((reason) => {
            applePaySession.abort();
            reject(reason);
          });
      };
      applePaySession.onpaymentauthorized = (event) => {
        if (event.payment.token) {
          applePaySession.completePayment(ApplePaySession.STATUS_SUCCESS);
          resolve(event.payment.token);
        } else {
          applePaySession.completePayment(ApplePaySession.STATUS_FAILURE);
          reject("Error authorizing payment");
        }
      };
      applePaySession.begin();
    });
  }
}

Object.freeze(ApplePayClientImpl.prototype);

export function newApplePayClient(
  applePaySpecificInput: ApplePaySpecificInput,
  applePaySpecificData: PaymentProduct302SpecificData,
  context: PaymentContext
): ApplePayClient | undefined {
  if (typeof ApplePaySession !== "undefined" && ApplePaySession.canMakePayments()) {
    return new ApplePayClientImpl(applePaySpecificInput, applePaySpecificData, context);
  }
  return undefined;
}
