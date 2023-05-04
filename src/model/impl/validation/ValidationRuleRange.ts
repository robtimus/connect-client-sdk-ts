import { PaymentRequest, ValidationRuleRange } from "../..";
import * as api from "../../../communicator/model";

class ValidationRuleRangeImpl implements ValidationRuleRange {
  static readonly ID = "range";

  readonly id = ValidationRuleRangeImpl.ID;
  readonly minValue: number;
  readonly maxValue: number;

  constructor(definition: api.RangeValidator) {
    this.minValue = definition.minValue;
    this.maxValue = definition.maxValue;
  }

  validate(request: PaymentRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string | number): boolean {
    if (typeof value !== "number") {
      // parseInt doesn't return NaN when value starts with a valid number
      // Number(value) doesn't necessarily use base10
      // Combine both to get the desired result
      value = isNaN(Number(value)) ? NaN : parseInt(value, 10);
    }
    return !isNaN(value) && this.minValue <= value && value <= this.maxValue;
  }
}

Object.freeze(ValidationRuleRangeImpl.prototype);

export function toValidationRuleRange(definition: api.RangeValidator): ValidationRuleRange {
  return new ValidationRuleRangeImpl(definition);
}
