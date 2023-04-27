import { Communicator } from "../communicator";
import { api } from "../communicator/model";
import { CryptoEngine, Encryptor } from "../crypto";
import { newEncryptor } from "../crypto/Encryptor";
import { isSubtleCryptoAvailable, subtleCryptoEngine } from "../crypto/SubtleCrypto";
import { HttpResponse } from "../http";
import {
  ApplePayClient,
  BasicPaymentItems,
  BasicPaymentProduct,
  BasicPaymentProductGroups,
  BasicPaymentProducts,
  ConvertAmountResult,
  CustomerDetailsRequest,
  CustomerDetailsResult,
  Device,
  DeviceFingerprintRequest,
  DeviceFingerprintResult,
  Directory,
  GooglePayButtonOptions,
  GooglePayClient,
  IINDetailsResult,
  IINDetailsSuccessStatus,
  KeyValuePair,
  MobilePaymentProductSession302SpecificInput,
  MobilePaymentProductSession302SpecificOutput,
  PaymentContext,
  PaymentItem,
  PaymentProduct,
  PaymentProduct302SpecificData,
  PaymentProduct320SpecificData,
  PaymentProductGroup,
  PaymentProductNetworks,
  // Imported for TypeDoc
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PaymentRequest,
  PrivacyPolicyResult,
  PublicKey,
  SessionDetails,
  ThirdPartyStatus,
} from "../model";
import { toBasicPaymentItems } from "../model/PaymentItem";
import { PP_APPLE_PAY, PP_BANCONTACT, PP_GOOGLE_PAY, toBasicPaymentProducts, toPaymentProduct } from "../model/PaymentProduct";
import { toBasicPaymentProductGroups, toPaymentProductGroup } from "../model/PaymentProductGroup";
import { browser } from "../browser";

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
  cache[key] = value !== undefined ? value : UNDEFINED_VALUE;
  return value;
}

function clearCache(cache: Record<string, unknown>, filter: (key: string) => boolean): void {
  const keys = Object.keys(cache).filter(filter);
  for (const key of keys) {
    delete cache[key];
  }
}

function prefixWithAssetURL(url: string, assetURL: string): string {
  const baseUrl = assetURL.endsWith("/") ? assetURL : assetURL + "/";
  return baseUrl + url;
}

function updateItem<T extends api.PaymentProduct | api.PaymentProductGroup>(item: T, assetURL: string) {
  item.displayHints.logo = prefixWithAssetURL(item.displayHints.logo, assetURL);

  if (item.accountsOnFile) {
    for (const accountOnFile of item.accountsOnFile) {
      accountOnFile.displayHints.logo = prefixWithAssetURL(accountOnFile.displayHints.logo, assetURL);
    }
  }

  if (item.fields) {
    for (const field of item.fields) {
      if (field.displayHints && field.displayHints.tooltip && field.displayHints.tooltip.image) {
        field.displayHints.tooltip.image = prefixWithAssetURL(field.displayHints.tooltip.image, assetURL);
      }
    }

    item.fields.sort((f1, f2) => {
      const displayOrder1 = f1.displayHints?.displayOrder ?? 0;
      const displayOrder2 = f2.displayHints?.displayOrder ?? 0;
      return displayOrder1 - displayOrder2;
    });
  }
}

function updateItems<T extends api.PaymentProduct | api.PaymentProductGroup>(items: T[], assetURL: string): void {
  for (const item of items) {
    updateItem(item, assetURL);
  }

  items.sort((i1, i2) => i1.displayHints.displayOrder - i2.displayHints.displayOrder);
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
 * The main entry point for communicating with the Ingenico Connect Client API.
 */
export class Session {
  private readonly communicator: Communicator;
  private readonly cache: Record<string, unknown> = {};
  private cryptoEngine?: CryptoEngine;
  private providedPaymentItem?: PaymentItem;
  private paymentProductAvailability: Record<number, boolean | undefined> = {};

  /**
   * Creates a new session. This will use {@link subtleCryptoEngine} if available.
   * Otherwise, no crypto engine will be set, unless one is explicitly provided using {@link setCryptoEngine}.
   * @param sessionDetails The session details, as returned by an Ingenico Connect Server API create session call.
   * @param paymentContext The context for the current payment.
   * @param device An object representing the current device. If not given, it is assumed that the current device is a browser.
   */
  constructor(private readonly sessionDetails: SessionDetails, private paymentContext: PaymentContext, private readonly device: Device = browser) {
    this.communicator = new Communicator(sessionDetails, device);

    if (isSubtleCryptoAvailable()) {
      this.cryptoEngine = subtleCryptoEngine;
    }
  }

  /**
   * Returns the current payment context.
   */
  getPaymentContext(): PaymentContext {
    return this.paymentContext;
  }

  /**
   * Updates the current payment context.\
   * The given context can contain only those fields that need to be updated. Any other value will remain as-is.
   * This makes it easy to overwrite only specific fields like the locale or amount.
   * @param paymentContext A partial payment context.
   */
  updatePaymentContext(paymentContext: Partial<PaymentContext>): void {
    this.paymentContext = Object.assign({}, this.paymentContext, paymentContext);
    // Invalidate cached Apple Pay and Google Pay clients
    clearCache(this.cache, (key) => key.startsWith("ApplePayClient") || key.startsWith("GooglePayClient"));
    // Invalidate the Apple Pay and Google Pay availability
    delete this.paymentProductAvailability[PP_APPLE_PAY];
    delete this.paymentProductAvailability[PP_GOOGLE_PAY];
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
      paymentItem = JSON.parse(JSON.stringify(paymentItem)) as api.PaymentProduct | api.PaymentProductGroup;
      updateItem(paymentItem, this.sessionDetails.assetUrl);
      if (typeof paymentItem.id === "number") {
        // api.PaymentProduct
        this.providedPaymentItem = toPaymentProduct(paymentItem as api.PaymentProduct);
      } else {
        // api.PaymentProductGroup
        this.providedPaymentItem = toPaymentProductGroup(paymentItem as api.PaymentProductGroup);
      }
    } else {
      this.providedPaymentItem = undefined;
    }
  }

  /**
   * Returns an object that can be used to encrypt {@link PaymentRequest} objects.
   * @returns A promise containing an {@link Encryptor}.
   * @throws If {@link subtleCryptoEngine} is not available and no other crypto engine has been set using {@link setCryptoEngine}.
   */
  async getEncryptor(): Promise<Encryptor> {
    if (!this.cryptoEngine) {
      throw new Error("encryption not supported");
    }
    const publicKey = await this.getPublicKey();
    return newEncryptor(this.sessionDetails.clientSessionId, publicKey, this.cryptoEngine, this.device);
  }

  /**
   * Sets the crypto engine to use. This method should be used to provide a crypto engine in case {@link subtleCryptoEngine} is not available.
   * @param cryptoEngine The crypto engine to set.
   */
  setCryptoEngine(cryptoEngine: CryptoEngine): void {
    this.cryptoEngine = cryptoEngine;
  }

  /**
   * Retrieves the session specific public key.
   * @returns A promise containing the session specific public key.
   */
  async getPublicKey(): Promise<PublicKey> {
    const cacheKey = "PublicKey";
    return getValue(this.cache, cacheKey, () => this.communicator.getPublicKey());
  }

  /**
   * Polls a third party for the status of a payment.
   * @param paymentId The ID of the payment.
   * @returns A promise containing the third party status.
   */
  async getThirdPartyStatus(paymentId: string): Promise<ThirdPartyStatus> {
    // Don't cache, always return the latest result
    return this.communicator.getThirdPartyStatus(paymentId);
  }

  /**
   * Retrieves the payment items available for the current payment context.\
   * Note that for Apple Pay and Google Pay to possibly be part of the result, these need to be enabled in the device.
   * Furthermore, the current payment context *must* contain the necessary payment product specific inputs.
   * Otherwise, both products will be filtered out if they are returned by the Ingenico Connect Client API.
   * @param useGroups True to include payment product groups, or false to only include payment products.
   * @returns A promise containing the available payment items.
   */
  async getBasicPaymentItems(useGroups: boolean): Promise<BasicPaymentItems> {
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
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
      locale: this.paymentContext.locale,
      amount: this.paymentContext.amountOfMoney.amount,
      isRecurring: this.paymentContext.isRecurring,
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
    const json = await getValue(this.cache, cacheKey, async () => {
      const json = await this.communicator.getPaymentProductGroups(params);
      updateItems(json.paymentProductGroups, this.sessionDetails.assetUrl);
      return json;
    });
    return toBasicPaymentProductGroups(json);
  }

  /**
   * Retrieves a specific payment product group using the current payment context.
   * @param paymentProductGroupId The ID of the payment product group.
   * @returns A promise containing the payment product group. It will be rejected if the payment product group is not available for the current context.
   */
  async getPaymentProductGroup(paymentProductGroupId: string): Promise<PaymentProductGroup> {
    if (this.providedPaymentItem?.id === paymentProductGroupId) {
      return this.providedPaymentItem as PaymentProductGroup;
    }

    const params: api.PaymentProductParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
      locale: this.paymentContext.locale,
      amount: this.paymentContext.amountOfMoney.amount,
      isRecurring: this.paymentContext.isRecurring,
    };
    const cacheKey = constructCacheKey(
      `PaymentProductGroup:${paymentProductGroupId}`,
      params.countryCode,
      params.currencyCode,
      params.locale,
      params.amount,
      params.isRecurring
    );
    const json = await getValue(this.cache, cacheKey, async () => {
      const json = await this.communicator.getPaymentProductGroup(paymentProductGroupId, params);
      updateItem(json, this.sessionDetails.assetUrl);
      return json;
    });
    return toPaymentProductGroup(json);
  }

  /**
   * Retrieves a session specific JavaScript snippet for device fingerprinting for a payment product group.
   * @param paymentProductGroupId The ID of the payment product group.
   * @param request The device fingerprint request to use.
   * @returns A promise containing the device fingerprint result.
   */
  async getPaymentProductGroupDeviceFingerprint(paymentProductGroupId: string, request: DeviceFingerprintRequest): Promise<DeviceFingerprintResult> {
    // Don't cache, always return the latest result
    return this.communicator.getPaymentProductGroupDeviceFingerprint(paymentProductGroupId, request);
  }

  /**
   * Retrieves the payment productss available for the current payment context.\
   * Note that for Apple Pay and Google Pay to possibly be part of the result, these need to be enabled in the device.
   * Furthermore, the current payment context *must* contain the necessary payment product specific inputs.
   * Otherwise, both products will be filtered out if they are returned by the Ingenico Connect Client API.
   * @returns A promise containing the available payment products.
   */
  async getBasicPaymentProducts(): Promise<BasicPaymentProducts> {
    const params: api.PaymentProductsParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
      locale: this.paymentContext.locale,
      amount: this.paymentContext.amountOfMoney.amount,
      isRecurring: this.paymentContext.isRecurring,
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
    const json = await getValue(this.cache, cacheKey, async () => {
      const json = await this.communicator.getPaymentProducts(params);
      updateItems(json.paymentProducts, this.sessionDetails.assetUrl);
      return json;
    });

    const checks: Promise<void>[] = [];
    const applePayProduct = json.paymentProducts.find((product) => product.id === PP_APPLE_PAY);
    if (applePayProduct && this.paymentProductAvailability[applePayProduct.id] === undefined) {
      checks.push(
        this.isApplePayAvailable(applePayProduct.paymentProduct302SpecificData).then((result) => {
          this.paymentProductAvailability[applePayProduct.id] = result;
          console.debug(`Apple Pay is available: ${result}`);
        })
      );
    }
    const googlePayProduct = json.paymentProducts.find((product) => product.id === PP_GOOGLE_PAY);
    if (googlePayProduct && this.paymentProductAvailability[googlePayProduct.id] === undefined) {
      checks.push(
        this.isGooglePayAvailable(googlePayProduct.paymentProduct320SpecificData).then((result) => {
          this.paymentProductAvailability[googlePayProduct.id] = result;
          console.debug(`Google Pay is available: ${result}`);
        })
      );
    }
    await Promise.all(checks);

    const filteredJson: api.PaymentProducts = {
      paymentProducts: json.paymentProducts.filter((p) => this.paymentProductAvailability[p.id] !== false),
    };

    if (filteredJson.paymentProducts.length === 0) {
      throw {
        message: "No payment products available",
        json: json,
      };
    }
    return toBasicPaymentProducts(filteredJson);
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
    if (this.providedPaymentItem?.id === paymentProductId) {
      return this.providedPaymentItem as PaymentProduct;
    }

    const params: api.PaymentProductParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
      locale: this.paymentContext.locale,
      amount: this.paymentContext.amountOfMoney.amount,
      isRecurring: this.paymentContext.isRecurring,
    };
    if (
      paymentProductId === PP_BANCONTACT &&
      this.paymentContext.paymentProductSpecificInputs &&
      this.paymentContext.paymentProductSpecificInputs.bancontact &&
      this.paymentContext.paymentProductSpecificInputs.bancontact.forceBasicFlow
    ) {
      params.forceBasicFlow = this.paymentContext.paymentProductSpecificInputs.bancontact.forceBasicFlow;
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
    const json = await getValue(this.cache, cacheKey, async () => {
      const json = await this.communicator.getPaymentProduct(paymentProductId, params);
      updateItem(json, this.sessionDetails.assetUrl);
      return json;
    });

    if (paymentProductId === PP_APPLE_PAY && this.paymentProductAvailability[paymentProductId] === undefined) {
      const available = await this.isApplePayAvailable(json.paymentProduct302SpecificData);
      this.paymentProductAvailability[paymentProductId] = available;
      console.debug(`Apple Pay is available: ${available}`);
      if (available) {
        return toPaymentProduct(json);
      }
      throw productNotFoundError();
    }
    if (paymentProductId === PP_GOOGLE_PAY && this.paymentProductAvailability[paymentProductId] === undefined) {
      const available = await this.isGooglePayAvailable(json.paymentProduct320SpecificData);
      this.paymentProductAvailability[paymentProductId] = available;
      console.debug(`Google Pay is available: ${available}`);
      if (available) {
        return toPaymentProduct(json);
      }
      throw productNotFoundError();
    }

    if (this.paymentProductAvailability[paymentProductId] === false) {
      throw productNotFoundError();
    }

    return toPaymentProduct(json);
  }

  /**
   * Retrieves the directory for a payment product.
   * @param paymentProductId The ID of the payment product.
   * @returns A promise containing the directory for the payment product.
   */
  async getPaymentProductDirectory(paymentProductId: number): Promise<Directory> {
    const params: api.DirectoryParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
    };
    const cacheKey = constructCacheKey(`Directory:${paymentProductId}`, params.countryCode, params.currencyCode);
    return getValue(this.cache, cacheKey, () => this.communicator.getPaymentProductDirectory(paymentProductId, params));
  }

  /**
   * Retrieves customer details for a payment product.
   * @param paymentProductId The ID of the payment product.
   * @param request The customer details request containing the country code and field values.
   * @returns A promise containing the customer detauls result.
   */
  async getCustomerDetails(paymentProductId: number, request: CustomerDetailsRequest): Promise<CustomerDetailsResult> {
    const cacheKey = constructCacheKeyWithValues(`CustomerDetails:${paymentProductId}`, [request.countryCode], request.values);
    return getValue(this.cache, cacheKey, () => this.communicator.getCustomerDetails(paymentProductId, request));
  }

  /**
   * Retrieves a session specific JavaScript snippet for device fingerprinting for a payment product.
   * @param paymentProductGroupId The ID of the payment product.
   * @param request The device fingerprint request to use.
   * @returns A promise containing the device fingerprint result.
   */
  async getPaymentProductDeviceFingerprint(paymentProductId: number, request: DeviceFingerprintRequest): Promise<DeviceFingerprintResult> {
    // Don't cache, always return the latest result
    return this.communicator.getPaymentProductDeviceFingerprint(paymentProductId, request);
  }

  /**
   * Retrieves the networks for a payment product.
   * @param paymentProductId The ID of the payment product.
   * @returns A promise containing the networks for the payment product.
   */
  async getPaymentProductNetworks(paymentProductId: number): Promise<PaymentProductNetworks> {
    const params: api.PaymentProductNetworksParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
      amount: this.paymentContext.amountOfMoney.amount,
      isRecurring: this.paymentContext.isRecurring,
    };
    const cacheKey = constructCacheKey(
      `PaymentProductNetworks:${paymentProductId}`,
      params.countryCode,
      params.currencyCode,
      params.amount,
      params.isRecurring
    );
    return getValue(this.cache, cacheKey, () => this.communicator.getPaymentProductNetworks(paymentProductId, params));
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
    const json = await this.communicator.createPaymentProductSession(PP_APPLE_PAY, {
      paymentProductSession302SpecificInput: applePaySpecificInput,
    });
    if (!json.paymentProductSession302SpecificOutput) {
      throw new Error("no paymentProductSession302SpecificOutput returned");
    }
    return json.paymentProductSession302SpecificOutput;
  }

  /**
   * Converts an amount from one currency to another.
   * @param amount The amount to convert.
   * @param source The source currency.
   * @param target The target currency.
   * @returns A promise containing the convert amount result.
   */
  async convertAmount(amount: number, source: string, target: string): Promise<ConvertAmountResult> {
    const params: api.ConvertAmountParams = {
      source,
      target,
      amount,
    };
    const cacheKey = constructCacheKey("ConvertAmount", amount, source, target);
    return getValue(this.cache, cacheKey, () => this.communicator.convertAmount(params));
  }

  /**
   * Retrieves IIN details for a (partial) credit card number.
   * There can be three possible outcomes:
   * * status === "SUPPORTED": the card number is recognized and supported for the current payment context.\
   *   The result will contain the payment product ID and if available the cobrands.
   * * status === "UNSUPPORTED": the card number is recognized but not supported for the current payment context.\
   *   The result will contain the payment product ID and if available the cobrands.
   * * status === "UKNOWN": the card number is not recognized.\
   *   The result will not contain a payment product ID or any cobrands, but instead the error response returned by the Ingenico Connect Client API.
   * @param partialCreditCardNumber The (partial) credit card number. Only its first 6 or 8 characters will be used.
   * @returns A promise containing the IIN details result.
   * @throws If the given partial credit card number does not have at least 6 digits.
   */
  async getIINDetails(partialCreditCardNumber: string): Promise<IINDetailsResult> {
    partialCreditCardNumber = partialCreditCardNumber.replace(/\s/g, "");
    if (partialCreditCardNumber.length < 6) {
      throw new Error("not enough digits");
    }
    const paymentContext: api.PaymentContext = {
      amountOfMoney: this.paymentContext.amountOfMoney,
      countryCode: this.paymentContext.countryCode,
    };
    if (this.paymentContext.isInstallments !== undefined) {
      paymentContext.isInstallments = this.paymentContext.isInstallments;
    }
    if (this.paymentContext.isRecurring !== undefined) {
      paymentContext.isRecurring = this.paymentContext.isRecurring;
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
    const json = await getValue(this.cache, cacheKey, () => this.communicator.getIINDetails(request));
    if (json.status === "UNKNOWN") {
      return json;
    }
    let status: IINDetailsSuccessStatus;
    if (json.status) {
      status = json.status;
    } else {
      // This should not happen because a payment context is always provided. Query the product anyway.
      try {
        await this.getPaymentProduct(json.paymentProductId);
        status = "SUPPORTED";
      } catch (e) {
        status = "UNSUPPORTED";
      }
    }
    return Object.assign(json, { status });
  }

  /**
   * Retrieves the privacy policy for a specific or all payment products.
   * This method will use the locale from the current payment context.
   * @param paymentProductId The optional ID of a specific payment product.
   * @returns A promise containing the privacy policy.
   */
  async getPrivacyPolicy(paymentProductId?: number): Promise<PrivacyPolicyResult> {
    const params: api.GetPrivacyPolicyParams = {
      locale: this.paymentContext.locale,
      paymentProductId,
    };
    const cacheKey = constructCacheKey("PrivacyPolicy:", paymentProductId, params.locale);
    return getValue(this.cache, cacheKey, () => this.communicator.getPrivacyPolicy(params));
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
    if (applePayProduct.id !== PP_APPLE_PAY || !applePayProduct.paymentProduct302SpecificData) {
      throw new Error("Not a valid Apple Pay product: " + JSON.stringify(applePayProduct));
    }
    const client = await this.getApplePayClient(applePayProduct.paymentProduct302SpecificData);
    if (!client) {
      throw new Error("Apple Pay is not available");
    }
    return {
      createPayment: () => client.createPayment((input) => this.createApplePaySession(input)),
    };
  }

  private async getApplePayClient(applePaySpecificData?: PaymentProduct302SpecificData): Promise<ApplePayClient | undefined> {
    const applePaySpecificInput = this.paymentContext.paymentProductSpecificInputs?.applePay;
    if (!applePaySpecificInput || !applePaySpecificData) {
      return undefined;
    }
    // Don't include applePaySpecificInput or the payment context in the cache key
    // When the payment context is updated the ApplePayClient cache entries are cleared
    const cacheKey = constructCacheKey("ApplePayClient", applePaySpecificData.networks);
    return getValue(this.cache, cacheKey, () => this.device.getApplePayClient(applePaySpecificInput, applePaySpecificData, this.paymentContext));
  }

  private async isApplePayAvailable(applePaySpecificData?: PaymentProduct302SpecificData): Promise<boolean> {
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
    if (googlePayProduct.id !== PP_GOOGLE_PAY || !googlePayProduct.paymentProduct320SpecificData) {
      throw new Error("Not a valid Google Pay product: " + JSON.stringify(googlePayProduct));
    }
    const client = await this.getGooglePayClient(googlePayProduct.paymentProduct320SpecificData);
    if (!client) {
      throw new Error("Google Pay is not available");
    }
    return {
      createButton: (options) => client.createButton(options),
      prefetchPaymentData: () => client.prefetchPaymentData(),
      createPayment: () => client.createPayment(),
    };
  }

  private async getGooglePayClient(googlePaySpecificData?: PaymentProduct320SpecificData): Promise<GooglePayClient | undefined> {
    const googlePaySpecificInput = this.paymentContext.paymentProductSpecificInputs?.googlePay;
    if (!googlePaySpecificInput || !googlePaySpecificData) {
      return undefined;
    }
    // Don't include googlePaySpecificInput or the payment context in the cache key
    // When the payment context is updated the GooglePayClient cache entries are cleared
    const cacheKey = constructCacheKey("GooglePayClient", googlePaySpecificData.gateway, googlePaySpecificData.networks);
    return getValue(this.cache, cacheKey, () => this.device.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, this.paymentContext));
  }

  private async isGooglePayAvailable(googlePaySpecificData?: PaymentProduct320SpecificData): Promise<boolean> {
    return this.getGooglePayClient(googlePaySpecificData)
      .then((client) => !!client)
      .catch((reason) => {
        console.error("Google Pay is not available", reason);
        return false;
      });
  }
}

Object.freeze(Session.prototype);
