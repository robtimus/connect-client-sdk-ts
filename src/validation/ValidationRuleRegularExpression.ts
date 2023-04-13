import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

export class ValidationRuleRegularExpression implements ValidationRule<api.RegularExpressionValidator>, api.RegularExpressionValidator {
  static readonly ID = "regularExpression";

  readonly id = ValidationRuleRegularExpression.ID;
  readonly regularExpression: string;
  private readonly regexp: RegExp;

  constructor(readonly definition: api.RegularExpressionValidator) {
    this.regularExpression = definition.regularExpression;
    this.regexp = new RegExp(`^${this.regularExpression}$`);
  }

  validate(request: ValidatableRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    return this.regexp.test(value);
  }
}

Object.freeze(ValidationRuleRegularExpression.prototype);
