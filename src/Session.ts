import { Communicator } from "./communicator";
import * as api from "./communicator/model";
import { ApplePayClient, ApplePaySpecificData, Device, GooglePayButtonOptions, GooglePayClient, GooglePaySpecificData } from "./ext";
import { CryptoEngine } from "./ext/crypto";
import { HttpResponse } from "./ext/http";
import { browser } from "./ext/impl/browser";
import { webCryptoCryptoEngine } from "./ext/impl/crypto/WebCrypto";
import {
  BasicPaymentItems,
  BasicPaymentProduct,
  BasicPaymentProductGroups,
  BasicPaymentProducts,
  ConvertAmountRequest,
  ConvertAmountResult,
  CustomerDetailsRequest,
  CustomerDetailsResult,
  DeviceFingerprintRequest,
  DeviceFingerprintResult,
  Directory,
  Encryptor,
  GetInstallmentRequest,
  IINDetailsResult,
  IINDetailsSuccessStatus,
  InstallmentOptionsResponse,
  KeyValuePair,
  MobilePaymentProductSession302SpecificInput,
  MobilePaymentProductSession302SpecificOutput,
  PaymentContext,
  PaymentItem,
  PaymentProduct,
  PaymentProduct302SpecificData,
  PaymentProduct320SpecificData,
  PaymentProductDisplayHints,
  PaymentProductGroup,
  PaymentProductNetworks,
  PrivacyPolicyResult,
  PublicKey,
  SessionDetails,
  ThirdPartyStatus,
} from "./model";
import { newEncryptor } from "./model/impl/Encryptor";
import { toInstallmentOptionsResponse } from "./model/impl/InstallmentOptionsResponse";
import { toBasicPaymentItems } from "./model/impl/PaymentItem";
import { PP_APPLE_PAY, PP_BANCONTACT, PP_GOOGLE_PAY, toBasicPaymentProducts, toPaymentProduct } from "./model/impl/PaymentProduct";
import { toPaymentProductDisplayHints } from "./model/impl/PaymentProductDisplayHints";
import { toBasicPaymentProductGroups, toPaymentProductGroup } from "./model/impl/PaymentProductGroup";

function constructCacheKey(base: string, ...params: unknown[]): string {
  return base + ":" + params.map((value) => `<${value}>`).join(";");
}

function constructCacheKeyWithValues(base: string, params: unknown[], values: KeyValuePair[]): string {
  return base + ":" + params.map((value) => `<${value}`).join(";") + "values:" + values.map((value) => `${value.key}=${value.value}`).join(";");
}

const UNDEFINED_VALUE = "<undefined>";

async function getValue<T>(cache: Record<string, unknown>, key: string, valueSupplier: () => Promise<T>): Promise<T> {
  const existing = cache[key];
  if (existing) {
    return (existing !== UNDEFINED_VALUE ? existing : undefined) as T;
  }
  const value = await valueSupplier();
  cache[key] = value ?? UNDEFINED_VALUE;
  return value;
}

function getCurrentValue<T>(cache: Record<string, unknown>, key: string): T | undefined {
  const existing = cache[key];
  if (existing) {
    return (existing !== UNDEFINED_VALUE ? existing : undefined) as T;
  }
  return undefined;
}

function clearCache(cache: Record<string, unknown>, filter: (key: string) => boolean): void {
  const keys = Object.keys(cache).filter(filter);
  for (const key of keys) {
    delete cache[key];
  }
}

function productNotFoundError(): HttpResponse {
  return {
    statusCode: 404,
    contentType: "application/json",
    body: {
      errorId: "n/a",
      errors: [
        {
          category: "CONNECT_PLATFORM_ERROR",
          code: "1007",
          httpStatusCode: 404,
          id: "UNKNOWN_PRODUCT_ID",
          propertyName: "productId",
          message: "UNKNOWN_PRODUCT_ID",
        },
      ],
    },
  };
}

interface ApplePayProduct {
  id: number;
  acquirerCountry?: string;
  paymentProduct302SpecificData?: PaymentProduct302SpecificData;
}

function toApplePaySpecificData(applePayProduct: ApplePayProduct): ApplePaySpecificData {
  if (applePayProduct.id !== PP_APPLE_PAY || !applePayProduct.paymentProduct302SpecificData) {
    throw new Error("Not a valid Apple Pay product: " + JSON.stringify(applePayProduct));
  }
  return { ...applePayProduct.paymentProduct302SpecificData, acquirerCountry: applePayProduct.acquirerCountry };
}

/**
 * A helper for working with Apple Pay.
 */
export interface ApplePayHelper {
  /**
   * Initiates an Apple Pay payment.
   * @return A promise that contains the payment result.
   */
  createPayment(): Promise<ApplePayJS.ApplePayPaymentToken>;
}

interface GooglePayProduct {
  id: number;
  acquirerCountry?: string;
  paymentProduct320SpecificData?: PaymentProduct320SpecificData;
}

function toGooglePaySpecificData(googlePayProduct: GooglePayProduct): GooglePaySpecificData {
  if (googlePayProduct.id !== PP_GOOGLE_PAY || !googlePayProduct.paymentProduct320SpecificData) {
    throw new Error("Not a valid Google Pay product: " + JSON.stringify(googlePayProduct));
  }
  return { ...googlePayProduct.paymentProduct320SpecificData, acquirerCountry: googlePayProduct.acquirerCountry };
}

/**
 * A helper for working with Google Pay.
 */
export interface GooglePayHelper {
  /**
   * Generates a Google Pay payment button styled with the latest Google Pay branding for insertion into a webpage.
   * @param options Options for the Google Pay payment button.
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

/**
 * The main entry point for communicating with the Worldline Connect Client API.
 */
export class Session {
  /**
   * The default ctypto engine to use.
   * By default this will be {@link webCryptoCryptoEngine} if available, or undefined otherwise.
   */
  static defaultCryptoEngine?: CryptoEngine = webCryptoCryptoEngine;

  readonly #sessionDetails: SessionDetails;
  #paymentContext: PaymentContext;
  readonly #device: Device;
  readonly #communicator: Communicator;
  readonly #cache: Record<string, unknown> = {};
  #cryptoEngine?: CryptoEngine;
  #providedPaymentItem?: PaymentItem;
  #paymentProductAvailability: Record<number, boolean | undefined> = {};

  /**
   * Creates a new session.\
   * This will use {@link defaultCryptoEngine}. A different crypto one can be provided using {@link setCryptoEngine}.
   * @param #sessionDetails The session details, as returned by an Worldline Connect Server API create session call.
   * @param #paymentContext The context for the current payment.
   * @param #device An object representing the current device. If not given, it is assumed that the current device is a browser.
   */
  constructor(sessionDetails: SessionDetails, paymentContext: PaymentContext, device: Device = browser) {
    this.#sessionDetails = sessionDetails;
    this.#paymentContext = paymentContext;
    this.#device = device;
    this.#communicator = new Communicator(this.#sessionDetails, this.#device);

    this.#cryptoEngine = Session.defaultCryptoEngine;
  }

  /**
   * Returns the current payment context.
   */
  getPaymentContext(): PaymentContext {
    return this.#paymentContext;
  }

  /**
   * Updates the current payment context.\
   * The given context can contain only those fields that need to be updated. Any other value will remain as-is.
   * This makes it easy to overwrite only specific fields like the locale or amount.
   * @param paymentContext A partial payment context.
   */
  updatePaymentContext(paymentContext: Partial<PaymentContext>): void {
    this.#paymentContext = { ...this.#paymentContext, ...paymentContext };
    // Invalidate cached Apple Pay and Google Pay clients
    clearCache(this.#cache, (key) => key.startsWith("ApplePayClient") || key.startsWith("GooglePayClient"));
    // Invalidate the Apple Pay and Google Pay availability
    delete this.#paymentProductAvailability[PP_APPLE_PAY];
    delete this.#paymentProductAvailability[PP_GOOGLE_PAY];
  }

  /**
   * Sets a provided payment product or payment product group.\
   * This can be used for server-side rendering, where the server has already retrieved the payment item,
   * to prevent unnecessarily retrieving it again.
   * Note that the payment product or payment product group should have all necessary properties set, including fields.
   * @param paymentItem The provided payment product or payment product group, provided as a raw API response.
   */
  setProvidedPaymentItem(paymentItem?: api.PaymentProduct | api.PaymentProductGroup): void {
    if (paymentItem) {
      if (typeof paymentItem.id === "number") {
        // api.PaymentProduct
        this.#providedPaymentItem = toPaymentProduct(paymentItem as api.PaymentProduct, this.#sessionDetails.assetUrl);
      } else {
        // api.PaymentProductGroup
        this.#providedPaymentItem = toPaymentProductGroup(paymentItem as api.PaymentProductGroup, this.#sessionDetails.assetUrl);
      }
    } else {
      this.#providedPaymentItem = undefined;
    }
  }

  /**
   * Returns an object that can be used to encrypt {@link PaymentRequest} objects.
   * @throws If {@link webCryptoCryptoEngine} is not available,
   *         and no other crypto engine has been set using either {@link defaultCryptoEngine} or {@link setCryptoEngine}.
   */
  getEncryptor(): Encryptor {
    if (!this.#cryptoEngine) {
      throw new Error("encryption not supported");
    }
    return newEncryptor(this.#sessionDetails.clientSessionId, () => this.getPublicKey(), this.#cryptoEngine, this.#device);
  }

  /**
   * Sets the crypto engine to use.\
   * This method can be used to provide a crypto engine that's different from {@link defaultCryptoEngine}.
   * @param cryptoEngine The crypto engine to set.
   */
  setCryptoEngine(cryptoEngine?: CryptoEngine): void {
    this.#cryptoEngine = cryptoEngine;
  }

  /**
   * Retrieves the session specific public key.
   * @returns A promise containing the session specific public key.
   */
  async getPublicKey(): Promise<PublicKey> {
    const cacheKey = "PublicKey";
    return getValue(this.#cache, cacheKey, () => this.#communicator.getPublicKey());
  }

  /**
   * Polls a third party for the status of a payment.
   * @param paymentId The ID of the payment.
   * @returns A promise containing the third party status.
   */
  async getThirdPartyStatus(paymentId: string): Promise<ThirdPartyStatus> {
    // Don't cache, always return the latest result
    return this.#communicator.getThirdPartyStatus(paymentId);
  }

  /**
   * Retrieves the payment items available for the current payment context.\
   * Note that for Apple Pay and Google Pay to possibly be part of the result, these need to be enabled in the device.
   * Furthermore, the current payment context *must* contain the necessary payment product specific inputs.
   * Otherwise, both products will be filtered out if they are returned by the Worldline Connect Client API.
   * @param useGroups True to include payment product groups, or false to only include payment products.
   * @returns A promise containing the available payment items.
   */
  async getBasicPaymentItems(useGroups = true): Promise<BasicPaymentItems> {
    if (useGroups) {
      const [products, groups] = await Promise.all([this.getBasicPaymentProducts(), this.getBasicPaymentProductGroups()]);
      return toBasicPaymentItems(products, groups);
    }
    const products = await this.getBasicPaymentProducts();
    return toBasicPaymentItems(products);
  }

  /**
   * Retrieves the payment product groups available for the current payment context.
   * @returns A promise containing the available payment product groups.
   */
  async getBasicPaymentProductGroups(): Promise<BasicPaymentProductGroups> {
    const params: api.PaymentProductGroupsParams = {
      countryCode: this.#paymentContext.countryCode,
      currencyCode: this.#paymentContext.amountOfMoney.currencyCode,
      locale: this.#paymentContext.locale,
      amount: this.#paymentContext.amountOfMoney.amount,
      isRecurring: this.#paymentContext.isRecurring,
      hide: ["fields"],
    };
    const cacheKey = constructCacheKey(
      "BasicPaymentProductGroups",
      params.countryCode,
      params.currencyCode,
      params.locale,
      params.amount,
      params.isRecurring
    );
    const json = await getValue(this.#cache, cacheKey, () => this.#communicator.getPaymentProductGroups(params));
    return toBasicPaymentProductGroups(json, this.#sessionDetails.assetUrl);
  }

  /**
   * Retrieves a specific payment product group using the current payment context.
   * @param paymentProductGroupId The ID of the payment product group.
   * @returns A promise containing the payment product group. It will be rejected if the payment product group is not available for the current context.
   */
  async getPaymentProductGroup(paymentProductGroupId: string): Promise<PaymentProductGroup> {
    if (this.#providedPaymentItem?.id === paymentProductGroupId) {
      return this.#providedPaymentItem as PaymentProductGroup;
    }

    const params: api.PaymentProductParams = {
      countryCode: this.#paymentContext.countryCode,
      currencyCode: this.#paymentContext.amountOfMoney.currencyCode,
      locale: this.#paymentContext.locale,
      amount: this.#paymentContext.amountOfMoney.amount,
      isRecurring: this.#paymentContext.isRecurring,
    };
    const cacheKey = constructCacheKey(
      `PaymentProductGroup:${paymentProductGroupId}`,
      params.countryCode,
      params.currencyCode,
      params.locale,
      params.amount,
      params.isRecurring
    );
    const json = await getValue(this.#cache, cacheKey, () => this.#communicator.getPaymentProductGroup(paymentProductGroupId, params));
    return toPaymentProductGroup(json, this.#sessionDetails.assetUrl);
  }

  /**
   * Retrieves a session specific JavaScript snippet for device fingerprinting for a payment product group.
   * @param paymentProductGroupId The ID of the payment product group.
   * @param request The device fingerprint request to use.
   * @returns A promise containing the device fingerprint result.
   */
  async getPaymentProductGroupDeviceFingerprint(paymentProductGroupId: string, request: DeviceFingerprintRequest): Promise<DeviceFingerprintResult> {
    // Don't cache, always return the latest result
    return this.#communicator.getPaymentProductGroupDeviceFingerprint(paymentProductGroupId, request);
  }

  /**
   * Retrieves the payment productss available for the current payment context.\
   * Note that for Apple Pay and Google Pay to possibly be part of the result, these need to be enabled in the device.
   * Furthermore, the current payment context *must* contain the necessary payment product specific inputs.
   * Otherwise, both products will be filtered out if they are returned by the Worldline Connect Client API.
   * @returns A promise containing the available payment products.
   */
  async getBasicPaymentProducts(): Promise<BasicPaymentProducts> {
    const params: api.PaymentProductsParams = {
      countryCode: this.#paymentContext.countryCode,
      currencyCode: this.#paymentContext.amountOfMoney.currencyCode,
      locale: this.#paymentContext.locale,
      amount: this.#paymentContext.amountOfMoney.amount,
      isRecurring: this.#paymentContext.isRecurring,
      hide: ["fields"],
    };
    const cacheKey = constructCacheKey(
      "BasicPaymentProducts",
      params.countryCode,
      params.currencyCode,
      params.locale,
      params.amount,
      params.isRecurring
    );
    const json = await getValue(this.#cache, cacheKey, () => this.#communicator.getPaymentProducts(params));

    const checks: Promise<void>[] = [];
    const applePayProduct = json.paymentProducts.find((product) => product.id === PP_APPLE_PAY);
    if (applePayProduct && this.#paymentProductAvailability[applePayProduct.id] === undefined) {
      const applePaySpecificData = toApplePaySpecificData(applePayProduct);
      checks.push(
        this.isApplePayAvailable(applePaySpecificData).then((result) => {
          this.#paymentProductAvailability[applePayProduct.id] = result;
          console.debug(`Apple Pay is available: ${result}`);
        })
      );
    }
    const googlePayProduct = json.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY);
    if (googlePayProduct && this.#paymentProductAvailability[googlePayProduct.id] === undefined) {
      const googlePaySpecificData = toGooglePaySpecificData(googlePayProduct);
      checks.push(
        this.isGooglePayAvailable(googlePaySpecificData).then((result) => {
          this.#paymentProductAvailability[googlePayProduct.id] = result;
          console.debug(`Google Pay is available: ${result}`);
        })
      );
    }
    await Promise.all(checks);

    const filteredJson: api.PaymentProducts = {
      paymentProducts: json.paymentProducts.filter((p) => this.#paymentProductAvailability[p.id] !== false),
    };

    if (filteredJson.paymentProducts.length === 0) {
      const error = new Error("No payment products available");
      error["json"] = json;
      return Promise.reject(error);
    }
    return toBasicPaymentProducts(filteredJson, this.#sessionDetails.assetUrl);
  }

  /**
   * Retrieves a specific payment product using the current payment context.\
   * Note that for Apple Pay and Google Pay, these need to be enabled in the device.
   * Furthermore, the current payment context *must* contain the necessary payment product specific inputs.
   * Otherwise, the returned promise will be rejected.
   * @param paymentProductId The ID of the payment product.
   * @returns A promise containing the payment product. It will be rejected if the payment product is not available for the current context.
   */
  async getPaymentProduct(paymentProductId: number): Promise<PaymentProduct> {
    if (this.#providedPaymentItem?.id === paymentProductId) {
      return this.#providedPaymentItem as PaymentProduct;
    }

    const params: api.PaymentProductParams = {
      countryCode: this.#paymentContext.countryCode,
      currencyCode: this.#paymentContext.amountOfMoney.currencyCode,
      locale: this.#paymentContext.locale,
      amount: this.#paymentContext.amountOfMoney.amount,
      isRecurring: this.#paymentContext.isRecurring,
    };
    if (
      paymentProductId === PP_BANCONTACT &&
      this.#paymentContext.paymentProductSpecificInputs &&
      this.#paymentContext.paymentProductSpecificInputs.bancontact &&
      this.#paymentContext.paymentProductSpecificInputs.bancontact.forceBasicFlow
    ) {
      params.forceBasicFlow = this.#paymentContext.paymentProductSpecificInputs.bancontact.forceBasicFlow;
    }
    const cacheKey = constructCacheKey(
      `PaymentProduct:${paymentProductId}`,
      params.countryCode,
      params.currencyCode,
      params.locale,
      params.amount,
      params.isRecurring,
      params.forceBasicFlow
    );
    const json = await getValue(this.#cache, cacheKey, () => this.#communicator.getPaymentProduct(paymentProductId, params));

    if (paymentProductId === PP_APPLE_PAY && this.#paymentProductAvailability[paymentProductId] === undefined) {
      const applePaySpecificData = toApplePaySpecificData(json);
      const available = await this.isApplePayAvailable(applePaySpecificData);
      this.#paymentProductAvailability[paymentProductId] = available;
      console.debug(`Apple Pay is available: ${available}`);
      if (available) {
        return toPaymentProduct(json, this.#sessionDetails.assetUrl);
      }
      return Promise.reject(productNotFoundError());
    }
    if (paymentProductId === PP_GOOGLE_PAY && this.#paymentProductAvailability[paymentProductId] === undefined) {
      const googlePaySpecificData = toGooglePaySpecificData(json);
      const available = await this.isGooglePayAvailable(googlePaySpecificData);
      this.#paymentProductAvailability[paymentProductId] = available;
      console.debug(`Google Pay is available: ${available}`);
      if (available) {
        return toPaymentProduct(json, this.#sessionDetails.assetUrl);
      }
      return Promise.reject(productNotFoundError());
    }

    if (this.#paymentProductAvailability[paymentProductId] === false) {
      return Promise.reject(productNotFoundError());
    }

    return toPaymentProduct(json, this.#sessionDetails.assetUrl);
  }

  /**
   * Retrieves a specific payment product using the current payment context.\
   * Note that for Apple Pay and Google Pay, these need to be enabled in the device.
   * Furthermore, the current payment context *must* contain the necessary payment product specific inputs.
   * Otherwise, the returned promise will be rejected.
   * @param paymentProductId The ID of the payment product.
   * @returns A promise containing the payment product. It will be rejected if the payment product is not available for the current context.
   */

  /**
   * Retrieves the display hints for a specific payment product using the current payment context.\
   * This method can be used to retrieve the display hints for rendering cobrands as returned by {@link getIINDetails}.
   * It will behave the same as calling {@link getPaymentProduct} and retrieving the display hints from the result,
   * but may be more performant if the product has not been retrieved yet.
   * @param paymentProductId The ID of the payment product.
   * @returns A promise containing the payment product's display hints. It will be rejected if the payment product is not available for the current context.
   */
  async getPaymentProductDisplayHints(paymentProductId: number): Promise<PaymentProductDisplayHints> {
    // For Apple Pay and Google Pay, always retrieve the product, to make use of its filtering
    if (paymentProductId === PP_APPLE_PAY || paymentProductId === PP_GOOGLE_PAY) {
      return this.getPaymentProduct(paymentProductId).then((product) => product.displayHints);
    }

    const productsCacheKey = constructCacheKey(
      "BasicPaymentProducts",
      this.#paymentContext.countryCode,
      this.#paymentContext.amountOfMoney.currencyCode,
      this.#paymentContext.locale,
      this.#paymentContext.amountOfMoney.amount,
      this.#paymentContext.isRecurring
    );
    const productsJson: api.PaymentProducts | undefined = getCurrentValue(this.#cache, productsCacheKey);
    if (productsJson) {
      const productJson = productsJson.paymentProducts.find((product) => product.id === paymentProductId);
      if (productJson) {
        return toPaymentProductDisplayHints(productJson.displayHints, this.#sessionDetails.assetUrl);
      }
    }
    return this.getPaymentProduct(paymentProductId).then((product) => product.displayHints);
  }

  /**
   * Retrieves the directory for a payment product.
   * @param paymentProductId The ID of the payment product.
   * @returns A promise containing the directory for the payment product.
   */
  async getPaymentProductDirectory(paymentProductId: number): Promise<Directory> {
    const params: api.DirectoryParams = {
      countryCode: this.#paymentContext.countryCode,
      currencyCode: this.#paymentContext.amountOfMoney.currencyCode,
    };
    const cacheKey = constructCacheKey(`Directory:${paymentProductId}`, params.countryCode, params.currencyCode);
    return getValue(this.#cache, cacheKey, () => this.#communicator.getPaymentProductDirectory(paymentProductId, params));
  }

  /**
   * Retrieves customer details for a payment product.
   * @param paymentProductId The ID of the payment product.
   * @param request The customer details request containing the country code and field values.
   * @returns A promise containing the customer detauls result.
   */
  async getCustomerDetails(paymentProductId: number, request: CustomerDetailsRequest): Promise<CustomerDetailsResult> {
    const cacheKey = constructCacheKeyWithValues(`CustomerDetails:${paymentProductId}`, [request.countryCode], request.values);
    return getValue(this.#cache, cacheKey, () => this.#communicator.getCustomerDetails(paymentProductId, request));
  }

  /**
   * Retrieves a session specific JavaScript snippet for device fingerprinting for a payment product.
   * @param paymentProductGroupId The ID of the payment product.
   * @param request The device fingerprint request to use.
   * @returns A promise containing the device fingerprint result.
   */
  async getPaymentProductDeviceFingerprint(paymentProductId: number, request: DeviceFingerprintRequest): Promise<DeviceFingerprintResult> {
    // Don't cache, always return the latest result
    return this.#communicator.getPaymentProductDeviceFingerprint(paymentProductId, request);
  }

  /**
   * Retrieves the networks for a payment product.
   * @param paymentProductId The ID of the payment product.
   * @returns A promise containing the networks for the payment product.
   */
  async getPaymentProductNetworks(paymentProductId: number): Promise<PaymentProductNetworks> {
    const params: api.PaymentProductNetworksParams = {
      countryCode: this.#paymentContext.countryCode,
      currencyCode: this.#paymentContext.amountOfMoney.currencyCode,
      amount: this.#paymentContext.amountOfMoney.amount,
      isRecurring: this.#paymentContext.isRecurring,
    };
    const cacheKey = constructCacheKey(
      `PaymentProductNetworks:${paymentProductId}`,
      params.countryCode,
      params.currencyCode,
      params.amount,
      params.isRecurring
    );
    return getValue(this.#cache, cacheKey, () => this.#communicator.getPaymentProductNetworks(paymentProductId, params));
  }

  /**
   * Creates an Apple Pay merchant session.\
   * Note that this method should usually not be called directly. Use {@link ApplePay} instead.
   * @param applePaySpecificInput The Apple Pay specific input, retrieved from an existing payment product.
   * @returns A promise containing the Apple Pay merchant session data.
   */
  async createApplePaySession(
    applePaySpecificInput: MobilePaymentProductSession302SpecificInput
  ): Promise<MobilePaymentProductSession302SpecificOutput> {
    // Don't cache, always return the latest result
    const json = await this.#communicator.createPaymentProductSession(PP_APPLE_PAY, {
      paymentProductSession302SpecificInput: applePaySpecificInput,
    });
    if (!json.paymentProductSession302SpecificOutput) {
      throw new Error("no paymentProductSession302SpecificOutput returned");
    }
    return json.paymentProductSession302SpecificOutput;
  }

  /**
   * Retrieves information related to the available installment options.
   * @param request The installment details request.
   * @returns A promise containing the installment options.
   */
  async getInstallmentInfo(request: GetInstallmentRequest): Promise<InstallmentOptionsResponse> {
    // Don't cache
    const apiRequest: api.GetInstallmentRequest = {
      amountOfMoney: request.amountOfMoney ?? this.#paymentContext.amountOfMoney,
      countryCode: request.countryCode ?? this.#paymentContext.countryCode,
    };
    if (request.bin !== undefined) {
      apiRequest.bin = request.bin;
    }
    if (request.paymentProductId !== undefined) {
      apiRequest.paymentProductId = request.paymentProductId;
    }
    const json = await this.#communicator.getInstallmentInfo(apiRequest);
    return toInstallmentOptionsResponse(json, this.#sessionDetails.assetUrl);
  }

  /**
   * Converts an amount from one currency to another.
   * @param request The convert amount request.
   * @returns A promise containing the convert amount result.
   */
  async convertAmount(request: ConvertAmountRequest): Promise<ConvertAmountResult> {
    const params: api.ConvertAmountParams = request;
    const cacheKey = constructCacheKey("ConvertAmount", request.amount, request.source, request.target);
    return getValue(this.#cache, cacheKey, () => this.#communicator.convertAmount(params));
  }

  /**
   * Retrieves IIN details for a (partial) credit card number.
   * There can be four possible outcomes:
   * * status === "NOT_ENOUGH_DIGITS": the card number contains fewer than 6 digits.
   * * status === "SUPPORTED": the card number is recognized and supported for the current payment context.\
   *   The result will contain the payment product ID and if available the cobrands.
   * * status === "NOT_ALLOWED": the card number is recognized but not supported for the current payment context.\
   *   The result will contain the payment product ID and if available the cobrands.
   * * status === "UKNOWN": the card number is not recognized.\
   *   The result will not contain a payment product ID or any cobrands, but instead the error response returned by the Worldline Connect Client API.
   * @param partialCreditCardNumber The (partial) credit card number. Only its first 6 or 8 characters will be used.
   * @returns A promise containing the IIN details result.
   * @throws If the given partial credit card number does not have at least 6 digits.
   */
  async getIINDetails(partialCreditCardNumber: string): Promise<IINDetailsResult> {
    partialCreditCardNumber = partialCreditCardNumber.replace(/\s/g, "");
    if (partialCreditCardNumber.length < 6) {
      return {
        status: "NOT_ENOUGH_DIGITS",
      };
    }
    const paymentContext: api.PaymentContext = {
      amountOfMoney: this.#paymentContext.amountOfMoney,
      countryCode: this.#paymentContext.countryCode,
    };
    if (this.#paymentContext.isInstallments !== undefined) {
      paymentContext.isInstallments = this.#paymentContext.isInstallments;
    }
    if (this.#paymentContext.isRecurring !== undefined) {
      paymentContext.isRecurring = this.#paymentContext.isRecurring;
    }

    const request: api.GetIINDetailsRequest = {
      bin: partialCreditCardNumber.length >= 8 ? partialCreditCardNumber.substring(0, 8) : partialCreditCardNumber.substring(0, 6),
      paymentContext,
    };
    const cacheKey = constructCacheKey(
      "IINDetails:",
      request.bin,
      paymentContext.amountOfMoney.amount,
      paymentContext.amountOfMoney.currencyCode,
      paymentContext.countryCode,
      paymentContext.isInstallments,
      paymentContext.isRecurring
    );
    const json = await getValue(this.#cache, cacheKey, () => this.#communicator.getIINDetails(request));
    if (json.status === "UNKNOWN") {
      return json;
    }
    let status: IINDetailsSuccessStatus;
    let isAllowedInContext: boolean;
    if (json.isAllowedInContext === true) {
      isAllowedInContext = json.isAllowedInContext;
      status = "SUPPORTED";
    } else if (json.isAllowedInContext === false) {
      isAllowedInContext = json.isAllowedInContext;
      status = "NOT_ALLOWED";
    } else {
      // This should not happen because a payment context is always provided. Query the product anyway.
      try {
        await this.getPaymentProduct(json.paymentProductId);
        status = "SUPPORTED";
        isAllowedInContext = true;
      } catch (e) {
        status = "NOT_ALLOWED";
        isAllowedInContext = false;
      }
    }
    return { ...json, status, isAllowedInContext };
  }

  /**
   * Retrieves the privacy policy for a specific or all payment products.
   * This method will use the locale from the current payment context.
   * @param paymentProductId The optional ID of a specific payment product.
   * @returns A promise containing the privacy policy.
   */
  async getPrivacyPolicy(paymentProductId?: number): Promise<PrivacyPolicyResult> {
    const params: api.GetPrivacyPolicyParams = {
      locale: this.#paymentContext.locale,
      paymentProductId,
    };
    const cacheKey = constructCacheKey("PrivacyPolicy:", paymentProductId, params.locale);
    return getValue(this.#cache, cacheKey, () => this.#communicator.getPrivacyPolicy(params));
  }

  /**
   * Returns a helper for working with Apple Pay.\
   * Note that Apple Pay needs to be enabled in the device. Furthermore, the current payment context *must* contain the Apple Pay specific input.
   * Otherwise, the returned promise will be rejected.
   * This should not occur if this method is called with a product retrieved using the same payment context though.
   * @param applePayProduct The Apple Pay product.
   * @returns A promise containing a helper for working with Apple Pay.
   * @throws If the given product does not have the correct ID, or is missing the Apple Pay (302) specific data.
   */
  async ApplePay(applePayProduct: PaymentProduct | BasicPaymentProduct): Promise<ApplePayHelper> {
    const applePaySpecificData = toApplePaySpecificData(applePayProduct);
    const client = await this.getApplePayClient(applePaySpecificData);
    if (!client) {
      throw new Error("Apple Pay is not available");
    }
    return {
      createPayment: () => client.createPayment((input) => this.createApplePaySession(input)),
    };
  }

  private async getApplePayClient(applePaySpecificData?: ApplePaySpecificData): Promise<ApplePayClient | undefined> {
    const applePaySpecificInput = this.#paymentContext.paymentProductSpecificInputs?.applePay;
    if (!applePaySpecificInput || !applePaySpecificData) {
      return undefined;
    }
    // Don't include applePaySpecificInput or the payment context in the cache key
    // When the payment context is updated the ApplePayClient cache entries are cleared
    const cacheKey = constructCacheKey("ApplePayClient", applePaySpecificData.networks);
    return getValue(this.#cache, cacheKey, () => this.#device.getApplePayClient(applePaySpecificInput, applePaySpecificData, this.#paymentContext));
  }

  private async isApplePayAvailable(applePaySpecificData?: ApplePaySpecificData): Promise<boolean> {
    return this.getApplePayClient(applePaySpecificData)
      .then((client) => !!client)
      .catch((reason) => {
        console.error("Apple Pay is not available", reason);
        return false;
      });
  }

  /**
   * Returns a helper for working with Google Pay.\
   * Note that Google Pay needs to be enabled in the device. Furthermore, the current payment context *must* contain the Google Pay specific input.
   * Otherwise, the returned promise will be rejected.
   * This should not occur if this method is called with a product retrieved using the same payment context though.
   * @param googlePayProduct The Google Pay product.
   * @returns A promise containing a helper for working with Google Pay.
   * @throws If the given product does not have the correct ID, or is missing the Google Pay (320) specific data.
   */
  async GooglePay(googlePayProduct: PaymentProduct | BasicPaymentProduct): Promise<GooglePayHelper> {
    const googlePaySpecificData = toGooglePaySpecificData(googlePayProduct);
    const client = await this.getGooglePayClient(googlePaySpecificData);
    if (!client) {
      throw new Error("Google Pay is not available");
    }
    return {
      createButton: (options) => client.createButton(options),
      prefetchPaymentData: () => client.prefetchPaymentData(),
      createPayment: () => client.createPayment(),
    };
  }

  private async getGooglePayClient(googlePaySpecificData?: GooglePaySpecificData): Promise<GooglePayClient | undefined> {
    const googlePaySpecificInput = this.#paymentContext.paymentProductSpecificInputs?.googlePay;
    if (!googlePaySpecificInput || !googlePaySpecificData) {
      return undefined;
    }
    // Don't include googlePaySpecificInput or the payment context in the cache key
    // When the payment context is updated the GooglePayClient cache entries are cleared
    const cacheKey = constructCacheKey("GooglePayClient", googlePaySpecificData.gateway, googlePaySpecificData.networks);
    return getValue(this.#cache, cacheKey, () =>
      this.#device.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, this.#paymentContext)
    );
  }

  private async isGooglePayAvailable(googlePaySpecificData?: GooglePaySpecificData): Promise<boolean> {
    return this.getGooglePayClient(googlePaySpecificData)
      .then((client) => !!client)
      .catch((reason) => {
        console.error("Google Pay is not available", reason);
        return false;
      });
  }
}

Object.freeze(Session.prototype);
