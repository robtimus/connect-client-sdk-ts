import { AccountOnFile, AccountOnFileAttribute, AccountOnFileDisplayHints, MaskedString } from "./types";
import { api } from "../communicator/model";
import { applyMask } from "../util/masking";
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

  findMaskedValue(attributeKey: string): MaskedString | undefined {
    const attribute = this.findAttribute(attributeKey);
    if (!attribute) {
      return undefined;
    }
    const wildcardMask = this.displayHints.findLabelTemplate(attributeKey)?.wildcardMask;
    if (wildcardMask === undefined) {
      return undefined;
    }
    return applyMask(wildcardMask, attribute.value);
  }
}

Object.freeze(AccountOnFileImpl.prototype);

export function toAccountOnFile(json: api.AccountOnFile): AccountOnFile {
  return new AccountOnFileImpl(json);
}
