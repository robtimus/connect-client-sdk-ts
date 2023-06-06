import {
  AccountOnFile,
  AuthenticationIndicator,
  BasicPaymentProduct,
  BasicPaymentProducts,
  PaymentProduct,
  PaymentProduct302SpecificData,
  PaymentProduct320SpecificData,
  PaymentProduct863SpecificData,
  PaymentProductDisplayHints,
  PaymentProductField,
} from "..";
import * as api from "../../communicator/model";
import { toAccountOnFile } from "./AccountOnFile";
import { toPaymentProductDisplayHints } from "./PaymentProductDisplayHints";
import { toPaymentProductFields } from "./PaymentProductField";

export const PP_APPLE_PAY = 302;
export const PP_GOOGLE_PAY = 320;
export const PP_BANCONTACT = 3012;

class BasicPaymentProductImpl implements BasicPaymentProduct {
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
  readonly type = "product";

  constructor(json: api.PaymentProduct, assetUrl: string) {
    this.accountsOnFile = json.accountsOnFile ? json.accountsOnFile.map((accountOnFile) => toAccountOnFile(accountOnFile, assetUrl)) : [];
    this.acquirerCountry = json.acquirerCountry;
    this.allowsInstallments = json.allowsInstallments;
    this.allowsRecurring = json.allowsRecurring;
    this.allowsTokenization = json.allowsTokenization;
    this.autoTokenized = json.autoTokenized;
    this.authenticationIndicator = json.authenticationIndicator;
    this.canBeIframed = json.canBeIframed;
    this.deviceFingerprintEnabled = json.deviceFingerprintEnabled;
    this.displayHints = toPaymentProductDisplayHints(json.displayHints, assetUrl);
    this.id = json.id;
    this.isJavaScriptRequired = json.isJavaScriptRequired;
    this.maxAmount = json.maxAmount;
    this.minAmount = json.minAmount;
    this.mobileIntegrationLevel = json.mobileIntegrationLevel;
    this.paymentMethod = json.paymentMethod;
    this.paymentProduct302SpecificData = json.paymentProduct302SpecificData;
    this.paymentProduct320SpecificData = json.paymentProduct320SpecificData;
    this.paymentProduct863SpecificData = json.paymentProduct863SpecificData;
    this.paymentProductGroup = json.paymentProductGroup;
    this.supportsMandates = json.supportsMandates;
    this.usesRedirectionTo3rdParty = json.usesRedirectionTo3rdParty;
  }

  findAccountOnFile(id: number): AccountOnFile | undefined {
    return this.accountsOnFile.find((accountOnFile) => accountOnFile.id === id);
  }

  getAccountOnFile(id: number): AccountOnFile {
    const accountOnFile = this.findAccountOnFile(id);
    if (accountOnFile) {
      return accountOnFile;
    }
    throw new Error(`could not find AccountOnFile with id ${id}`);
  }
}

Object.freeze(BasicPaymentProductImpl.prototype);

export function toBasicPaymentProduct(json: api.PaymentProduct, assetUrl: string): BasicPaymentProduct {
  return new BasicPaymentProductImpl(json, assetUrl);
}

class BasicPaymentProductsImpl implements BasicPaymentProducts {
  readonly paymentProducts: BasicPaymentProduct[];
  readonly accountsOnFile: AccountOnFile[];

  constructor(json: api.PaymentProducts, assetUrl: string) {
    this.paymentProducts = json.paymentProducts
      .map((product) => toBasicPaymentProduct(product, assetUrl))
      .sort((p1, p2) => p1.displayHints.displayOrder - p2.displayHints.displayOrder);
    this.accountsOnFile = this.paymentProducts.flatMap((product) => product.accountsOnFile);
  }

  findPaymentProduct(id: number): BasicPaymentProduct | undefined {
    return this.paymentProducts.find((product) => product.id === id);
  }

  getPaymentProduct(id: number): BasicPaymentProduct {
    const product = this.findPaymentProduct(id);
    if (product) {
      return product;
    }
    throw new Error(`could not find BasicPaymentProduct with id ${id}`);
  }

  findAccountOnFile(id: number): AccountOnFile | undefined {
    return this.accountsOnFile.find((accountOnFile) => accountOnFile.id === id);
  }

  getAccountOnFile(id: number): AccountOnFile {
    const accountOnFile = this.findAccountOnFile(id);
    if (accountOnFile) {
      return accountOnFile;
    }
    throw new Error(`could not find AccountOnFile with id ${id}`);
  }
}

Object.freeze(BasicPaymentProductsImpl.prototype);

export function toBasicPaymentProducts(json: api.PaymentProducts, assetUrl: string): BasicPaymentProducts {
  return new BasicPaymentProductsImpl(json, assetUrl);
}

class PaymentProductImpl extends BasicPaymentProductImpl implements PaymentProduct {
  readonly fields: PaymentProductField[];
  readonly fieldsWarning?: string;

  constructor(json: api.PaymentProduct, assetUrl: string) {
    super(json, assetUrl);
    this.fields = json.fields ? toPaymentProductFields(json.fields, assetUrl) : [];
    this.fieldsWarning = json.fieldsWarning;
  }

  findField(id: string): PaymentProductField | undefined {
    return this.fields.find((field) => field.id === id);
  }

  getField(id: string): PaymentProductField {
    const field = this.findField(id);
    if (field) {
      return field;
    }
    throw new Error(`could not find PaymentProductField with id ${id}`);
  }
}

Object.freeze(PaymentProductImpl.prototype);

export function toPaymentProduct(json: api.PaymentProduct, assetUrl: string) {
  return new PaymentProductImpl(json, assetUrl);
}
