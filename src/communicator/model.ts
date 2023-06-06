/**
 * Definition of types used by the Worldline Connect Client API.
 * @module
 */

// Crypto

export interface PublicKey {
  readonly keyId: string;
  readonly publicKey: string;
}

// Payments

export interface ThirdPartyStatusResponse {
  readonly thirdPartyStatus: string;
}

// Products / Product Groups

export interface AccountOnFile {
  readonly attributes: AccountOnFileAttribute[];
  readonly displayHints: AccountOnFileDisplayHints;
  readonly id: number;
  readonly paymentProductId: number;
}

export interface AccountOnFileAttribute extends KeyValuePair {
  readonly mustWriteReason?: string;
  readonly status: string;
}

export interface AccountOnFileDisplayHints {
  readonly labelTemplate: LabelTemplateElement[];
  readonly logo: string;
}

export interface AuthenticationIndicator {
  readonly name: string;
  readonly value: string;
}

export interface KeyValuePair {
  readonly key: string;
  readonly value: string;
}

export interface LabelTemplateElement {
  readonly attributeKey: string;
  readonly mask?: string;
}

export interface PaymentProduct {
  readonly accountsOnFile?: AccountOnFile[];
  readonly acquirerCountry?: string;
  readonly allowsInstallments: boolean;
  readonly allowsRecurring: boolean;
  readonly allowsTokenization: boolean;
  readonly authenticationIndicator?: AuthenticationIndicator;
  readonly autoTokenized: boolean;
  readonly canBeIframed?: boolean;
  readonly deviceFingerprintEnabled: boolean;
  readonly displayHints: PaymentProductDisplayHints;
  readonly fields?: PaymentProductField[];
  readonly fieldsWarning?: string;
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
}

export interface PaymentProductParams {
  countryCode: string;
  currencyCode: string;
  locale?: string;
  amount?: number;
  isRecurring?: boolean;
  hide?: string[];
  forceBasicFlow?: boolean;
}

export interface PaymentProducts {
  readonly paymentProducts: PaymentProduct[];
}

export interface PaymentProductsParams {
  countryCode: string;
  currencyCode: string;
  locale?: string;
  amount?: number;
  isRecurring?: boolean;
  hide?: string[];
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
}

export interface PaymentProductFieldDataRestrictions {
  readonly isRequired: boolean;
  readonly validators: PaymentProductFieldValidators;
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
}

export interface PaymentProductFieldFormElement {
  readonly type: string;
  readonly valueMapping?: ValueMappingElement[];
}

export interface PaymentProductFieldTooltip {
  readonly image: string;
  readonly label?: string;
}

export interface PaymentProductFieldValidators {
  readonly boletoBancarioRequiredness?: BoletoBancarioRequirednessValidator;
  readonly emailAddress?: EmptyValidator;
  readonly expirationDate?: EmptyValidator;
  readonly fixedList?: FixedListValidator;
  readonly iban?: EmptyValidator;
  readonly length?: LengthValidator;
  readonly luhn?: EmptyValidator;
  readonly range?: RangeValidator;
  readonly regularExpression?: RegularExpressionValidator;
  readonly residentIdNumber?: EmptyValidator;
  readonly termsAndConditions?: EmptyValidator;
}

export interface PaymentProductGroup {
  readonly accountsOnFile?: AccountOnFile[];
  readonly allowsInstallments: boolean;
  readonly deviceFingerprintEnabled: boolean;
  readonly displayHints: PaymentProductDisplayHints;
  readonly fields?: PaymentProductField[];
  readonly id: string;
}

export interface PaymentProductGroupParams {
  countryCode: string;
  currencyCode: string;
  locale?: string;
  amount?: number;
  isRecurring?: boolean;
  hide?: string[];
}

export interface PaymentProductGroups {
  readonly paymentProductGroups: PaymentProductGroup[];
}

export interface PaymentProductGroupsParams {
  countryCode: string;
  currencyCode: string;
  locale?: string;
  amount?: number;
  isRecurring?: boolean;
  hide?: string[];
}

export interface ValueMappingElement {
  readonly displayElements: PaymentProductFieldDisplayElement[];
  readonly displayName?: string;
  readonly value: string;
}

// Products / Product Groups - customer details

export interface GetCustomerDetailsRequest {
  countryCode: string;
  values: KeyValuePair[];
}

export interface GetCustomerDetailsResponse {
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
  collectorCallback?: string;
}

export interface DeviceFingerprintResponse {
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

export interface DirectoryParams {
  countryCode: string;
  currencyCode: string;
}

// Products / Product Groups - networks

export interface PaymentProductNetworksParams {
  countryCode: string;
  currencyCode: string;
  amount?: number;
  isRecurring?: boolean;
}

export interface PaymentProductNetworksResponse {
  readonly networks: string[];
}

// Products / Product Groups - sessions

export interface CreatePaymentProductSessionRequest {
  paymentProductSession302SpecificInput?: MobilePaymentProductSession302SpecificInput;
}

export interface CreatePaymentProductSessionResponse {
  readonly paymentProductSession302SpecificOutput?: MobilePaymentProductSession302SpecificOutput;
}

export interface MobilePaymentProductSession302SpecificInput {
  displayName?: string;
  domainName?: string;
  validationUrl?: string;
}

export interface MobilePaymentProductSession302SpecificOutput {
  readonly sessionObject: string;
}

// Products / Product Groups - validators

export interface BoletoBancarioRequirednessValidator {
  readonly fiscalNumberLength: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmptyValidator {}

export interface FixedListValidator {
  readonly allowedValues: string[];
}

export interface LengthValidator {
  readonly minLength: number;
  readonly maxLength: number;
}

export interface RangeValidator {
  readonly minValue: number;
  readonly maxValue: number;
}

export interface RegularExpressionValidator {
  readonly regularExpression: string;
}

// Services - convert amount

export interface ConvertAmountParams {
  source: string;
  target: string;
  amount: number;
}

export interface ConvertAmountResponse {
  readonly convertedAmount: number;
}

// Services - IIN detauls

export interface AmountOfMoney {
  readonly amount: number;
  readonly currencyCode: string;
}

export interface GetIINDetailsRequest {
  bin: string;
  paymentContext?: PaymentContext;
}

export interface GetIINDetailsResponse {
  readonly coBrands?: IINDetail[];
  readonly countryCode: string;
  readonly isAllowedInContext?: boolean;
  readonly paymentProductId: number;
}

export interface IINDetail {
  readonly isAllowedInContext: boolean;
  readonly paymentProductId: number;
}

export type GetIINDetailsSuccessStatus = "KNOWN";
export type GetIINDetailsSuccessResult = { status: GetIINDetailsSuccessStatus } & GetIINDetailsResponse;

export type GetIINDetailsErrorStatus = "UNKNOWN";
export type GetIINDetailsErrorResult = { status: GetIINDetailsErrorStatus } & ErrorResponse;

export type GetIINDetailsResult = GetIINDetailsSuccessResult | GetIINDetailsErrorResult;

export interface PaymentContext {
  amountOfMoney: AmountOfMoney;
  countryCode: string;
  isInstallments?: boolean;
  isRecurring?: boolean;
}

// Services - privacy policy

export interface GetPrivacyPolicyParams {
  locale?: string;
  paymentProductId?: number;
}

export interface GetPrivacyPolicyResponse {
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
