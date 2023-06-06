import {
  AccountOnFile,
  BasicPaymentProductGroup,
  BasicPaymentProductGroups,
  PaymentProductDisplayHints,
  PaymentProductField,
  PaymentProductGroup,
} from "..";
import * as api from "../../communicator/model";
import { toAccountOnFile } from "./AccountOnFile";
import { toPaymentProductDisplayHints } from "./PaymentProductDisplayHints";
import { toPaymentProductFields } from "./PaymentProductField";

class BasicPaymentProductGroupImpl implements BasicPaymentProductGroup {
  readonly accountsOnFile: AccountOnFile[];
  readonly allowsInstallments: boolean;
  readonly deviceFingerprintEnabled: boolean;
  readonly displayHints: PaymentProductDisplayHints;
  readonly id: string;
  readonly type = "group";

  constructor(json: api.PaymentProductGroup, assetUrl: string) {
    this.accountsOnFile = json.accountsOnFile ? json.accountsOnFile.map((accountOnFile) => toAccountOnFile(accountOnFile, assetUrl)) : [];
    this.allowsInstallments = json.allowsInstallments;
    this.deviceFingerprintEnabled = json.deviceFingerprintEnabled;
    this.displayHints = toPaymentProductDisplayHints(json.displayHints, assetUrl);
    this.id = json.id;
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

Object.freeze(BasicPaymentProductGroupImpl.prototype);

export function toBasicPaymentProductGroup(json: api.PaymentProductGroup, assetUrl: string): BasicPaymentProductGroup {
  return new BasicPaymentProductGroupImpl(json, assetUrl);
}

class BasicPaymentProductGroupsImpl implements BasicPaymentProductGroups {
  readonly paymentProductGroups: BasicPaymentProductGroup[];
  readonly accountsOnFile: AccountOnFile[];

  constructor(json: api.PaymentProductGroups, assetUrl: string) {
    this.paymentProductGroups = json.paymentProductGroups
      .map((group) => toBasicPaymentProductGroup(group, assetUrl))
      .sort((g1, g2) => g1.displayHints.displayOrder - g2.displayHints.displayOrder);
    this.accountsOnFile = this.paymentProductGroups.flatMap((group) => group.accountsOnFile);
  }

  findPaymentProductGroup(id: string): BasicPaymentProductGroup | undefined {
    return this.paymentProductGroups.find((product) => product.id === id);
  }

  getPaymentProductGroup(id: string): BasicPaymentProductGroup {
    const group = this.findPaymentProductGroup(id);
    if (group) {
      return group;
    }
    throw new Error(`could not find BasicPaymentProductGroup with id ${id}`);
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

Object.freeze(BasicPaymentProductGroupsImpl.prototype);

export function toBasicPaymentProductGroups(json: api.PaymentProductGroups, assetUrl: string): BasicPaymentProductGroups {
  return new BasicPaymentProductGroupsImpl(json, assetUrl);
}

class PaymentProductGroupImpl extends BasicPaymentProductGroupImpl implements PaymentProductGroup {
  readonly fields: PaymentProductField[];

  constructor(json: api.PaymentProductGroup, assetUrl: string) {
    super(json, assetUrl);
    this.fields = json.fields ? toPaymentProductFields(json.fields, assetUrl) : [];
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

Object.freeze(PaymentProductGroupImpl.prototype);

export function toPaymentProductGroup(json: api.PaymentProductGroup, assetUrl: string) {
  return new PaymentProductGroupImpl(json, assetUrl);
}
