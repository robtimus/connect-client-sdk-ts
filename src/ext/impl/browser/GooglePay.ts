import { GooglePayButtonOptions, GooglePayClient, GooglePaySpecificData } from "../..";
import { GooglePaySpecificInput, PaymentContext } from "../../../model";
import { formatAmount } from "../../../util/amounts";

function getPaymentsClient(
  googlePaySpecificInput: GooglePaySpecificInput,
  googlePaySpecificData: GooglePaySpecificData
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

function determineCountryCode(input: GooglePaySpecificInput, data: GooglePaySpecificData, context: PaymentContext): string {
  return data.acquirerCountry ?? input.transactionCountryCode ?? context.countryCode;
}

function constructCardParameters(data: GooglePaySpecificData): google.payments.api.CardParameters {
  return {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: data.networks as google.payments.api.CardNetwork[],
  };
}

function constructTokenizationSpecification(
  input: GooglePaySpecificInput,
  data: GooglePaySpecificData
): google.payments.api.PaymentMethodTokenizationSpecification {
  return {
    type: "PAYMENT_GATEWAY",
    parameters: {
      gateway: data.gateway,
      gatewayMerchantId: input.connectMerchantId,
    },
  };
}

function constructAllowedPaymentMethods(data: GooglePaySpecificData): google.payments.api.IsReadyToPayPaymentMethodSpecification[] {
  return [
    {
      type: "CARD",
      parameters: constructCardParameters(data),
    },
  ];
}

function constructIsReadyToPayRequest(data: GooglePaySpecificData): google.payments.api.IsReadyToPayRequest {
  return {
    apiVersion: API_VERSION,
    apiVersionMinor: API_VERSION_MINOR,
    allowedPaymentMethods: constructAllowedPaymentMethods(data),
  };
}

function constructPrefetchPaymentDataRequest(
  input: GooglePaySpecificInput,
  data: GooglePaySpecificData,
  context: PaymentContext
): google.payments.api.PaymentDataRequest {
  // The cast is necessary because the TypeScript definition incorrectly makes totalPrice required
  const transactionInfo = {
    currencyCode: context.amountOfMoney.currencyCode,
    countryCode: determineCountryCode(input, data, context),
    totalPriceStatus: "NOT_CURRENTLY_KNOWN",
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
      merchantId: input.googlePayMerchantId,
      merchantName: input.merchantName,
    },
  };
}

function constructPaymentDataRequest(
  input: GooglePaySpecificInput,
  data: GooglePaySpecificData,
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
      currencyCode: context.amountOfMoney.currencyCode,
      countryCode: determineCountryCode(input, data, context),
      totalPrice: formatAmount(context.amountOfMoney.amount),
      totalPriceStatus: "FINAL",
    },
    merchantInfo: {
      merchantId: input.googlePayMerchantId,
      merchantName: input.merchantName,
    },
  };
}

class GooglePayClientImpl implements GooglePayClient {
  readonly #client: google.payments.api.PaymentsClient;
  readonly #googlePaySpecificInput: GooglePaySpecificInput;
  readonly #googlePaySpecificData: GooglePaySpecificData;
  readonly #context: PaymentContext;

  constructor(
    client: google.payments.api.PaymentsClient,
    googlePaySpecificInput: GooglePaySpecificInput,
    googlePaySpecificData: GooglePaySpecificData,
    context: PaymentContext
  ) {
    this.#client = client;
    this.#googlePaySpecificInput = googlePaySpecificInput;
    this.#googlePaySpecificData = googlePaySpecificData;
    this.#context = context;
  }

  createButton(options: GooglePayButtonOptions): HTMLElement {
    const buttonOptions: google.payments.api.ButtonOptions = { ...options };
    buttonOptions.allowedPaymentMethods = constructAllowedPaymentMethods(this.#googlePaySpecificData);
    return this.#client.createButton(buttonOptions);
  }

  async prefetchPaymentData(): Promise<void> {
    const request = constructPrefetchPaymentDataRequest(this.#googlePaySpecificInput, this.#googlePaySpecificData, this.#context);
    this.#client.prefetchPaymentData(request);
  }

  async createPayment(): Promise<google.payments.api.PaymentData> {
    return this.#client.loadPaymentData(constructPaymentDataRequest(this.#googlePaySpecificInput, this.#googlePaySpecificData, this.#context));
  }
}

Object.freeze(GooglePayClientImpl.prototype);

export async function newGooglePayClient(
  googlePaySpecificInput: GooglePaySpecificInput,
  googlePaySpecificData: GooglePaySpecificData,
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
