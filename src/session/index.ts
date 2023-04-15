import { v4 as uuidv4 } from "uuid";
import { Communicator } from "../communicator";
import { api } from "../communicator/model";
import { Encryptor } from "../crypto/Encryptor";
import { HttpResponse } from "../http";
import {
  ApplePayClient,
  BasicPaymentItems,
  BasicPaymentProductGroups,
  BasicPaymentProducts,
  ConvertAmountResult,
  CustomerDetailsRequest,
  CustomerDetailsResult,
  Device,
  DeviceFingerprintRequest,
  DeviceFingerprintResult,
  Directory,
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
  PrivacyPolicyResult,
  PublicKey,
  SessionDetails,
  ThirdPartyStatus,
} from "../model";
import { toBasicPaymentItems } from "../model/PaymentItem";
import { PP_APPLE_PAY, PP_BANCONTACT, PP_GOOGLE_PAY, toBasicPaymentProducts, toPaymentProduct } from "../model/PaymentProduct";
import { toBasicPaymentProductGroups, toPaymentProductGroup } from "../model/PaymentProductGroup";

function constructCacheKey(base: string, ...params: unknown[]): string {
  return base + ":" + params.map((value) => `<${value}>`).join(";");
}

function constructCacheKeyWithValues(base: string, params: unknown[], values: KeyValuePair[]): string {
  return base + ":" + params.map((value) => `<${value}`).join(";") + "values:" + values.map((value) => `${value.key}=${value.value}`).join(";");
}

async function getValue<T>(cache: Record<string, unknown>, key: string, valueSupplier: () => Promise<T>): Promise<T> {
  const existing = cache[key];
  if (existing) {
    return existing as T;
  }
  const value = await valueSupplier();
  cache[key] = value;
  return value;
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
      errorId: uuidv4(),
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

export class Session {
  private readonly communicator: Communicator;
  private readonly responseCache: Record<string, unknown> = {};
  private providedPaymentItem?: PaymentItem;
  private paymentProductAvailability: Record<number, boolean | undefined> = {};
  private applePayClient?: Promise<ApplePayClient | undefined>;
  private googlePayClient?: Promise<GooglePayClient | undefined>;

  constructor(private readonly sessionDetails: SessionDetails, private paymentContext: PaymentContext, private readonly device: Device) {
    this.communicator = new Communicator(sessionDetails, device);
  }

  getPaymentContext(): PaymentContext {
    return this.paymentContext;
  }

  updatePaymentContext(paymentContext: Partial<PaymentContext>): Session {
    this.paymentContext = Object.assign({}, this.paymentContext, paymentContext);
    // Invalidate the Apple Pay and Google Pay clients
    this.applePayClient = undefined;
    this.googlePayClient = undefined;
    // Invalide the Apple Pay and Google Pay availability
    delete this.paymentProductAvailability[PP_APPLE_PAY];
    delete this.paymentProductAvailability[PP_GOOGLE_PAY];
    return this;
  }

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

  async getEncryptor(): Promise<Encryptor> {
    const publicKey = await this.getPublicKey();
    return new Encryptor(this.sessionDetails.clientSessionId, publicKey, this.device);
  }

  async getPublicKey(): Promise<PublicKey> {
    const cacheKey = "PublicKey";
    return getValue(this.responseCache, cacheKey, () => this.communicator.getPublicKey());
  }

  async getThirdPartyStatus(paymentId: string): Promise<ThirdPartyStatus> {
    // Don't cache, always return the latest result
    return this.communicator.getThirdPartyStatus(paymentId);
  }

  async getBasicPaymentItems(useGroups: boolean): Promise<BasicPaymentItems> {
    if (useGroups) {
      const [products, groups] = await Promise.all([this.getBasicPaymentProducts(), this.getBasicPaymentProductGroups()]);
      return toBasicPaymentItems(products, groups);
    }
    const products = await this.getBasicPaymentProducts();
    return toBasicPaymentItems(products);
  }

  async getBasicPaymentProductGroups(): Promise<BasicPaymentProductGroups> {
    const params: api.PaymentProductGroupsParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
      locale: this.paymentContext.locale,
      amount: this.paymentContext.amountOfMoney.amount,
      isRecurring: this.paymentContext.isRecurring,
      hide: ["fields"],
    };
    const cacheKey = constructCacheKey("BasicPaymentProductGroups", params.countryCode, params.currencyCode, params.locale, params.amount, params.isRecurring);
    const json = await getValue(this.responseCache, cacheKey, async () => {
      const json = await this.communicator.getPaymentProductGroups(params);
      updateItems(json.paymentProductGroups, this.sessionDetails.assetUrl);
      return json;
    });
    return toBasicPaymentProductGroups(json);
  }

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
    const cacheKey = constructCacheKey(`PaymentProductGroup:${paymentProductGroupId}`, params.countryCode, params.currencyCode, params.locale, params.amount, params.isRecurring);
    const json = await getValue(this.responseCache, cacheKey, async () => {
      const json = await this.communicator.getPaymentProductGroup(paymentProductGroupId, params);
      updateItem(json, this.sessionDetails.assetUrl);
      return json;
    });
    return toPaymentProductGroup(json);
  }

  async getPaymentProductGroupDeviceFingerprint(paymentProductGroupId: string, request: DeviceFingerprintRequest): Promise<DeviceFingerprintResult> {
    // Don't cache, always return the latest result
    return this.communicator.getPaymentProductGroupDeviceFingerprint(paymentProductGroupId, request);
  }

  async getBasicPaymentProducts(): Promise<BasicPaymentProducts> {
    const params: api.PaymentProductsParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
      locale: this.paymentContext.locale,
      amount: this.paymentContext.amountOfMoney.amount,
      isRecurring: this.paymentContext.isRecurring,
      hide: ["fields"],
    };
    const cacheKey = constructCacheKey("BasicPaymentProducts", params.countryCode, params.currencyCode, params.locale, params.amount, params.isRecurring);
    const json = await getValue(this.responseCache, cacheKey, async () => {
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
    const json = await getValue(this.responseCache, cacheKey, async () => {
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

  async getPaymentProductDirectory(paymentProductId: number): Promise<Directory> {
    const params: api.DirectoryParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
    };
    const cacheKey = constructCacheKey(`Directory:${paymentProductId}`, params.countryCode, params.currencyCode);
    return getValue(this.responseCache, cacheKey, () => this.communicator.getPaymentProductDirectory(paymentProductId, params));
  }

  async getCustomerDetails(paymentProductId: number, request: CustomerDetailsRequest): Promise<CustomerDetailsResult> {
    const cacheKey = constructCacheKeyWithValues(`CustomerDetails:${paymentProductId}`, [request.countryCode], request.values);
    return getValue(this.responseCache, cacheKey, () => this.communicator.getCustomerDetails(paymentProductId, request));
  }

  async getPaymentProductDeviceFingerprint(paymentProductId: number, request: DeviceFingerprintRequest): Promise<DeviceFingerprintResult> {
    // Don't cache, always return the latest result
    return this.communicator.getPaymentProductDeviceFingerprint(paymentProductId, request);
  }

  async getPaymentProductNetworks(paymentProductId: number): Promise<PaymentProductNetworks> {
    const params: api.PaymentProductNetworksParams = {
      countryCode: this.paymentContext.countryCode,
      currencyCode: this.paymentContext.amountOfMoney.currencyCode,
      amount: this.paymentContext.amountOfMoney.amount,
      isRecurring: this.paymentContext.isRecurring,
    };
    const cacheKey = constructCacheKey(`PaymentProductNetworks:${paymentProductId}`, params.countryCode, params.currencyCode, params.amount, params.isRecurring);
    return getValue(this.responseCache, cacheKey, () => this.communicator.getPaymentProductNetworks(paymentProductId, params));
  }

  async createApplePaySession(applePaySpecificInput: MobilePaymentProductSession302SpecificInput): Promise<MobilePaymentProductSession302SpecificOutput> {
    // Don't cache, always return the latest result
    const json = await this.communicator.createPaymentProductSession(PP_APPLE_PAY, {
      paymentProductSession302SpecificInput: applePaySpecificInput,
    });
    if (!json.paymentProductSession302SpecificOutput) {
      throw new Error("no paymentProductSession302SpecificOutput returned");
    }
    return json.paymentProductSession302SpecificOutput;
  }

  async convertAmount(amount: number, source: string, target: string): Promise<ConvertAmountResult> {
    const params: api.ConvertAmountParams = {
      source,
      target,
      amount,
    };
    const cacheKey = constructCacheKey("ConvertAmount", amount, source, target);
    return getValue(this.responseCache, cacheKey, () => this.communicator.convertAmount(params));
  }

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
    const json = await getValue(this.responseCache, cacheKey, () => this.communicator.getIINDetails(request));
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

  async getPrivacyPolicy(paymentProductId?: number): Promise<PrivacyPolicyResult> {
    const params: api.GetPrivacyPolicyParams = {
      locale: this.paymentContext.locale,
      paymentProductId,
    };
    const cacheKey = constructCacheKey("PrivacyPolicy:", paymentProductId, params.locale);
    return getValue(this.responseCache, cacheKey, () => this.communicator.getPrivacyPolicy(params));
  }

  async createApplePayPayment(applePaySpecificData: PaymentProduct302SpecificData): Promise<ApplePayJS.ApplePayPaymentToken> {
    const client = await this.getApplePayClient(applePaySpecificData);
    if (!client) {
      throw new Error("Apple Pay client is not available");
    }
    return client.createPayment((input) => this.createApplePaySession(input));
  }

  private async getApplePayClient(applePaySpecificData?: PaymentProduct302SpecificData): Promise<ApplePayClient | undefined> {
    if (!this.applePayClient) {
      const applePaySpecificInput = this.paymentContext.paymentProductSpecificInputs?.applePay;
      if (!applePaySpecificInput || !applePaySpecificData) {
        return undefined;
      }
      this.applePayClient = this.device.getApplePayClient(applePaySpecificInput, applePaySpecificData, this.paymentContext);
    }
    return this.applePayClient;
  }

  private async isApplePayAvailable(applePaySpecificData?: PaymentProduct302SpecificData): Promise<boolean> {
    return this.getApplePayClient(applePaySpecificData)
      .then((client) => !!client)
      .catch((reason) => {
        console.error("Apple Pay is not available", reason);
        return false;
      });
  }

  async prefetchGooglePayPaymentData(googlePaySpecificData: PaymentProduct320SpecificData): Promise<void> {
    const client = await this.getGooglePayClient(googlePaySpecificData);
    if (!client) {
      throw new Error("Google Pay client is not available");
    }
    return client.prefetchPaymentData();
  }

  async createGooglePayPayment(googlePaySpecificData: PaymentProduct320SpecificData): Promise<google.payments.api.PaymentData> {
    const client = await this.getGooglePayClient(googlePaySpecificData);
    if (!client) {
      throw new Error("Google Pay client is not available");
    }
    return client.createPayment();
  }

  private async getGooglePayClient(googlePaySpecificData?: PaymentProduct320SpecificData): Promise<GooglePayClient | undefined> {
    if (!this.googlePayClient) {
      const googlePaySpecificInput = this.paymentContext.paymentProductSpecificInputs?.googlePay;
      if (!googlePaySpecificInput || !googlePaySpecificData) {
        return undefined;
      }
      this.googlePayClient = this.device.getGooglePayClient(googlePaySpecificInput, googlePaySpecificData, this.paymentContext);
    }
    return this.googlePayClient;
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
