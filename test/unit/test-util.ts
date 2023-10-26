import { SemVer } from "semver";
import { ApplePayClient, Device, DeviceInformation, GooglePayClient } from "../../src/ext";
import { HttpClient, HttpRequest, HttpResponse } from "../../src/ext/http";
import { URLBuilder } from "../../src/ext/http/util";

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
  readonly url: string;
  readonly response: HttpResponse;
  readonly requestValidator?: RequestValidator;
}

class RequestMatcher {
  readonly handlers: RequestHandler[] = [];

  findHandler(url: string): RequestHandler | undefined {
    return this.handlers.find((handler) => url.startsWith(handler.url));
  }
}

class MockHttpRequest implements HttpRequest {
  readonly #client: MockHttpClient;
  readonly #matcher: RequestMatcher;
  readonly #method: string;
  readonly #urlBuilder: URLBuilder;
  readonly #params: Record<string, string | number | boolean | string[] | number[] | boolean[] | undefined> = {};
  readonly #headers: Record<string, string | undefined> = {};
  readonly #body?: object;

  constructor(client: MockHttpClient, matcher: RequestMatcher, method: string, url: string, body?: object) {
    this.#client = client;
    this.#matcher = matcher;
    this.#method = method;
    this.#urlBuilder = new URLBuilder(url);
    this.#body = body;
  }

  queryParam(name: string, value?: string | number | boolean | undefined): HttpRequest {
    this.#urlBuilder.queryParam(name, value);
    if (value !== undefined) {
      this.#params[name] = value;
    }
    return this;
  }

  queryParams(name: string, values?: string[] | number[] | boolean[] | undefined): HttpRequest {
    this.#urlBuilder.queryParams(name, values);
    if (values !== undefined) {
      this.#params[name] = values;
    }
    return this;
  }

  header(name: string, value: string): HttpRequest {
    this.#headers[name] = value;
    return this;
  }

  send(): Promise<HttpResponse> {
    const url = this.#urlBuilder.build();
    const request = {
      method: this.#method,
      url,
      params: this.#params,
      headers: this.#headers,
      body: this.#body,
    };
    this.#client.requests.push(request);

    const handler = this.#matcher.findHandler(url);
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
    return new MockHttpRequest(this, matcher, "GET", url);
  }

  delete(url: string): HttpRequest {
    const matcher = this.matchers["DELETE"] || new RequestMatcher();
    return new MockHttpRequest(this, matcher, "DELETE", url);
  }

  post(url: string, body?: object): HttpRequest {
    const matcher = this.matchers["POST"] || new RequestMatcher();
    return new MockHttpRequest(this, matcher, "POST", url, body);
  }

  put(url: string, body?: object): HttpRequest {
    const matcher = this.matchers["PUT"] || new RequestMatcher();
    return new MockHttpRequest(this, matcher, "PUT", url, body);
  }
}

export class MockDevice implements Device {
  readonly #httpClient = new MockHttpClient();
  #applePayClient: Promise<ApplePayClient | undefined> = Promise.resolve(undefined);
  #googlePayClient: Promise<GooglePayClient | undefined> = Promise.resolve(undefined);

  getDeviceInformation(): DeviceInformation {
    return {
      platformIdentifier: "MockDevice",
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
    return this.#httpClient;
  }

  getApplePayClient(): Promise<ApplePayClient | undefined> {
    return this.#applePayClient;
  }
  getGooglePayClient(): Promise<GooglePayClient | undefined> {
    return this.#googlePayClient;
  }

  mockGet(url: string, response: HttpResponse, requestValidator?: RequestValidator): MockDevice {
    return this.mockMethod("GET", url, response, requestValidator);
  }

  mockPost(url: string, response: HttpResponse, requestValidator?: RequestValidator): MockDevice {
    return this.mockMethod("POST", url, response, requestValidator);
  }

  private mockMethod(method: string, url: string, response: HttpResponse, requestValidator?: RequestValidator): this {
    const matcher = this.#httpClient.matchers[method] || new RequestMatcher();
    this.#httpClient.matchers[method] = matcher;
    matcher.handlers.push({
      url,
      response,
      requestValidator,
    });
    return this;
  }

  mockApplePayClient(applePayClient?: true | "throw" | ApplePayClient): this {
    if (applePayClient === true) {
      this.#applePayClient = Promise.resolve({
        createPayment: jest.fn(),
      });
    } else if (applePayClient === "throw") {
      this.#applePayClient = Promise.reject("cannot provide Apple Pay client");
    } else {
      this.#applePayClient = Promise.resolve(applePayClient);
    }
    return this;
  }

  mockGooglePayClient(googlePayClient?: true | "throw" | GooglePayClient): this {
    if (googlePayClient === true) {
      this.#googlePayClient = Promise.resolve({
        createButton: jest.fn(),
        prefetchPaymentData: jest.fn(),
        createPayment: jest.fn(),
      });
    } else if (googlePayClient === "throw") {
      this.#googlePayClient = Promise.reject("cannot provide Google Pay client");
    } else {
      this.#googlePayClient = Promise.resolve(googlePayClient);
    }
    return this;
  }

  capturedRequests(): CapturedHttpRequest[] {
    return this.#httpClient.requests;
  }
}

export class Mocks {
  readonly #object: object;
  readonly #oldValues: Record<string, unknown> = {};

  private constructor(o: object) {
    this.#object = o;
  }

  mock(name: string, value: unknown): this {
    const oldValue = this.#object[name];
    Object.defineProperty(this.#object, name, {
      value,
      configurable: true,
    });
    this.#oldValues[name] = oldValue;
    return this;
  }

  mockIfNecessary(name: string, value: unknown): this {
    const oldValue = this.#object[name];
    if (oldValue === undefined) {
      this.mock(name, value);
    }
    return this;
  }

  restore(): void {
    const names = Object.keys(this.#oldValues);
    for (const name of names) {
      const oldValue = this.#oldValues[name];
      if (oldValue === undefined) {
        delete this.#object[name];
      } else {
        Object.defineProperty(this.#object, name, {
          value: oldValue,
        });
      }
      delete this.#oldValues[name];
    }
  }

  static global(): Mocks {
    return new Mocks(globalThis);
  }

  static for(o: object): Mocks {
    return new Mocks(o);
  }
}

export function isMinNode(major: number, minor = 0): boolean {
  const currentVersion = new SemVer(process.versions.node);
  return currentVersion.major > major || (currentVersion.major === major && currentVersion.minor >= minor);
}

export interface VersionedNodeJest {
  describe: jest.Describe;
  test: jest.It;
}

export function minNode(major: number, minor = 0): VersionedNodeJest {
  const condition = isMinNode(major, minor);
  return {
    describe: describeWhen(condition),
    test: testWhen(condition),
  };
}

export function isMaxNode(major: number, minor = 999): boolean {
  const currentVersion = new SemVer(process.versions.node);
  return currentVersion.major < major || (currentVersion.major === major && currentVersion.minor <= minor);
}

export function maxNode(major: number, minor = 999): VersionedNodeJest {
  const condition = isMaxNode(major, minor);
  return {
    describe: describeWhen(condition),
    test: testWhen(condition),
  };
}

export function describeWhen(condition: boolean): jest.Describe {
  return condition ? describe : describe.skip;
}

export function testWhen(condition: boolean): jest.It {
  return condition ? test : test.skip;
}
