import { PaymentRequest, ValidationRuleExpirationDate } from "../..";
import * as api from "../../../communicator/model";

// value is mmYY or mmYYYY
const DATE_FORMAT_REGEXP = /^(\d{4}|\d{6})$/;

class ValidationRuleExpirationDateImpl implements ValidationRuleExpirationDate {
  static readonly ID = "expirationDate";

  readonly id = ValidationRuleExpirationDateImpl.ID;

  validatePaymentRequest(request: PaymentRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    value = value.replace(/[^\d]/g, "");
    if (!DATE_FORMAT_REGEXP.test(value)) {
      return false;
    }

    // The month is zero-based in Date, so subtract one.
    const expirationMonth = Number(value.substring(0, 2)) - 1;
    // value.length is either 4 or 6
    const expirationYear = value.length === 4 ? 2000 + Number(value.substring(2, 4)) : Number(value.substring(2, 6));

    const expirationDate = new Date(expirationYear, expirationMonth, 1);

    // Compare the input with the parsed date, to check if the date rolled over.
    if (expirationDate.getMonth() !== expirationMonth || expirationDate.getFullYear() !== expirationYear) {
      return false;
    }

    // For comparison, set the current year & month and the maximum allowed expiration date.
    const now = new Date();
    const minExpirationDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const maxExpirationDate = new Date(now.getFullYear() + 25, 11, 1);

    // The card is still valid if it expires this month.
    return minExpirationDate <= expirationDate && expirationDate <= maxExpirationDate;
  }
}

Object.freeze(ValidationRuleExpirationDateImpl.prototype);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function toValidationRuleExpirationDate(_definition: api.EmptyValidator): ValidationRuleExpirationDate {
  return new ValidationRuleExpirationDateImpl();
}
