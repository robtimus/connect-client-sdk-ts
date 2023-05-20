import { ApplePayClient, ApplePaySpecificData, Device, DeviceInformation, GooglePayClient, GooglePaySpecificData } from "../..";
import { ApplePaySpecificInput, GooglePaySpecificInput, PaymentContext } from "../../../model";
import { HttpClient } from "../../http";
import { fetchHttpClient } from "../http/fetch";
import { xhrHttpClient } from "../http/xhr";
import { newApplePayClient } from "./ApplePay";
import { newGooglePayClient } from "./GooglePay";

class Browser implements Device {
  readonly #httpClient: HttpClient = fetchHttpClient ?? xhrHttpClient;

  getDeviceInformation(): DeviceInformation {
    return {
      platformIdentifier: window.navigator.userAgent,
      timezoneOffsetUtcMinutes: new Date().getTimezoneOffset(),
      locale: window.navigator.language,
      javaEnabled: window.navigator.javaEnabled(),
      colorDepth: window.screen.colorDepth,
      screenHeight: window.screen.height,
      screenWidth: window.screen.width,
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
    };
  }

  getHttpClient(): HttpClient {
    return this.#httpClient;
  }

  getApplePayClient(
    applePaySpecificInput: ApplePaySpecificInput,
    applePaySpecificData: ApplePaySpecificData,
    context: PaymentContext
  ): Promise<ApplePayClient | undefined> {
    return Promise.resolve(newApplePayClient(applePaySpecificInput, applePaySpecificData, context));
  }

  getGooglePayClient(
    googlePaySpecificInput: GooglePaySpecificInput,
    googlePaySpecificData: GooglePaySpecificData,
    context: PaymentContext
  ): Promise<GooglePayClient | undefined> {
    return Promise.resolve(newGooglePayClient(googlePaySpecificInput, googlePaySpecificData, context));
  }
}

Object.freeze(Browser.prototype);

/**
 * A device representing the current web browser.
 * It uses the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API">Fetch API</a> for HTTP requests if available,
 * or <a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest">XMLHttpRequest</a> otherwise.
 * It supports Apple Pay if the browser supports it, and Google Pay if the necessary JavaScript files are loaded.
 */
export const browser: Device = new Browser();
