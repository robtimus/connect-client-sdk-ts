import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

const EMAIL_REGEXP = new RegExp(/^[^@.]+(\.[^@.]+)*@([^@.]+\.)*[^@.]+\.[^@.][^@.]+$/i);

export class ValidationRuleEmailAddress implements ValidationRule<api.EmptyValidator>, api.EmptyValidator {
  static readonly ID = "emailAddress";

  readonly id = ValidationRuleEmailAddress.ID;

  constructor(readonly definition: api.EmptyValidator) {}

  validate(request: ValidatableRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    return EMAIL_REGEXP.test(value);
  }
}

Object.freeze(ValidationRuleEmailAddress.prototype);
