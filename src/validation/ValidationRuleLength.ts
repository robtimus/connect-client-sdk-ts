import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

export class ValidationRuleLength implements ValidationRule<api.LengthValidator>, api.LengthValidator {
  static readonly ID = "length";

  readonly id = ValidationRuleLength.ID;
  readonly minLength: number;
  readonly maxLength: number;

  constructor(readonly definition: Readonly<api.LengthValidator>) {
    this.minLength = definition.minLength;
    this.maxLength = definition.maxLength;
  }

  validate(request: ValidatableRequest, fieldId: string): boolean {
    // Empty values are allowed if the minimal required length is 0
    const value = request.getUnmaskedValue(fieldId) || "";
    return this.validateValue(value);
  }

  validateValue(value: string): boolean {
    return this.minLength <= value.length && value.length <= this.maxLength;
  }
}

Object.freeze(ValidationRuleLength.prototype);
