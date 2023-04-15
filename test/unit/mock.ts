import { v4 as uuidv4 } from "uuid";
import {
  ApplePayClient,
  Device,
  DeviceInformation,
  GooglePayClient,
  MobilePaymentProductSession302SpecificInput,
  MobilePaymentProductSession302SpecificOutput,
} from "../../src/model";
import { HttpClient, HttpRequest, HttpResponse } from "../../src/http";
import { URLBuilder } from "../../src/http/util";
import { JOSEEncryptor } from "../../src/crypto";

export interface CapturedHttpRequest {
  readonly method: string;
  readonly url: string;
  readonly params: Record<string, string | number | boolean | string[] | number[] | boolean[] | undefined>;
  readonly headers: Record<string, string | undefined>;
  readonly body?: object;
}

export type RequestValidator = (request: CapturedHttpRequest) => void;

export function notImplementedResponse(): HttpResponse {
  return {
    statusCode: 501,
    contentType: "text/plain",
    body: "Not Implemented",
  };
}

export function cloneResponse(response: HttpResponse) {
  const result: HttpResponse = {
    statusCode: response.statusCode,
    contentType: response.contentType,
  };
  if (response.body) {
    result.body = JSON.parse(JSON.stringify(response.body));
  }
  return result;
}

interface RequestHandler {
  readonly url: string | RegExp;
  readonly response: HttpResponse;
  readonly requestValidator?: RequestValidator;
}

class RequestMatcher {
  readonly handlers: RequestHandler[] = [];

  findHandler(url: string): RequestHandler | undefined {
    return this.handlers.find((handler) => {
      if (typeof handler.url === "string") {
        return url.startsWith(handler.url);
      }
      return handler.url.test(url);
    });
  }
}

class MockHttpRequest implements HttpRequest {
  private readonly urlBuilder: URLBuilder;
  private readonly params: Record<string, string | number | boolean | string[] | number[] | boolean[] | undefined> = {};
  private readonly headers: Record<string, string | undefined> = {};

  constructor(private readonly method: string, url: string, private readonly matcher: RequestMatcher, private readonly client: MockHttpClient, private readonly body?: object) {
    this.urlBuilder = new URLBuilder(url);
  }

  queryParam(name: string, value?: string | number | boolean | undefined): HttpRequest {
    this.urlBuilder.queryParam(name, value);
    if (value !== undefined) {
      this.params[name] = value;
    }
    return this;
  }

  queryParams(name: string, values?: string[] | number[] | boolean[] | undefined): HttpRequest {
    this.urlBuilder.queryParams(name, values);
    if (values !== undefined) {
      this.params[name] = values;
    }
    return this;
  }

  header(name: string, value: string): HttpRequest {
    this.headers[name] = value;
    return this;
  }

  send(): Promise<HttpResponse> {
    const url = this.urlBuilder.build();
    const request = {
      method: this.method,
      url,
      params: this.params,
      headers: this.headers,
      body: this.body,
    };
    this.client.requests.push(request);

    const handler = this.matcher.findHandler(url);
    if (handler) {
      if (handler.requestValidator) {
        handler.requestValidator(request);
      }
      return Promise.resolve(cloneResponse(handler.response));
    }
    return Promise.resolve(notImplementedResponse());
  }
}

class MockHttpClient implements HttpClient {
  readonly matchers: Record<string, RequestMatcher | undefined> = {};
  readonly requests: CapturedHttpRequest[] = [];

  get(url: string): HttpRequest {
    const matcher = this.matchers["GET"] || new RequestMatcher();
    return new MockHttpRequest("GET", url, matcher, this);
  }

  delete(url: string): HttpRequest {
    const matcher = this.matchers["DELETE"] || new RequestMatcher();
    return new MockHttpRequest("DELETE", url, matcher, this);
  }

  post(url: string, body?: object): HttpRequest {
    const matcher = this.matchers["POST"] || new RequestMatcher();
    return new MockHttpRequest("POST", url, matcher, this, body);
  }

  put(url: string, body?: object): HttpRequest {
    const matcher = this.matchers["PUT"] || new RequestMatcher();
    return new MockHttpRequest("PUT", url, matcher, this, body);
  }
}

class MockApplePayClient implements ApplePayClient {
  async createPayment(
    sessionFactory: (input: MobilePaymentProductSession302SpecificInput) => Promise<MobilePaymentProductSession302SpecificOutput>
  ): Promise<ApplePayJS.ApplePayPaymentToken> {
    return sessionFactory({}).then((output) => ({
      paymentData: output.sessionObject,
      paymentMethod: {
        displayName: "VISA",
        network: "1",
        paymentPass: {
          activationState: "activated",
          primaryAccountIdentifier: "PAI",
          primaryAccountNumberSuffix: "PANS",
          deviceAccountIdentifier: "DAI",
        },
        type: "credit",
      },
      transactionIdentifier: "TI",
    }));
  }
}

class MockGooglePayClient implements GooglePayClient {
  prefetchPaymentData(): Promise<void> {
    return Promise.resolve();
  }

  createPayment(): Promise<google.payments.api.PaymentData> {
    return Promise.resolve({
      apiVersion: 2,
      apiVersionMinor: 0,
      paymentMethodData: {
        tokenizationData: {
          token: "token",
          type: "PAYMENT_GATEWAY",
        },
        type: "CARD",
      },
    });
  }
}

export class MockDevice implements Device {
  private readonly id = uuidv4();
  private readonly httpClient = new MockHttpClient();
  private joseEncryptor?: JOSEEncryptor;
  private applePayClient: Promise<ApplePayClient | undefined> = Promise.resolve(undefined);
  private googlePayClient: Promise<GooglePayClient | undefined> = Promise.resolve(undefined);

  getPlatformIdentifier(): string {
    return "MockDevice";
  }

  getDeviceInformation(): DeviceInformation {
    return {
      timezoneOffsetUtcMinutes: 0,
      locale: "en-GB",
      javaEnabled: false,
      colorDepth: 32,
      screenHeight: 1200,
      screenWidth: 1920,
      innerHeight: 1200,
      innerWidth: 1920,
    };
  }

  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  getJOSEEncryptor(): JOSEEncryptor | undefined {
    return this.joseEncryptor;
  }

  getApplePayClient(): Promise<ApplePayClient | undefined> {
    return this.applePayClient;
  }
  getGooglePayClient(): Promise<GooglePayClient | undefined> {
    return this.googlePayClient;
  }

  mockGet(url: string | RegExp, response: HttpResponse, requestValidator?: RequestValidator): MockDevice {
    return this.mockMethod("GET", url, response, requestValidator);
  }

  mockDelete(url: string | RegExp, response: HttpResponse, requestValidator?: RequestValidator): MockDevice {
    return this.mockMethod("DELETE", url, response, requestValidator);
  }

  mockPost(url: string | RegExp, response: HttpResponse, requestValidator?: RequestValidator): MockDevice {
    return this.mockMethod("POST", url, response, requestValidator);
  }

  mockPut(url: string | RegExp, response: HttpResponse, requestValidator?: RequestValidator): MockDevice {
    return this.mockMethod("PUT", url, response, requestValidator);
  }

  private mockMethod(method: string, url: string | RegExp, response: HttpResponse, requestValidator?: RequestValidator): MockDevice {
    const matcher = this.httpClient.matchers[method] || new RequestMatcher();
    this.httpClient.matchers[method] = matcher;
    matcher.handlers.push({
      url,
      response,
      requestValidator,
    });
    return this;
  }

  mockJOSEEncryptor(joseEncryptor?: JOSEEncryptor): MockDevice {
    this.joseEncryptor = joseEncryptor;
    return this;
  }

  mockApplePayClient(applePayClient?: true | "throw" | ApplePayClient): MockDevice {
    if (applePayClient === true) {
      this.applePayClient = Promise.resolve(new MockApplePayClient());
    } else if (applePayClient === "throw") {
      this.applePayClient = Promise.reject("cannot provide Apple Pay client");
    } else {
      this.applePayClient = Promise.resolve(applePayClient);
    }
    return this;
  }

  mockGooglePayClient(googlePayClient?: true | "throw" | GooglePayClient): MockDevice {
    if (googlePayClient === true) {
      this.googlePayClient = Promise.resolve(new MockGooglePayClient());
    } else if (googlePayClient === "throw") {
      this.googlePayClient = Promise.reject("cannot provide Google Pay client");
    } else {
      this.googlePayClient = Promise.resolve(googlePayClient);
    }
    return this;
  }

  capturedRequests(): CapturedHttpRequest[] {
    return this.httpClient.requests;
  }

  toString() {
    return `MockDevice[${this.id}]`;
  }
}
