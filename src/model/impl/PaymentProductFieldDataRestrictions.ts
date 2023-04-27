import { PaymentProductFieldDataRestrictions, ValidationRule } from "..";
import { api } from "../../communicator/model";
import { createValidationRule } from "./validation";

function createValidationRules(json: api.PaymentProductFieldValidators): ValidationRule[] {
  const result: ValidationRule[] = [];
  for (const type in json) {
    const definition = json[type];
    const validationRule = definition ? createValidationRule(type, definition) : undefined;
    if (validationRule) {
      result.push(validationRule);
    }
  }
  return result;
}

class PaymentProductFieldDataRestrictionsImpl implements PaymentProductFieldDataRestrictions {
  readonly isRequired: boolean;
  readonly validationRules: ValidationRule[];

  constructor(json: api.PaymentProductFieldDataRestrictions) {
    this.isRequired = json.isRequired;
    this.validationRules = createValidationRules(json.validators);
  }

  findValidationRule(id: string): ValidationRule | undefined {
    return this.validationRules.find((rule) => rule.id === id);
  }

  getValidationRule(id: string): ValidationRule {
    const rule = this.findValidationRule(id);
    if (rule) {
      return rule;
    }
    throw new Error(`could not find ValidationRule with id ${id}`);
  }
}

Object.freeze(PaymentProductFieldDataRestrictionsImpl.prototype);

export function toPaymentProductFieldDataRestrictions(json: api.PaymentProductFieldDataRestrictions): PaymentProductFieldDataRestrictions {
  return new PaymentProductFieldDataRestrictionsImpl(json);
}
