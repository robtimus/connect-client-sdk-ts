/**
 * Definition of types used by the Ingenico Connect Client API.
 * @module
 */

// Crypto

export interface PublicKey {
  keyId: string;
  publicKey: string;
}

// Payments

export interface ThirdPartyStatusResponse {
  thirdPartyStatus: string;
}

// Products / Product Groups

export interface AccountOnFile {
  attributes: AccountOnFileAttribute[];
  displayHints: AccountOnFileDisplayHints;
  id: number;
  paymentProductId: number;
}

export interface AccountOnFileAttribute extends KeyValuePair {
  mustWriteReason?: string;
  status: string;
}

export interface AccountOnFileDisplayHints {
  labelTemplate: LabelTemplateElement[];
  logo: string;
}

export interface AuthenticationIndicator {
  name: string;
  value: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface LabelTemplateElement {
  attributeKey: string;
  mask?: string;
}

export interface PaymentProduct {
  accountsOnFile?: AccountOnFile[];
  acquirerCountry?: string;
  allowsInstallments: boolean;
  allowsRecurring: boolean;
  allowsTokenization: boolean;
  authenticationIndicator?: AuthenticationIndicator;
  autoTokenized: boolean;
  canBeIframed?: boolean;
  deviceFingerprintEnabled: boolean;
  displayHints: PaymentProductDisplayHints;
  fields?: PaymentProductField[];
  fieldsWarning?: string;
  id: number;
  isJavaScriptRequired?: boolean;
  maxAmount?: number;
  minAmount?: number;
  mobileIntegrationLevel: string;
  paymentMethod: string;
  paymentProduct302SpecificData?: PaymentProduct302SpecificData;
  paymentProduct320SpecificData?: PaymentProduct320SpecificData;
  paymentProduct863SpecificData?: PaymentProduct863SpecificData;
  paymentProductGroup?: string;
  supportsMandates?: boolean;
  usesRedirectionTo3rdParty: boolean;
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
  paymentProducts: PaymentProduct[];
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
  networks: string[];
}

export interface PaymentProduct320SpecificData {
  gateway: string;
  networks: string[];
}

export interface PaymentProduct863SpecificData {
  integrationTypes: string[];
}

export interface PaymentProductDisplayHints {
  displayOrder: number;
  label?: string;
  logo: string;
}

export interface PaymentProductField {
  dataRestrictions: PaymentProductFieldDataRestrictions;
  displayHints?: PaymentProductFieldDisplayHints;
  id: string;
  type: string;
  usedForLookup?: boolean;
}

export interface PaymentProductFieldDataRestrictions {
  isRequired: boolean;
  validators: PaymentProductFieldValidators;
}

export interface PaymentProductFieldDisplayElement {
  id: string;
  label?: string;
  type: string;
  value: string;
}

export interface PaymentProductFieldDisplayHints {
  alwaysShow: boolean;
  displayOrder: number;
  formElement: PaymentProductFieldFormElement;
  label?: string;
  link?: string;
  mask?: string;
  obfuscate: boolean;
  placeholderLabel?: string;
  preferredInputType?: string;
  tooltip?: PaymentProductFieldTooltip;
}

export interface PaymentProductFieldFormElement {
  type: string;
  valueMapping?: ValueMappingElement[];
}

export interface PaymentProductFieldTooltip {
  image: string;
  label?: string;
}

export interface PaymentProductFieldValidators {
  boletoBancarioRequiredness?: BoletoBancarioRequirednessValidator;
  emailAddress?: EmptyValidator;
  expirationDate?: EmptyValidator;
  fixedList?: FixedListValidator;
  iban?: EmptyValidator;
  length?: LengthValidator;
  luhn?: EmptyValidator;
  range?: RangeValidator;
  regularExpression?: RegularExpressionValidator;
  residentIdNumber?: EmptyValidator;
  termsAndConditions?: EmptyValidator;
}

export interface PaymentProductGroup {
  accountsOnFile?: AccountOnFile[];
  allowsInstallments: boolean;
  deviceFingerprintEnabled: boolean;
  displayHints: PaymentProductDisplayHints;
  fields?: PaymentProductField[];
  id: string;
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
  paymentProductGroups: PaymentProductGroup[];
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
  displayElements: PaymentProductFieldDisplayElement[];
  displayName?: string;
  value: string;
}

// Products / Product Groups - customer details

export interface GetCustomerDetailsRequest {
  countryCode: string;
  values: KeyValuePair[];
}

export interface GetCustomerDetailsResponse {
  city?: string;
  country?: string;
  emailAddress?: string;
  firstName?: string;
  fiscalNumber?: string;
  languageCode?: string;
  phoneNumber?: string;
  street?: string;
  surname?: string;
  zip?: string;
}

// Products / Product Groups - device fingerprint

export interface DeviceFingerprintRequest {
  collectorCallback?: string;
}

export interface DeviceFingerprintResponse {
  deviceFingerprintTransactionId: string;
  html: string;
}

// Products / Product Groups - directory

export interface Directory {
  entries: DirectoryEntry[];
}

export interface DirectoryEntry {
  countryNames?: string[];
  issuerId: string;
  issuerList?: string;
  issuerName: string;
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
  networks: string[];
}

// Products / Product Groups - sessions

export interface CreatePaymentProductSessionRequest {
  paymentProductSession302SpecificInput?: MobilePaymentProductSession302SpecificInput;
}

export interface CreatePaymentProductSessionResponse {
  paymentProductSession302SpecificOutput?: MobilePaymentProductSession302SpecificOutput;
}

export interface MobilePaymentProductSession302SpecificInput {
  displayName?: string;
  domainName?: string;
  validationUrl?: string;
}

export interface MobilePaymentProductSession302SpecificOutput {
  sessionObject: string;
}

// Products / Product Groups - validators

export interface BoletoBancarioRequirednessValidator {
  fiscalNumberLength: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmptyValidator {}

export interface FixedListValidator {
  allowedValues: string[];
}

export interface LengthValidator {
  minLength: number;
  maxLength: number;
}

export interface RangeValidator {
  minValue: number;
  maxValue: number;
}

export interface RegularExpressionValidator {
  regularExpression: string;
}

// Services - convert amount

export interface ConvertAmountParams {
  source: string;
  target: string;
  amount: number;
}

export interface ConvertAmountResponse {
  convertedAmount: number;
}

// Services - IIN detauls

export interface AmountOfMoney {
  amount: number;
  currencyCode: string;
}

export interface GetIINDetailsRequest {
  bin: string;
  paymentContext?: PaymentContext;
}

export interface GetIINDetailsResponse {
  coBrands?: IINDetail[];
  countryCode: string;
  isAllowedInContext?: boolean;
  paymentProductId: number;
}

export interface IINDetail {
  isAllowedInContext: boolean;
  paymentProductId: number;
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
  htmlContent: string;
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
