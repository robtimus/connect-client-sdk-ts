import { PaymentRequest, ValidationRuleFixedList } from "../..";
import { api } from "../../../communicator/model";

class ValidationRuleFixedListImpl implements ValidationRuleFixedList {
  static readonly ID = "fixedList";

  readonly id = ValidationRuleFixedListImpl.ID;
  readonly allowedValues: string[];

  constructor(definition: api.FixedListValidator) {
    this.allowedValues = definition.allowedValues;
  }

  validate(request: PaymentRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    for (const allowedValue of this.allowedValues) {
      if (allowedValue === value) {
        return true;
      }
    }
    return false;
  }
}

Object.freeze(ValidationRuleFixedListImpl.prototype);

export function toValidationRuleFixedList(definition: api.FixedListValidator): ValidationRuleFixedList {
  return new ValidationRuleFixedListImpl(definition);
}
