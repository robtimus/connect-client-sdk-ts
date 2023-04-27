import { HttpClient } from "../http";
import { ValidatableRequest, ValidationError, ValidationResult, ValidationRule } from "../validation";

// General

/**
 * An interface describing the current device. This could be a browser or a native device.
 */
export interface Device {
  /**
   * @returns A string representing the platform and/or device.
   */
  getPlatformIdentifier(): string;
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
   * @param applePaySpecificData Apple Pay specific data, as retrieved by the Ingenico Connect Client API.
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
   * @param googlePaySpecificData Google Pay specific data, as retrieved by the Ingenico Connect Client API.
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
 * The context for the current payment.
 */
export interface PaymentContext {
  /**
   * The amount of money to pay.
   */
  readonly amountOfMoney: AmountOfMoney;
  /**
   * The client's country code.
   */
  readonly countryCode: string;
  /**
   * The locale to use, e.g. "en" or "en-GB".
   */
  readonly locale?: string;
  /**
   * Whether or not the payment is to be paid in multiple installments.
   */
  readonly isInstallments?: boolean;
  /**
   * Whether or not the payment is recurring.
   */
  readonly isRecurring?: boolean;
  /**
   * Whether or not the application is running in a production environment.
   * If not explicitly set to true, some functionality may run in test-mode.
   */
  readonly production?: boolean;
  /**
   * Inputs specific for certain payment products.
   */
  readonly paymentProductSpecificInputs?: PaymentProductSpecificInputs;
}

/**
 * Details about the current client session.
 * Can be provided as the response of an Ingenico Connect Server API create session call.
 */
export interface SessionDetails {
  readonly clientSessionId: string;
  readonly assetUrl: string;
  readonly clientApiUrl: string;
  readonly customerId: string;
}

// Payment product specific clients

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

// Payment product specific inputs

export interface PaymentProductSpecificInputs {
  readonly bancontact?: BancontactSpecificInput;
  readonly applePay?: ApplePaySpecificInput;
  readonly googlePay?: GooglePaySpecificInput;
}

export interface BancontactSpecificInput {
  /**
   * A boolean that indicates if you want to force the response to return the fields of the basic flow.
   */
  readonly forceBasicFlow: boolean;
}

export interface ApplePaySpecificInput {
  /**
   * Your merchant name in a human readable form. Used as input for creating Apple Pay merchant sessions.
   */
  readonly merchantName: string;
  /**
   * A short, localized description of the line item. Used for Apple Pay payment requests, and defaults to the {@link merchantName}.
   */
  readonly lineItem?: string;
  /**
   * Your two-letter ISO 3166 country code. Used for Apple Pay payment requests, and defaults to the {@link PaymentContext}'s country code.
   */
  readonly acquirerCountry?: string;
}

export interface GooglePaySpecificInput {
  /**
   * The ID of the merchant account with Google Pay. Used for Google Pay payment requests.
   */
  readonly merchantId: string;
  /**
   * Your Google Pay gateway merchant ID. Used for Google Pay payment requests.
   */
  readonly gatewayMerchantId: string;
  /**
   * Your user visible merchant name. Used for Google Pay payment requests.
   * If not set, the Business name in your Google Pay Developer Profile will be used.
   */
  readonly merchantName?: string;
  /**
   * Your two-letter ISO 3166 country code. Used for Google Pay payment requests, and defaults to the {@link PaymentContext}'s country code.
   */
  readonly acquirerCountry?: string;
}

// Crypto

export interface PublicKey {
  readonly keyId: string;
  readonly publicKey: string;
}

// Payments

export interface ThirdPartyStatus {
  readonly thirdPartyStatus: string;
}

// Products / Product Groups

export interface AccountOnFile {
  readonly attributes: AccountOnFileAttribute[];
  readonly displayHints: AccountOnFileDisplayHints;
  readonly id: number;
  readonly paymentProductId: number;
  /**
   * Finds an attribute based on key.
   * @param key The key of the attribute to look for.
   * @returns The matching attribute, or undefined if there is no such attribute.
   */
  findAttribute(key: string): AccountOnFileAttribute | undefined;
  /**
   * Finds an attribute based on key.
   * @param key The key of the attribute to look for.
   * @returns The matching attribute.
   * @throws If there is no such attribute.
   */
  getAttribute(key: string): AccountOnFileAttribute;
  /**
   * Finds an attribute value with masking applied.
   * @param attributeKey The key of the attribute value to look for.
   * @returns The masked value for the attribute, or undefined if there is no such attribute, or the attribute has no label template with a mask.
   */
  findMaskedValue(attributeKey: string): MaskedString | undefined;
}

export interface AccountOnFileAttribute extends KeyValuePair {
  readonly mustWriteReason?: string;
  readonly status: string;
}

export interface AccountOnFileDisplayHints {
  readonly labelTemplate: LabelTemplateElement[];
  readonly logo: string;
  /**
   * Finds a label template attribute based on the attribute key.
   * @param key The attribute key of the label template to look for.
   * @returns The matching label template, or undefined if there is no such label template.
   */
  findLabelTemplate(attributeKey: string): LabelTemplateElement | undefined;
  /**
   * Finds a label template attribute based on the attribute key.
   * @param key The attribute key of the label template to look for.
   * @returns The matching label template.
   * @throws If there is no such label template.
   */
  getLabelTemplate(attributeKey: string): LabelTemplateElement;
}

export interface AuthenticationIndicator {
  readonly name: string;
  readonly value: string;
}

export type BasicPaymentItem = BasicPaymentProduct | BasicPaymentProductGroup;

/**
 * A container for payment products, payment product groups, and their accounts on file.
 */
export interface BasicPaymentItems {
  /**
   * The available payment items.
   */
  readonly paymentItems: BasicPaymentItem[];
  /**
   * The available accounts on file.
   */
  readonly accountsOnFile: AccountOnFile[];
  /**
   * Finds a payment item based on its ID.
   * @param id The ID of the payment item to look for.
   * @returns The matching payment item (as a product), or undefined if there is no such payment item.
   */
  findPaymentItem(id: number): BasicPaymentProduct | undefined;
  /**
   * Finds a payment item based on its ID.
   * @param id The ID of the payment item to look for.
   * @returns The matching payment item (as a group), or undefined if there is no such payment item.
   */
  findPaymentItem(id: string): BasicPaymentProductGroup | undefined;
  /**
   * Finds a payment item based on its ID.
   * @param id The ID of the payment item to look for.
   * @returns The matching payment item, or undefined if there is no such payment item.
   */
  findPaymentItem(id: number | string): BasicPaymentItem | undefined;
  /**
   * Finds a payment item based on its ID.
   * @param id The ID of the payment item to look for.
   * @returns The matching payment item (as a product).
   * @throws If there is no such payment item.
   */
  getPaymentItem(id: number): BasicPaymentProduct;
  /**
   * Finds a payment item based on its ID.
   * @param id The ID of the payment item to look for.
   * @returns The matching payment item (as a group).
   * @throws If there is no such payment item.
   */
  getPaymentItem(id: string): BasicPaymentProductGroup;
  /**
   * Finds a payment item based on its ID.
   * @param id The ID of the payment item to look for.
   * @returns The matching payment item.
   * @throws If there is no such payment item.
   */
  getPaymentItem(id: number | string): BasicPaymentItem;
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file, or undefined if there is no such account on file.
   */
  findAccountOnFile(id: number): AccountOnFile | undefined;
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file.
   * @throws If there is no such account on file.
   */
  getAccountOnFile(id: number): AccountOnFile;
}

/**
 * A payment product without its fields.
 */
export interface BasicPaymentProduct {
  readonly accountsOnFile: AccountOnFile[];
  readonly acquirerCountry?: string;
  readonly allowsInstallments: boolean;
  readonly allowsRecurring: boolean;
  readonly allowsTokenization: boolean;
  readonly authenticationIndicator?: AuthenticationIndicator;
  readonly autoTokenized: boolean;
  readonly canBeIframed?: boolean;
  readonly deviceFingerprintEnabled: boolean;
  readonly displayHints: PaymentProductDisplayHints;
  readonly id: number;
  readonly isJavaScriptRequired?: boolean;
  readonly maxAmount?: number;
  readonly minAmount?: number;
  readonly mobileIntegrationLevel: string;
  readonly paymentMethod: string;
  readonly paymentProduct302SpecificData?: PaymentProduct302SpecificData;
  readonly paymentProduct320SpecificData?: PaymentProduct320SpecificData;
  readonly paymentProduct863SpecificData?: PaymentProduct863SpecificData;
  readonly paymentProductGroup?: string;
  readonly supportsMandates?: boolean;
  readonly usesRedirectionTo3rdParty: boolean;
  /**
   * The type. This can be used to easily see if a payment item is a payment product or not.
   */
  readonly type: "product";
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file, or undefined if there is no such account on file.
   */
  findAccountOnFile(id: number): AccountOnFile | undefined;
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file.
   * @throws If there is no such account on file.
   */
  getAccountOnFile(id: number): AccountOnFile;
}

/**
 * A container for basic payment products and their accounts on file.
 */
export interface BasicPaymentProducts {
  /**
   * The available payment products.
   */
  readonly paymentProducts: BasicPaymentProduct[];
  /**
   * The available accounts on file.
   */
  readonly accountsOnFile: AccountOnFile[];
  /**
   * Finds a payment product based on its ID.
   * @param id The ID of the payment product to look for.
   * @returns The matching payment product, or undefined if there is no such payment product.
   */
  findPaymentProduct(id: number): BasicPaymentProduct | undefined;
  /**
   * Finds a payment product based on its ID.
   * @param id The ID of the payment product to look for.
   * @returns The matching payment product.
   * @throws If there is no such payment product.
   */
  getPaymentProduct(id: number): BasicPaymentProduct;
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file, or undefined if there is no such account on file.
   */
  findAccountOnFile(id: number): AccountOnFile | undefined;
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file.
   * @throws If there is no such account on file.
   */
  getAccountOnFile(id: number): AccountOnFile;
}

/**
 * A payment product group without its fields.
 */
export interface BasicPaymentProductGroup {
  readonly accountsOnFile: AccountOnFile[];
  readonly allowsInstallments: boolean;
  readonly deviceFingerprintEnabled: boolean;
  readonly displayHints: PaymentProductDisplayHints;
  readonly id: string;
  /**
   * The type. This can be used to easily see if a payment item is a payment product group or not.
   */
  readonly type: "group";
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file, or undefined if there is no such account on file.
   */
  findAccountOnFile(id: number): AccountOnFile | undefined;
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file.
   * @throws If there is no such account on file.
   */
  getAccountOnFile(id: number): AccountOnFile;
}

/**
 * A container for basic payment product groups and their accounts on file.
 */
export interface BasicPaymentProductGroups {
  /**
   * The available payment product groups.
   */
  readonly paymentProductGroups: BasicPaymentProductGroup[];
  /**
   * The available accounts on file.
   */
  readonly accountsOnFile: AccountOnFile[];
  /**
   * Finds a payment product group based on its ID.
   * @param id The ID of the payment product group to look for.
   * @returns The matching payment product group, or undefined if there is no such payment product group.
   */
  findPaymentProductGroup(id: string): BasicPaymentProductGroup | undefined;
  /**
   * Finds a payment product group based on its ID.
   * @param id The ID of the payment product group to look for.
   * @returns The matching payment product group
   * @throws If there is no such payment product group.
   */
  getPaymentProductGroup(id: string): BasicPaymentProductGroup;
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file, or undefined if there is no such account on file.
   */
  findAccountOnFile(id: number): AccountOnFile | undefined;
  /**
   * Finds an account on file based on its ID.
   * @param id The ID of the account on file to look for.
   * @returns The matching account on file.
   * @throws If there is no such account on file.
   */
  getAccountOnFile(id: number): AccountOnFile;
}

export interface KeyValuePair {
  readonly key: string;
  readonly value: string;
}

export interface LabelTemplateElement {
  readonly attributeKey: string;
  readonly mask?: string;
  /**
   * A wildcard mask for the attribute. This is similar to the mask but contains "*" instead of numbers.
   */
  readonly wildcardMask?: string;
}

export interface MaskedString {
  readonly formattedValue: string;
  readonly cursorIndex: number;
}

export type PaymentItem = PaymentProduct | PaymentProductGroup;

export interface PaymentProduct extends BasicPaymentProduct {
  readonly fields: PaymentProductField[];
  readonly fieldsWarning?: string;
  /**
   * Finds a field based on its ID.
   * @param id The ID of the field to look for.
   * @returns The matching field, or undefined if there is no such field.
   */
  findField(id: string): PaymentProductField | undefined;
  /**
   * Finds a field based on its ID.
   * @param id The ID of the field to look for.
   * @returns The matching field.
   * @throws If there is no such field.
   */
  getField(id: string): PaymentProductField;
}

export interface PaymentProduct302SpecificData {
  readonly networks: string[];
}

export interface PaymentProduct320SpecificData {
  readonly gateway: string;
  readonly networks: string[];
}

export interface PaymentProduct863SpecificData {
  readonly integrationTypes: string[];
}

export interface PaymentProductDisplayHints {
  readonly displayOrder: number;
  readonly label?: string;
  readonly logo: string;
}

export interface PaymentProductField {
  readonly dataRestrictions: PaymentProductFieldDataRestrictions;
  readonly displayHints?: PaymentProductFieldDisplayHints;
  readonly id: string;
  readonly type: string;
  readonly usedForLookup?: boolean;
  /**
   * The type of field, usable in an HTML input element.
   */
  readonly inputType: string;
  /**
   * If available, applies this field's mask to a value.
   * @param newValue The value to apply this field's mask to.
   * @param oldValue An optional existing value for this field; used to determine the cursor index.
   * @returns The result of applying the mask.
   */
  applyMask(newValue: string, oldValue?: string): MaskedString;
  /**
   * If available, applies this field's wildcard mask to a value.
   * @param newValue The value to apply this field's wildcard mask to.
   * @param oldValue An optional existing value for this field; used to determine the cursor index.
   * @returns The result of applying the mask.
   */
  applyWildcardMask(newValue: string, oldValue?: string): MaskedString;
  /**
   * If available, removes this field's mask from a value.
   * @param value The value to remove this field's mask from.
   * @returns The result of removing the mask.
   */
  removeMask(value: string): string;
}

export interface PaymentProductFieldDataRestrictions {
  readonly isRequired: boolean;
  /**
   * The validation rules that apply for the field.
   */
  readonly validationRules: ValidationRule<unknown>[];
  /**
   * Finds a validation rule based on its type.
   * @param type The type of the validation rule to look for.
   * @returns The matching validation rule, or undefined if there is no such validation rule.
   */
  findValidationRule(type: string): ValidationRule<unknown> | undefined;
  /**
   * Finds a validation rule based on its type.
   * @param type The type of the validation rule to look for.
   * @returns The matching validation rule.
   * @throws If there is no such validation rule.
   */
  getValidationRule(type: string): ValidationRule<unknown>;
}

export interface PaymentProductFieldDisplayElement {
  readonly id: string;
  readonly label?: string;
  readonly type: string;
  readonly value: string;
}

export interface PaymentProductFieldDisplayHints {
  readonly alwaysShow: boolean;
  readonly displayOrder: number;
  readonly formElement: PaymentProductFieldFormElement;
  readonly label?: string;
  readonly link?: string;
  readonly mask?: string;
  readonly obfuscate: boolean;
  readonly placeholderLabel?: string;
  readonly preferredInputType?: string;
  readonly tooltip?: PaymentProductFieldTooltip;
  /**
   * A wildcard mask for the field. This is similar to the mask but contains "*" instead of numbers.
   */
  readonly wildcardMask?: string;
}

export interface PaymentProductFieldFormElement {
  readonly type: string;
  readonly valueMapping?: ValueMappingElement[];
}

export interface PaymentProductFieldTooltip {
  readonly image: string;
  readonly label?: string;
}

export interface PaymentProductGroup extends BasicPaymentProductGroup {
  readonly fields: PaymentProductField[];
  /**
   * Finds a field based on its ID.
   * @param id The ID of the field to look for.
   * @returns The matching field, or undefined if there is no such field.
   */
  findField(id: string): PaymentProductField | undefined;
  /**
   * Finds a field based on its ID.
   * @param id The ID of the field to look for.
   * @returns The matching field.
   * @throws If there is no such field.
   */
  getField(id: string): PaymentProductField;
}

export interface ValueMappingElement {
  readonly displayElements: PaymentProductFieldDisplayElement[];
  readonly displayName?: string;
  readonly value: string;
}

// Products / Product Groups - customer details

export interface CustomerDetailsRequest {
  readonly countryCode: string;
  readonly values: KeyValuePair[];
}

export interface CustomerDetailsResult {
  readonly city?: string;
  readonly country?: string;
  readonly emailAddress?: string;
  readonly firstName?: string;
  readonly fiscalNumber?: string;
  readonly languageCode?: string;
  readonly phoneNumber?: string;
  readonly street?: string;
  readonly surname?: string;
  readonly zip?: string;
}

// Products / Product Groups - device fingerprint

export interface DeviceFingerprintRequest {
  readonly collectorCallback: string;
}

export interface DeviceFingerprintResult {
  readonly deviceFingerprintTransactionId: string;
  readonly html: string;
}

// Products / Product Groups - directory

export interface Directory {
  readonly entries: DirectoryEntry[];
}

export interface DirectoryEntry {
  readonly countryNames?: string[];
  readonly issuerId: string;
  readonly issuerList?: string;
  readonly issuerName: string;
}

// Products / Product Groups - networks

export interface PaymentProductNetworks {
  readonly networks: string[];
}

// Products / Product Groups - sessions

export interface MobilePaymentProductSession302SpecificInput {
  readonly displayName?: string;
  readonly domainName?: string;
  readonly validationUrl?: string;
}

export interface MobilePaymentProductSession302SpecificOutput {
  readonly sessionObject: string;
}

// Services - convert amount

export interface ConvertAmountResult {
  readonly convertedAmount: number;
}

// Services - IIN detauls

export interface AmountOfMoney {
  readonly amount: number;
  readonly currencyCode: string;
}

export type IINDetailsSuccessStatus = "SUPPORTED" | "UNSUPPORTED";
/**
 * The result of an IIN details call for an existing card number.
 */
export interface IINDetailsSuccessResult {
  readonly status: IINDetailsSuccessStatus;
  readonly coBrands?: IINDetail[];
  readonly countryCode: string;
  readonly isAllowedInContext?: boolean;
  readonly paymentProductId: number;
}

export type IINDetailErrorStatus = "UNKNOWN";
/**
 * The result of an IIN details call for a non-existing card number.
 */
export interface IINDetailsErrorResult extends ErrorResponse {
  readonly status: IINDetailErrorStatus;
}

/**
 * The result of an IIN details call. The common status field can be used to determine the type of result - success or error.
 */
export type IINDetailsResult = IINDetailsSuccessResult | IINDetailsErrorResult;

export interface IINDetail {
  readonly isAllowedInContext: boolean;
  readonly paymentProductId: number;
}

// Services - privacy policy

export interface PrivacyPolicyResult {
  readonly htmlContent: string;
}

// Errors

export interface APIError {
  readonly category: string;
  readonly code: string;
  readonly httpStatusCode: number;
  readonly id: string;
  readonly message: string;
  readonly propertyName: string;
  readonly requestId: string;
}

export interface ErrorResponse {
  readonly errorId: string;
  readonly errors: APIError[];
}

// Payment request

/**
 * A container for all the values the user provided.
 */
export class PaymentRequest implements ValidatableRequest {
  private readonly fieldValues: Record<string, string | undefined> = {};
  private paymentProduct?: PaymentProduct;
  private accountOnFile?: AccountOnFile;
  private tokenize = false;

  /**
   * Returns the value for a field.
   * @param fieldId The ID of the field to retrieve the value of.
   * @returns The (unmodified) value for the field, or undefined if no such value has been set.
   */
  getValue(fieldId: string): string | undefined {
    return this.fieldValues[fieldId];
  }

  /**
   * Sets the value for a field.
   * @param fieldId The ID of the field to set the value of.
   * @param value The (unmodified) value for the field.
   */
  setValue(fieldId: string, value: string): void {
    this.fieldValues[fieldId] = value;
  }

  /**
   * Returns all values that have been set.
   * @returns An object containing all values that have been set, using the field IDs as keys.
   */
  getValues(): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const fieldId in this.fieldValues) {
      result[fieldId] = this.fieldValues[fieldId];
    }
    return result;
  }

  /**
   * Returns the value for a field, after applying the field's mask.
   * @param fieldId The ID of the field to retrieve the masked value of.
   * @returns The masked value for the field, or undefined if no such value has been set or no such field exists in the currently set payment product (if any).
   */
  getMaskedValue(fieldId: string): string | undefined {
    const field = this.paymentProduct?.findField(fieldId);
    if (!field) {
      return undefined;
    }
    const value = this.getValue(fieldId);
    if (value === undefined) {
      return undefined;
    }
    return field.applyMask(value).formattedValue;
  }

  /**
   * Returns all values that have been set, after applying the masks for the matching fields.
   * @returns An object containing all values that have been set, using the field IDs as keys and having the field's mask applied.
   */
  getMaskedValues(): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const fieldId in this.fieldValues) {
      result[fieldId] = this.getMaskedValue(fieldId);
    }
    return result;
  }

  /**
   * Returns the value for a field, after removing the field's mask.
   * @param fieldId The ID of the field to retrieve the unmasked value of.
   * @returns The unmasked value for the field, or undefined if no such value has been set or no such field exists in the currently set payment product (if any).
   */
  getUnmaskedValue(fieldId: string): string | undefined {
    const field = this.paymentProduct?.findField(fieldId);
    if (!field) {
      return undefined;
    }
    const value = this.getValue(fieldId);
    if (value === undefined) {
      return undefined;
    }
    return field.removeMask(field.applyMask(value).formattedValue);
  }

  /**
   * Returns all values that have been set, after removing the masks for the matching fields.
   * @returns An object containing all values that have been set, using the field IDs as keys and having the field's mask removed.
   */
  getUnmaskedValues(): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const fieldId in this.fieldValues) {
      result[fieldId] = this.getUnmaskedValue(fieldId);
    }
    return result;
  }

  /**
   * Returns the currently set payment product.
   */
  getPaymentProduct(): PaymentProduct | undefined {
    return this.paymentProduct;
  }

  /**
   * Sets the payment product.\
   * Because the payment product may not be known when a payment request is created (e.g. because a payment product group is used),
   * the payment product does not have to be provided upon creation but can be provided later. However, it is necessary to set the
   * payment product before querying masked and unmasked values or validating.
   */
  setPaymentProduct(paymentProduct: PaymentProduct): void {
    this.paymentProduct = paymentProduct;
  }

  /**
   * Returns the currently set account on file.
   */
  getAccountOnFile(): AccountOnFile | undefined {
    return this.accountOnFile;
  }

  /**
   * Sets or clears the account on file.
   * Any account on file attribute that does not have status "MUST_WRITE" will have its matching value in this payment request cleared.
   */
  setAccountOnFile(accountOnFile?: AccountOnFile): void {
    if (accountOnFile) {
      accountOnFile.attributes
        .filter((attribute) => attribute.status !== "MUST_WRITE")
        .forEach((attribute) => delete this.fieldValues[attribute.key]);
    }
    this.accountOnFile = accountOnFile;
  }

  /**
   * Returns whether or not payments created from this payment request should be tokenized. The default is false.
   * @returns True to tokenize payments, or false otherwise.
   */
  getTokenize(): boolean {
    return this.tokenize;
  }

  /**
   * Sets whether or not payments created from this payment request should be tokenized.
   * @param tokenize True to tokenize payments, or false otherwise.
   */
  setTokenize(tokenize: boolean): void {
    this.tokenize = tokenize;
  }

  /**
   * Validates all values against the currently set payment product.
   * @returns The validation result. If not valid, it contains the validation errors.
   * @throws If no payment product has been set yet.
   */
  validate(): ValidationResult {
    const paymentProduct = this.paymentProduct;
    if (!paymentProduct) {
      throw new Error("no PaymentProduct set");
    }
    const errors: ValidationError[] = [];
    for (const fieldId in this.fieldValues) {
      const rules = paymentProduct.findField(fieldId)?.dataRestrictions.validationRules || [];
      rules
        .filter((rule) => !rule.validate(this, fieldId))
        .forEach((rule) =>
          errors.push({
            fieldId,
            ruleId: rule.id,
          })
        );
    }

    const accountOnFile = this.accountOnFile;
    const hasValueInAof = (fieldId: string): boolean => {
      if (accountOnFile?.paymentProductId !== paymentProduct.id) {
        // the account-on-file does not belong to the payment product; ignore it
        return false;
      }
      const attribute = accountOnFile.findAttribute(fieldId);
      return !!attribute && attribute.status !== "MUST_WRITE";
    };
    for (const field of paymentProduct.fields) {
      if (field.dataRestrictions.isRequired && !this.getValue(field.id) && !hasValueInAof(field.id)) {
        errors.push({
          fieldId: field.id,
          ruleId: "required",
        });
      }
    }

    if (errors.length === 0) {
      return { valid: true };
    }
    return { valid: false, errors };
  }
}
