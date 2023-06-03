import * as connectSdk from "promiseful-connect-sdk";
import { CreatePaymentRequest } from "connect-sdk-nodejs/lib/model/domain/payment";
import { SessionResponse } from "connect-sdk-nodejs/lib/model/domain/sessions";
import { SessionDetails } from "../src/model";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("./config.json");

connectSdk.init({
  host: config.apiEndpoint.host,
  scheme: config.apiEndpoint.scheme,
  port: config.apiEndpoint.port,
  enableLogging: config.enableLogging,
  apiKeyId: config.apiKeyId,
  secretApiKey: config.secretApiKey,
  integrator: config.integrator,
});

export const sessionResponse = connectSdk.sessions.create(config.merchantId, {});

type NoNulls<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export async function getSessionDetails(): Promise<SessionDetails> {
  return (await sessionResponse) as NoNulls<Required<SessionResponse>>;
}

export function createPayment(createPaymentRequest: CreatePaymentRequest) {
  return connectSdk.payments.create(config.merchantId, createPaymentRequest);
}
