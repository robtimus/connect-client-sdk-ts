import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

const LUHN_ARRAY = [
  [0, 2, 4, 6, 8, 1, 3, 5, 7, 9],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
];

export class ValidationRuleLuhn implements ValidationRule<api.EmptyValidator>, api.EmptyValidator {
  static readonly ID = "luhn";

  readonly id = ValidationRuleLuhn.ID;

  constructor(readonly definition: api.EmptyValidator) {}

  validate(request: ValidatableRequest, fieldId: string): boolean {
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

Object.freeze(ValidationRuleLuhn.prototype);
