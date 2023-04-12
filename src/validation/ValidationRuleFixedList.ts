import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

export class ValidationRuleFixedList implements ValidationRule<api.FixedListValidator>, api.FixedListValidator {
  static readonly ID = "fixedList";

  readonly id = ValidationRuleFixedList.ID;
  readonly allowedValues: string[];

  constructor(readonly definition: api.FixedListValidator) {
    this.allowedValues = definition.allowedValues;
  }

  validate(request: ValidatableRequest, fieldId: string): boolean {
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

Object.freeze(ValidationRuleFixedList.prototype);
