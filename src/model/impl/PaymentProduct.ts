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
import { toPaymentProductField } from "./PaymentProductField";

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

  constructor(json: api.PaymentProduct) {
    this.accountsOnFile = json.accountsOnFile ? json.accountsOnFile.map(toAccountOnFile) : [];
    this.acquirerCountry = json.acquirerCountry;
    this.allowsInstallments = json.allowsInstallments;
    this.allowsRecurring = json.allowsRecurring;
    this.allowsTokenization = json.allowsTokenization;
    this.autoTokenized = json.autoTokenized;
    this.authenticationIndicator = json.authenticationIndicator;
    this.canBeIframed = json.canBeIframed;
    this.deviceFingerprintEnabled = json.deviceFingerprintEnabled;
    this.displayHints = json.displayHints;
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

export function toBasicPaymentProduct(json: api.PaymentProduct): BasicPaymentProduct {
  return new BasicPaymentProductImpl(json);
}

class BasicPaymentProductsImpl implements BasicPaymentProducts {
  readonly paymentProducts: BasicPaymentProduct[];
  readonly accountsOnFile: AccountOnFile[];

  constructor(json: api.PaymentProducts) {
    this.paymentProducts = json.paymentProducts.map(toBasicPaymentProduct);
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

export function toBasicPaymentProducts(json: api.PaymentProducts): BasicPaymentProducts {
  return new BasicPaymentProductsImpl(json);
}

class PaymentProductImpl extends BasicPaymentProductImpl implements PaymentProduct {
  readonly fields: PaymentProductField[];
  readonly fieldsWarning?: string;

  constructor(json: api.PaymentProduct) {
    super(json);
    this.fields = json.fields ? json.fields.map(toPaymentProductField) : [];
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

export function toPaymentProduct(json: api.PaymentProduct) {
  return new PaymentProductImpl(json);
}
