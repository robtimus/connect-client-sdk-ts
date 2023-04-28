import { GooglePayButtonOptions, GooglePayClient } from "../..";
import { GooglePaySpecificInput, PaymentContext, PaymentProduct320SpecificData } from "../../../model";

function getPaymentsClient(
  googlePaySpecificInput: GooglePaySpecificInput,
  googlePaySpecificData: PaymentProduct320SpecificData
): google.payments.api.PaymentsClient | undefined {
  if (googlePaySpecificData.networks.length === 0) {
    console.warn("No Google Pay networks available");
    return undefined;
  }
  if (typeof google === "undefined") {
    console.warn("The Google Pay API script was not loaded. See https://developers.google.com/pay/api/web/guides/tutorial#js-load");
    return undefined;
  }
  return new google.payments.api.PaymentsClient({ environment: googlePaySpecificInput.environment });
}

const API_VERSION = 2;
const API_VERSION_MINOR = 0;

function formatAmount(amount: number): string {
  const output = "00" + amount;
  return output.slice(0, output.length - 2) + "." + output.slice(output.length - 2);
}

function constructCardParameters(data: PaymentProduct320SpecificData): google.payments.api.CardParameters {
  return {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: data.networks as google.payments.api.CardNetwork[],
  };
}

function constructTokenizationSpecification(
  input: GooglePaySpecificInput,
  data: PaymentProduct320SpecificData
): google.payments.api.PaymentMethodTokenizationSpecification {
  return {
    type: "PAYMENT_GATEWAY",
    parameters: {
      gateway: data.gateway,
      gatewayMerchantId: input.gatewayMerchantId,
    },
  };
}

function constructAllowedPaymentMethods(data: PaymentProduct320SpecificData): google.payments.api.IsReadyToPayPaymentMethodSpecification[] {
  return [
    {
      type: "CARD",
      parameters: constructCardParameters(data),
    },
  ];
}

function constructIsReadyToPayRequest(data: PaymentProduct320SpecificData): google.payments.api.IsReadyToPayRequest {
  return {
    apiVersion: API_VERSION,
    apiVersionMinor: API_VERSION_MINOR,
    allowedPaymentMethods: constructAllowedPaymentMethods(data),
  };
}

function constructPrefetchPaymentDataRequest(
  input: GooglePaySpecificInput,
  data: PaymentProduct320SpecificData,
  context: PaymentContext
): google.payments.api.PaymentDataRequest | undefined {
  if (input.gatewayMerchantId) {
    // The cast is necessary because the TypeScript definition incorrectly makes totalPrice required
    const transactionInfo = {
      totalPriceStatus: "NOT_CURRENTLY_KNOWN",
      currencyCode: context.amountOfMoney.currencyCode,
    } as google.payments.api.TransactionInfo;

    return {
      apiVersion: API_VERSION,
      apiVersionMinor: API_VERSION_MINOR,
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: constructCardParameters(data),
          tokenizationSpecification: constructTokenizationSpecification(input, data),
        },
      ],
      transactionInfo,
      merchantInfo: {
        merchantId: input.merchantId,
        merchantName: input.merchantName,
      },
    };
  }
  return undefined;
}

function constructPaymentDataRequest(
  input: GooglePaySpecificInput,
  data: PaymentProduct320SpecificData,
  context: PaymentContext
): google.payments.api.PaymentDataRequest {
  return {
    apiVersion: API_VERSION,
    apiVersionMinor: API_VERSION_MINOR,
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: constructCardParameters(data),
        tokenizationSpecification: constructTokenizationSpecification(input, data),
      },
    ],
    transactionInfo: {
      totalPriceStatus: "FINAL",
      totalPrice: formatAmount(context.amountOfMoney.amount),
      countryCode: input.acquirerCountry || context.countryCode,
      currencyCode: context.amountOfMoney.currencyCode,
    },
    merchantInfo: {
      merchantId: input.merchantId,
      merchantName: input.merchantName,
    },
  };
}

class GooglePayClientImpl implements GooglePayClient {
  constructor(
    private readonly client: google.payments.api.PaymentsClient,
    private readonly googlePaySpecificInput: GooglePaySpecificInput,
    private readonly googlePaySpecificData: PaymentProduct320SpecificData,
    private readonly context: PaymentContext
  ) {}

  createButton(options: GooglePayButtonOptions): HTMLElement {
    const buttonOptions: google.payments.api.ButtonOptions = Object.assign({}, options);
    buttonOptions.allowedPaymentMethods = constructAllowedPaymentMethods(this.googlePaySpecificData);
    return this.client.createButton(options);
  }

  async prefetchPaymentData(): Promise<void> {
    const request = constructPrefetchPaymentDataRequest(this.googlePaySpecificInput, this.googlePaySpecificData, this.context);
    if (request) {
      this.client.prefetchPaymentData(request);
    }
    console.warn(
      `Prefetch Google payment data not triggered due to missing information. gatewayMerchantId: ${this.googlePaySpecificInput.gatewayMerchantId}`
    );
  }

  async createPayment(): Promise<google.payments.api.PaymentData> {
    return this.client.loadPaymentData(constructPaymentDataRequest(this.googlePaySpecificInput, this.googlePaySpecificData, this.context));
  }
}

Object.freeze(GooglePayClientImpl.prototype);

export async function newGooglePayClient(
  googlePaySpecificInput: GooglePaySpecificInput,
  googlePaySpecificData: PaymentProduct320SpecificData,
  context: PaymentContext
): Promise<GooglePayClient | undefined> {
  const client = getPaymentsClient(googlePaySpecificInput, googlePaySpecificData);
  if (!client) {
    return undefined;
  }
  const response = await client.isReadyToPay(constructIsReadyToPayRequest(googlePaySpecificData));
  if (response.result) {
    return new GooglePayClientImpl(client, googlePaySpecificInput, googlePaySpecificData, context);
  }
  return undefined;
}
