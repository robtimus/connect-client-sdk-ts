/**
 * Contains interfaces that allow developers to extend the SDK.
 * @module
 */

import {
  ApplePaySpecificInput,
  GooglePaySpecificInput,
  MobilePaymentProductSession302SpecificInput,
  MobilePaymentProductSession302SpecificOutput,
  PaymentContext,
  PaymentProduct302SpecificData,
  PaymentProduct320SpecificData,
} from "../model";
import { HttpClient } from "./http";

/**
 * An interface describing the current device. This could be a browser or a native device.
 */
export interface Device {
  /**
   * @returns The necessary information about the device.
   */
  getDeviceInformation(): DeviceInformation;
  /**
   * @returns A device specific HTTP client.
   */
  getHttpClient(): HttpClient;
  /**
   * @param applePaySpecificInput Input needed to work with Apple Pay.
   * @param applePaySpecificData Apple Pay specific data, as retrieved by the Worldline Connect Client API.
   * @param context The current payment context.
   * @returns A promise that contains an Apple Pay client for the given parameters, if available.
   */
  getApplePayClient(
    applePaySpecificInput: ApplePaySpecificInput,
    applePaySpecificData: PaymentProduct302SpecificData,
    context: PaymentContext
  ): Promise<ApplePayClient | undefined>;
  /**
   * @param googlePaySpecificInput Input needed to work with Google Pay.
   * @param googlePaySpecificData Google Pay specific data, as retrieved by the Worldline Connect Client API.
   * @param context The current payment context.
   * @returns A promise that contains an Google Pay client for the given parameters, if available.
   */
  getGooglePayClient(
    googlePaySpecificInput: GooglePaySpecificInput,
    googlePaySpecificData: PaymentProduct320SpecificData,
    context: PaymentContext
  ): Promise<GooglePayClient | undefined>;
}

/**
 * Object containing information on the device.
 */
export interface DeviceInformation {
  /**
   * A string representing the platform and/or device.
   */
  readonly platformIdentifier: string;
  /**
   * The device's timezone offset from UTC, in minutes.
   */
  readonly timezoneOffsetUtcMinutes: number;
  /**
   * The device's current locale, e.g. "en" or "en-GB".
   */
  readonly locale: string;
  /**
   * Whether or not Java is enabled on the device.
   */
  readonly javaEnabled: boolean;
  /**
   * The color depth in bits.
   */
  readonly colorDepth: number;
  /**
   * The height of the screen, in pixels.
   */
  readonly screenHeight: number;
  /**
   * The width of the screen, in pixels.
   */
  readonly screenWidth: number;
  /**
   * The inner height of the application or website, in pixels.
   */
  readonly innerHeight: number;
  /**
   * The inner width of the application or website, in pixels.
   */
  readonly innerWidth: number;
}

/**
 * An Apple Pay specific client.
 */
export interface ApplePayClient {
  /**
   * Initiates an Apple Pay payment.\
   * Implementations should construct the input to the session factory,
   * and parse the created Apple Pay merchant session to JSON to provide it to the completeMerchantValidation call.
   * @param sessionFactory A function that can create an Apple Pay merchant session.
   * @return A promise that contains the payment result.
   */
  createPayment(
    sessionFactory: (input: MobilePaymentProductSession302SpecificInput) => Promise<MobilePaymentProductSession302SpecificOutput>
  ): Promise<ApplePayJS.ApplePayPaymentToken>;
}

/**
 * Available options for creating Google Pay buttons.
 */
export type GooglePayButtonOptions = Omit<google.payments.api.ButtonOptions, "allowedPaymentMethods">;

/**
 * A Google Pay specific client.
 */
export interface GooglePayClient {
  /**
   * Generates a Google Pay payment button styled with the latest Google Pay branding for insertion into a webpage.
   * @param options Options for the Google Pay payment button. The allowed payment methods should be automatically set by the client.
   * @returns The generated payment button.
   */
  createButton(options: GooglePayButtonOptions): HTMLElement;
  /**
   * Prefetches configuration to improve {@link createPayment} execution time on later user interaction.
   * @returns A promise that contains no value.
   */
  prefetchPaymentData(): Promise<void>;
  /**
   * Initiates a Google Pay payment.
   * @return A promise that contains the payment result.
   */
  createPayment(): Promise<google.payments.api.PaymentData>;
}
