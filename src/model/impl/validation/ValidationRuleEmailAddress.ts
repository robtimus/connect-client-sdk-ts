import { PaymentRequest, ValidationRuleEmailAddress } from "../..";
import * as api from "../../../communicator/model";

const EMAIL_REGEXP = new RegExp(/^[^@.]+(\.[^@.]+)*@([^@.]+\.)*[^@.]+\.[^@.][^@.]+$/i);

class ValidationRuleEmailAddressImpl implements ValidationRuleEmailAddress {
  static readonly ID = "emailAddress";

  readonly id = ValidationRuleEmailAddressImpl.ID;

  validate(request: PaymentRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    return EMAIL_REGEXP.test(value);
  }
}

Object.freeze(ValidationRuleEmailAddressImpl.prototype);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function toValidationRuleEmailAddress(_definition: api.EmptyValidator) {
  return new ValidationRuleEmailAddressImpl();
}
