import { AccountOnFile, AccountOnFileAttribute, AccountOnFileDisplayHints, MaskedString } from "..";
import * as api from "../../communicator/model";
import { applyMask } from "../../util/masking";
import { toAccountOnFileDisplayHints } from "./AccountOnFileDisplayHints";

class AccountOnFileImpl implements AccountOnFile {
  readonly attributes: AccountOnFileAttribute[];
  readonly displayHints: AccountOnFileDisplayHints;
  readonly id: number;
  readonly paymentProductId: number;

  constructor(json: api.AccountOnFile, assetUrl: string) {
    this.attributes = json.attributes;
    this.displayHints = toAccountOnFileDisplayHints(json.displayHints, assetUrl);
    this.id = json.id;
    this.paymentProductId = json.paymentProductId;
  }

  getLabel(): string {
    return this.displayHints.labelTemplate.map((e) => this.getAttributeDisplayValue(e.attributeKey)).join(" ");
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

  isReadOnlyAttribute(key: string): boolean {
    const attribute = this.findAttribute(key);
    return !!attribute && attribute.status === "READ_ONLY";
  }
}

Object.freeze(AccountOnFileImpl.prototype);

export function toAccountOnFile(json: api.AccountOnFile, assetUrl: string): AccountOnFile {
  return new AccountOnFileImpl(json, assetUrl);
}
