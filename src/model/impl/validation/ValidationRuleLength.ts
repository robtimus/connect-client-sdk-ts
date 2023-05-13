import { PaymentRequest, ValidationRuleLength } from "../..";
import * as api from "../../../communicator/model";

class ValidationRuleLengthImpl implements ValidationRuleLength {
  static readonly ID = "length";

  readonly id = ValidationRuleLengthImpl.ID;
  readonly minLength: number;
  readonly maxLength: number;

  constructor(definition: api.LengthValidator) {
    this.minLength = definition.minLength;
    this.maxLength = definition.maxLength;
  }

  validatePaymentRequest(request: PaymentRequest, fieldId: string): boolean {
    // Empty values are allowed if the minimal required length is 0
    const value = request.getUnmaskedValue(fieldId) || "";
    return this.validateValue(value);
  }

  validateValue(value: string): boolean {
    return this.minLength <= value.length && value.length <= this.maxLength;
  }
}

Object.freeze(ValidationRuleLengthImpl.prototype);

export function toValidationRuleLength(definition: api.LengthValidator): ValidationRuleLength {
  return new ValidationRuleLengthImpl(definition);
}
