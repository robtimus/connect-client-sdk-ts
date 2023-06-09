import { MaskedString, PaymentProductField, PaymentProductFieldDataRestrictions, PaymentProductFieldDisplayHints, PaymentRequest } from "..";
import * as api from "../../communicator/model";
import { applyMask, removeMask } from "../../util/masking";
import { toPaymentProductFieldDataRestrictions } from "./PaymentProductFieldDataRestrictions";
import { toPaymentProductFieldDisplayHints } from "./PaymentProductFieldDisplayHints";

const inputTypes = {
  expirydate: "tel",
  string: "text",
  numericstring: "tel",
  integer: "number",
  expirationDate: "tel",
};

class PaymentProductFieldImpl implements PaymentProductField {
  readonly dataRestrictions: PaymentProductFieldDataRestrictions;
  readonly displayHints?: PaymentProductFieldDisplayHints;
  readonly id: string;
  readonly type: string;
  readonly usedForLookup?: boolean;
  readonly inputType: string;

  constructor(json: api.PaymentProductField, assetUrl: string) {
    this.dataRestrictions = toPaymentProductFieldDataRestrictions(json.dataRestrictions);
    this.displayHints = json.displayHints ? toPaymentProductFieldDisplayHints(json.displayHints, assetUrl) : undefined;
    this.id = json.id;
    this.type = json.type;
    this.usedForLookup = json.usedForLookup;
    this.inputType = json.displayHints?.obfuscate ? "password" : inputTypes[json.type] || json.type;
  }

  applyMask(newValue: string, oldValue?: string): MaskedString {
    const mask = this.displayHints?.mask;
    return applyMask(mask, newValue, oldValue);
  }

  applyWildcardMask(newValue: string, oldValue?: string): MaskedString {
    const wildcardMask = this.displayHints?.wildcardMask;
    return applyMask(wildcardMask, newValue, oldValue);
  }

  removeMask(value: string): string {
    const mask = this.displayHints?.mask;
    return removeMask(mask, value);
  }

  validatePaymentRequest(request: PaymentRequest): string[] {
    const rules = this.dataRestrictions.validationRules;
    return rules.filter((rule) => !rule.validatePaymentRequest(request, this.id)).map((rule) => rule.id);
  }
}

Object.freeze(PaymentProductFieldImpl.prototype);

export function toPaymentProductField(json: api.PaymentProductField, assetUrl: string): PaymentProductField {
  return new PaymentProductFieldImpl(json, assetUrl);
}

export function toPaymentProductFields(json: api.PaymentProductField[], assetUrl: string): PaymentProductField[] {
  return json
    .map((field) => toPaymentProductField(field, assetUrl))
    .sort((f1, f2) => {
      const displayOrder1 = f1.displayHints?.displayOrder ?? 0;
      const displayOrder2 = f2.displayHints?.displayOrder ?? 0;
      return displayOrder1 - displayOrder2;
    });
}
