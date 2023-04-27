import { MaskedString, PaymentProductField, PaymentProductFieldDataRestrictions, PaymentProductFieldDisplayHints } from "..";
import { api } from "../../communicator/model";
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

  constructor(json: api.PaymentProductField) {
    this.dataRestrictions = toPaymentProductFieldDataRestrictions(json.dataRestrictions);
    this.displayHints = json.displayHints ? toPaymentProductFieldDisplayHints(json.displayHints) : undefined;
    this.id = json.id;
    this.type = json.type;
    this.usedForLookup = json.usedForLookup;
    this.inputType = json.displayHints && json.displayHints.obfuscate ? "password" : inputTypes[json.type] || json.type;
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
}

Object.freeze(PaymentProductFieldImpl.prototype);

export function toPaymentProductField(json: api.PaymentProductField): PaymentProductField {
  return new PaymentProductFieldImpl(json);
}
