import { AccountOnFile, AccountOnFileAttribute, AccountOnFileDisplayHints, MaskedString } from "..";
import { api } from "../../communicator/model";
import { applyMask } from "../../util/masking";
import { toAccountOnFileDisplayHints } from "./AccountOnFileDisplayHints";

class AccountOnFileImpl implements AccountOnFile {
  readonly attributes: AccountOnFileAttribute[];
  readonly displayHints: AccountOnFileDisplayHints;
  readonly id: number;
  readonly paymentProductId: number;

  constructor(json: api.AccountOnFile) {
    this.attributes = json.attributes;
    this.displayHints = toAccountOnFileDisplayHints(json.displayHints);
    this.id = json.id;
    this.paymentProductId = json.paymentProductId;
  }

  findAttribute(key: string): AccountOnFileAttribute | undefined {
    return this.attributes.find((attribute) => attribute.key === key);
  }

  getAttribute(key: string): AccountOnFileAttribute {
    const attribute = this.findAttribute(key);
    if (attribute) {
      return attribute;
    }
    throw new Error(`could not find AccountOnFileAttribute with key ${key}`);
  }

  findMaskedAttributeValue(key: string): MaskedString | undefined {
    const attribute = this.findAttribute(key);
    if (!attribute) {
      return undefined;
    }
    const wildcardMask = this.displayHints.findLabelTemplate(key)?.wildcardMask;
    if (wildcardMask === undefined) {
      return undefined;
    }
    return applyMask(wildcardMask, attribute.value);
  }

  findAttributeDisplayValue(key: string): string | undefined {
    const attribute = this.findAttribute(key);
    if (!attribute) {
      return undefined;
    }
    return this.getDisplayValue(attribute);
  }

  getAttributeDisplayValue(key: string): string {
    const attribute = this.getAttribute(key);
    return this.getDisplayValue(attribute);
  }

  private getDisplayValue(attribute: AccountOnFileAttribute): string {
    const wildcardMask = this.displayHints.findLabelTemplate(attribute.key)?.wildcardMask;
    if (wildcardMask === undefined) {
      return attribute.value;
    }
    return applyMask(wildcardMask, attribute.value).formattedValue;
  }
}

Object.freeze(AccountOnFileImpl.prototype);

export function toAccountOnFile(json: api.AccountOnFile): AccountOnFile {
  return new AccountOnFileImpl(json);
}
