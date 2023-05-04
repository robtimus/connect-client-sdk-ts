import { PaymentRequest, ValidationRuleLuhn } from "../..";
import * as api from "../../../communicator/model";

const LUHN_ARRAY = [
  [0, 2, 4, 6, 8, 1, 3, 5, 7, 9],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
];

class ValidationRuleLuhnImpl implements ValidationRuleLuhn {
  static readonly ID = "luhn";

  readonly id = ValidationRuleLuhnImpl.ID;

  validate(request: PaymentRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    const digits = value.replace(/\D+/g, "");
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      const c = Number(digits.charAt(i));
      sum += LUHN_ARRAY[(digits.length - i) & 1][c];
    }
    return sum % 10 === 0 && sum > 0;
  }
}

Object.freeze(ValidationRuleLuhnImpl.prototype);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function toValidationRuleLuhn(_definition: api.EmptyValidator): ValidationRuleLuhn {
  return new ValidationRuleLuhnImpl();
}
