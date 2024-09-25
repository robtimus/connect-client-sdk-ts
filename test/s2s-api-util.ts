import { assertSuccess, init } from "connect-sdk-nodejs";
import { CreatePaymentRequest, CreatePaymentResponse, SessionResponse } from "connect-sdk-nodejs/lib/v1/model/domain";
import { AmountOfMoney, SessionDetails } from "../src/model";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("./config.json");

const client = init({
  host: config.apiEndpoint.host,
  scheme: config.apiEndpoint.scheme,
  port: config.apiEndpoint.port,
  enableLogging: config.enableLogging,
  apiKeyId: config.apiKeyId,
  secretApiKey: config.secretApiKey,
  integrator: config.integrator,
});

export const sessionResponse = client.v1.sessions.create(config.merchantId, {}).then((response) => assertSuccess(response).body);

type NoNulls<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export async function getSessionDetails(): Promise<SessionDetails> {
  return (await sessionResponse) as NoNulls<Required<SessionResponse>>;
}

export function createPayment(createPaymentRequest: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  return client.v1.payments.create(config.merchantId, createPaymentRequest).then((response) => assertSuccess(response).body);
}

export function createPaymentWithEncryptedCustomerInput(
  encryptedCustomerInput: string,
  amountOfMoney: AmountOfMoney
): Promise<CreatePaymentResponse> {
  const createPaymentRequest: CreatePaymentRequest = {
    encryptedCustomerInput,
    order: {
      amountOfMoney,
      customer: {
        billingAddress: {
          countryCode: "NL",
        },
      },
    },
  };
  return createPayment(createPaymentRequest);
}
