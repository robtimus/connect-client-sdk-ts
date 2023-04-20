import { JOSEEncryptor } from "../crypto";
import { subtleCryptoEncryptor } from "../crypto/SubtleCrypto";
import { HttpClient } from "../http";
import { fetchHttpClient } from "../http/fetch";
import {
  ApplePayClient,
  ApplePaySpecificInput,
  Device,
  DeviceInformation,
  GooglePayClient,
  GooglePaySpecificInput,
  PaymentContext,
  PaymentProduct302SpecificData,
  PaymentProduct320SpecificData,
} from "../model";
import { newApplePayClient } from "./ApplePay";
import { newGooglePayClient } from "./GooglePay";
import { xhrHttpClient } from "./xhr";

export interface BrowserOptions {
  readonly httpClient?: HttpClient;
  readonly joseEncryptor?: JOSEEncryptor;
}

export class Browser implements Device {
  private readonly httpClient: HttpClient;
  private readonly joseEncryptor?: JOSEEncryptor;

  constructor(options: BrowserOptions = {}) {
    if (options.httpClient) {
      this.httpClient = options.httpClient;
    } else if (typeof fetch !== "undefined") {
      this.httpClient = fetchHttpClient;
    } else {
      this.httpClient = xhrHttpClient();
    }

    if (options.joseEncryptor) {
      this.joseEncryptor = options.joseEncryptor;
    } else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues !== "undefined" && typeof crypto.subtle !== "undefined") {
      this.joseEncryptor = subtleCryptoEncryptor;
    }
  }

  getPlatformIdentifier(): string {
    return window.navigator.userAgent;
  }

  getDeviceInformation(): DeviceInformation {
    return {
      timezoneOffsetUtcMinutes: new Date().getTimezoneOffset(),
      locale: window.navigator.language,
      javaEnabled: window.navigator.javaEnabled(),
      colorDepth: screen.colorDepth,
      screenHeight: screen.height,
      screenWidth: screen.width,
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
    };
  }

  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  getJOSEEncryptor(): JOSEEncryptor | undefined {
    return this.joseEncryptor;
  }

  getApplePayClient(
    applePaySpecificInput: ApplePaySpecificInput,
    applePaySpecificData: PaymentProduct302SpecificData,
    context: PaymentContext
  ): Promise<ApplePayClient | undefined> {
    return Promise.resolve(newApplePayClient(applePaySpecificInput, applePaySpecificData, context));
  }

  getGooglePayClient(
    googlePaySpecificInput: GooglePaySpecificInput,
    googlePaySpecificData: PaymentProduct320SpecificData,
    context: PaymentContext
  ): Promise<GooglePayClient | undefined> {
    return Promise.resolve(newGooglePayClient(googlePaySpecificInput, googlePaySpecificData, context));
  }
}

Object.freeze(Browser.prototype);
