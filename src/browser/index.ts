import { newApplePayClient } from "../applePay";
import { JOSEEncryptor } from "../crypto";
import { newGooglePayClient } from "../googlePay";
import { HttpClient } from "../http";
import { fetchHttpClient } from "../http/fetch";
import { xhrHttpClient } from "../http/xhr";
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

export interface BrowserOptions {
  joseEncryptor?: JOSEEncryptor;
}

const httpClient: HttpClient = typeof fetch !== "undefined" ? fetchHttpClient : xhrHttpClient;

class Browser implements Device {
  constructor(private readonly joseEncryptor?: JOSEEncryptor) {}

  getPlatformIdentifier(): string {
    return window.navigator.userAgent;
  }

  getDeviceInformation(): DeviceInformation {
    return {
      timezoneOffsetUtcMinutes: new Date().getTimezoneOffset(),
      locale: navigator.language,
      javaEnabled: navigator.javaEnabled(),
      colorDepth: screen.colorDepth,
      screenHeight: screen.height,
      screenWidth: screen.width,
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
    };
  }

  getHttpClient(): HttpClient {
    return httpClient;
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

export function browser(options: BrowserOptions = {}): Device {
  return new Browser(options.joseEncryptor);
}
