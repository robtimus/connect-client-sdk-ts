import { PaymentRequest, ValidationRuleRegularExpression } from "../..";
import * as api from "../../../communicator/model";

class ValidationRuleRegularExpressionImpl implements ValidationRuleRegularExpression {
  static readonly ID = "regularExpression";

  readonly id = ValidationRuleRegularExpressionImpl.ID;
  readonly regularExpression: string;
  private readonly regexp: RegExp;

  constructor(definition: api.RegularExpressionValidator) {
    this.regularExpression = definition.regularExpression;
    this.regexp = new RegExp(`^${this.regularExpression}$`);
  }

  validate(request: PaymentRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    return this.regexp.test(value);
  }
}

Object.freeze(ValidationRuleRegularExpressionImpl.prototype);

export function toValidationRuleRegularExpression(definition: api.RegularExpressionValidator): ValidationRuleRegularExpression {
  return new ValidationRuleRegularExpressionImpl(definition);
}
