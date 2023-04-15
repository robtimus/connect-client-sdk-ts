import { JOSEEncryptor } from "../crypto";
import { HttpClient } from "../http";
import { ValidationRule } from "../validation";

// General

export interface Device {
  getPlatformIdentifier(): string;
  getDeviceInformation(): DeviceInformation;
  getHttpClient(): HttpClient;
  getJOSEEncryptor(): JOSEEncryptor | undefined;
  getApplePayClient(
    applePaySpecificInput: ApplePaySpecificInput,
    applePaySpecificData: PaymentProduct302SpecificData,
    context: PaymentContext
  ): Promise<ApplePayClient | undefined>;
  getGooglePayClient(
    googlePaySpecificInput: GooglePaySpecificInput,
    googlePaySpecificData: PaymentProduct320SpecificData,
    context: PaymentContext
  ): Promise<GooglePayClient | undefined>;
}

export interface DeviceInformation {
  readonly timezoneOffsetUtcMinutes: number;
  readonly locale: string;
  readonly javaEnabled: boolean;
  readonly colorDepth: number;
  readonly screenHeight: number;
  readonly screenWidth: number;
  readonly innerHeight: number;
  readonly innerWidth: number;
}

export interface PaymentContext {
  readonly amountOfMoney: AmountOfMoney;
  readonly countryCode: string;
  readonly locale?: string;
  readonly isInstallments?: boolean;
  readonly isRecurring?: boolean;
  readonly production?: boolean;
  readonly paymentProductSpecificInputs?: PaymentProductSpecificInputs;
}

export interface SessionDetails {
  readonly clientSessionId: string;
  readonly assetUrl: string;
  readonly clientApiUrl: string;
  readonly customerId: string;
}

// Payment product specific clients

export interface ApplePayClient {
  createPayment(
    sessionFactory: (input: MobilePaymentProductSession302SpecificInput) => Promise<MobilePaymentProductSession302SpecificOutput>
  ): Promise<ApplePayJS.ApplePayPaymentToken>;
}

export interface GooglePayClient {
  prefetchPaymentData(): Promise<void>;
  createPayment(): Promise<google.payments.api.PaymentData>;
}

// Payment product specific inputs

export interface PaymentProductSpecificInputs {
  bancontact?: BancontactSpecificInput;
  applePay?: ApplePaySpecificInput;
  googlePay?: GooglePaySpecificInput;
}

export interface BancontactSpecificInput {
  forceBasicFlow: boolean;
}

export interface ApplePaySpecificInput {
  merchantName: string;
  acquirerCountry?: string;
}

export interface GooglePaySpecificInput {
  merchantId: string;
  gatewayMerchantId: string;
  merchantName?: string;
  acquirerCountry?: string;
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
  findAttribute(key: string): AccountOnFileAttribute | undefined;
  getAttribute(key: string): AccountOnFileAttribute;
  findMaskedValue(attributeKey: string): MaskedString | undefined;
}

export interface AccountOnFileAttribute extends KeyValuePair {
  readonly mustWriteReason?: string;
  readonly status: string;
}

export interface AccountOnFileDisplayHints {
  readonly labelTemplate: LabelTemplateElement[];
  readonly logo: string;
  findLabelTemplate(attributeKey: string): LabelTemplateElement | undefined;
  getLabelTemplate(attributeKey: string): LabelTemplateElement;
}

export interface AuthenticationIndicator {
  readonly name: string;
  readonly value: string;
}

export type BasicPaymentItem = BasicPaymentProduct | BasicPaymentProductGroup;

export interface BasicPaymentItems {
  readonly paymentItems: BasicPaymentItem[];
  readonly accountsOnFile: AccountOnFile[];
  findPaymentItem(id: number | string): BasicPaymentItem | undefined;
  getPaymentItem(id: number | string): BasicPaymentItem;
  findAccountOnFile(id: number): AccountOnFile | undefined;
  getAccountOnFile(id: number): AccountOnFile;
}

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
  readonly type: "product";
  findAccountOnFile(id: number): AccountOnFile | undefined;
  getAccountOnFile(id: number): AccountOnFile;
}

export interface BasicPaymentProducts {
  readonly paymentProducts: BasicPaymentProduct[];
  readonly accountsOnFile: AccountOnFile[];
  findPaymentProduct(id: number): BasicPaymentProduct | undefined;
  getPaymentProduct(id: number): BasicPaymentProduct;
  findAccountOnFile(id: number): AccountOnFile | undefined;
  getAccountOnFile(id: number): AccountOnFile;
}

export interface BasicPaymentProductGroup {
  readonly accountsOnFile: AccountOnFile[];
  readonly allowsInstallments: boolean;
  readonly deviceFingerprintEnabled: boolean;
  readonly displayHints: PaymentProductDisplayHints;
  readonly id: string;
  readonly type: "group";
  findAccountOnFile(id: number): AccountOnFile | undefined;
  getAccountOnFile(id: number): AccountOnFile;
}

export interface BasicPaymentProductGroups {
  readonly paymentProductGroups: BasicPaymentProductGroup[];
  readonly accountsOnFile: AccountOnFile[];
  findPaymentProductGroup(id: string): BasicPaymentProductGroup | undefined;
  getPaymentProductGroup(id: string): BasicPaymentProductGroup;
  findAccountOnFile(id: number): AccountOnFile | undefined;
  getAccountOnFile(id: number): AccountOnFile;
}

export interface KeyValuePair {
  readonly key: string;
  readonly value: string;
}

export interface LabelTemplateElement {
  readonly attributeKey: string;
  readonly mask?: string;
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
  findField(id: string): PaymentProductField | undefined;
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
  applyMask(newValue: string, oldValue?: string): MaskedString;
  applyWildcardMask(newValue: string, oldValue?: string): MaskedString;
  removeMask(value: string): string;
}

export interface PaymentProductFieldDataRestrictions {
  readonly isRequired: boolean;
  readonly validationRules: ValidationRule<unknown>[];
  findValidationRule(type: string): ValidationRule<unknown> | undefined;
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
  findField(id: string): PaymentProductField | undefined;
  getField(id: string): PaymentProductField;
}

export interface ValueMappingElement {
  readonly displayElements: PaymentProductFieldDisplayElement[];
  readonly displayName?: string;
  readonly value: string;
}

// Products / Product Groups - customer details

export interface CustomerDetailsRequest {
  countryCode: string;
  values: KeyValuePair[];
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
export interface IINDetailsSuccessResult {
  readonly status: IINDetailsSuccessStatus;
  readonly coBrands?: IINDetail[];
  readonly countryCode: string;
  readonly isAllowedInContext?: boolean;
  readonly paymentProductId: number;
}

export type IINDetailErrorStatus = "UNKNOWN";
export interface IINDetailsErrorResult extends ErrorResponse {
  readonly status: IINDetailErrorStatus;
}

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
  category: string;
  code: string;
  httpStatusCode: number;
  id: string;
  message: string;
  propertyName: string;
  requestId: string;
}

export interface ErrorResponse {
  errorId: string;
  errors: APIError[];
}
