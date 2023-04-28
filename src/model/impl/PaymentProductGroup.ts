import {
  AccountOnFile,
  BasicPaymentProductGroup,
  BasicPaymentProductGroups,
  PaymentProductDisplayHints,
  PaymentProductField,
  PaymentProductGroup,
} from "..";
import { api } from "../../communicator/model";
import { toAccountOnFile } from "./AccountOnFile";
import { toPaymentProductField } from "./PaymentProductField";

class BasicPaymentProductGroupImpl implements BasicPaymentProductGroup {
  readonly accountsOnFile: AccountOnFile[];
  readonly allowsInstallments: boolean;
  readonly deviceFingerprintEnabled: boolean;
  readonly displayHints: PaymentProductDisplayHints;
  readonly id: string;
  readonly type = "group";

  constructor(json: api.PaymentProductGroup) {
    this.accountsOnFile = json.accountsOnFile ? json.accountsOnFile.map(toAccountOnFile) : [];
    this.allowsInstallments = json.allowsInstallments;
    this.deviceFingerprintEnabled = json.deviceFingerprintEnabled;
    this.displayHints = json.displayHints;
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

export function toBasicPaymentProductGroup(json: api.PaymentProductGroup): BasicPaymentProductGroup {
  return new BasicPaymentProductGroupImpl(json);
}

class BasicPaymentProductGroupsImpl implements BasicPaymentProductGroups {
  readonly paymentProductGroups: BasicPaymentProductGroup[];
  readonly accountsOnFile: AccountOnFile[];

  constructor(json: api.PaymentProductGroups) {
    this.paymentProductGroups = json.paymentProductGroups.map(toBasicPaymentProductGroup);
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

export function toBasicPaymentProductGroups(json: api.PaymentProductGroups): BasicPaymentProductGroups {
  return new BasicPaymentProductGroupsImpl(json);
}

class PaymentProductGroupImpl extends BasicPaymentProductGroupImpl implements PaymentProductGroup {
  readonly fields: PaymentProductField[];

  constructor(json: api.PaymentProductGroup) {
    super(json);
    this.fields = json.fields ? json.fields.map(toPaymentProductField) : [];
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

export function toPaymentProductGroup(json: api.PaymentProductGroup) {
  return new PaymentProductGroupImpl(json);
}
