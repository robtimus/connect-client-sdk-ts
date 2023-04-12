import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

export class ValidationRuleRange implements ValidationRule<api.RangeValidator>, api.RangeValidator {
  static readonly ID = "range";

  readonly id = ValidationRuleRange.ID;
  readonly minValue: number;
  readonly maxValue: number;

  constructor(readonly definition: api.RangeValidator) {
    this.minValue = definition.minValue;
    this.maxValue = definition.maxValue;
  }

  validate(request: ValidatableRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string | number): boolean {
    if (typeof value !== "number") {
      value = parseInt(value, 10);
    }
    return !isNaN(value) && this.minValue <= value && value <= this.maxValue;
  }
}

Object.freeze(ValidationRuleRange.prototype);
