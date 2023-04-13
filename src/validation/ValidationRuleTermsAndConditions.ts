import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

export class ValidationRuleTermsAndConditions implements ValidationRule<api.EmptyValidator>, api.EmptyValidator {
  static readonly ID = "termsAndConditions";

  readonly id = ValidationRuleTermsAndConditions.ID;

  constructor(readonly definition: Readonly<api.EmptyValidator>) {}

  validate(request: ValidatableRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string | boolean): boolean {
    return value === true || value === "true";
  }
}

Object.freeze(ValidationRuleTermsAndConditions.prototype);
