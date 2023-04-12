import { PaymentProductFieldDataRestrictions } from ".";
import { api } from "../communicator/model";
import { createValidationRule } from "../validation/factory";
import { ValidationRule } from "../validation";

function createValidationRules(json: api.PaymentProductFieldValidators): ValidationRule<unknown>[] {
  const result: ValidationRule<unknown>[] = [];
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
  readonly validationRules: ValidationRule<unknown>[];

  constructor(json: api.PaymentProductFieldDataRestrictions) {
    this.isRequired = json.isRequired;
    this.validationRules = createValidationRules(json.validators);
  }

  findValidationRule(id: string): ValidationRule<unknown> | undefined {
    return this.validationRules.find((rule) => rule.id === id);
  }

  getValidationRule(id: string): ValidationRule<unknown> {
    const rule = this.findValidationRule(id);
    if (rule) {
      return rule;
    }
    throw new Error(`could not find ValidationRule for type ${id}`);
  }
}

Object.freeze(PaymentProductFieldDataRestrictionsImpl.prototype);

export function toPaymentProductFieldDataRestrictions(json: api.PaymentProductFieldDataRestrictions): PaymentProductFieldDataRestrictions {
  return new PaymentProductFieldDataRestrictionsImpl(json);
}
