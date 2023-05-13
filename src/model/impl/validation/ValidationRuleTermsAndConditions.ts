import { PaymentRequest, ValidationRuleTermsAndConditions } from "../..";
import * as api from "../../../communicator/model";

class ValidationRuleTermsAndConditionsImpl implements ValidationRuleTermsAndConditions {
  static readonly ID = "termsAndConditions";

  readonly id = ValidationRuleTermsAndConditionsImpl.ID;

  validatePaymentRequest(request: PaymentRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string | boolean): boolean {
    return value === true || value === "true";
  }
}

Object.freeze(ValidationRuleTermsAndConditionsImpl.prototype);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function toValidationRuleTermsAndConditions(_definition: api.EmptyValidator): ValidationRuleTermsAndConditions {
  return new ValidationRuleTermsAndConditionsImpl();
}
