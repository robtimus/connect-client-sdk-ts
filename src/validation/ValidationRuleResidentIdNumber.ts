import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

const WEIGHTS: number[] = [];

// https://en.wikipedia.org/wiki/Resident_Identity_Card
// storing weights in the reverse order so that we can begin
// from the 0th position of ID while calculating checksum
for (let i = 18; i > 0; i--) {
  WEIGHTS.push(Math.pow(2, i - 1) % 11);
}

const DIGITS_REGEXP = /^\d+$/;

export class ValidationRuleResidentIdNumber implements ValidationRule<api.EmptyValidator>, api.EmptyValidator {
  static readonly ID = "residentIdNumber";

  readonly id = ValidationRuleResidentIdNumber.ID;

  constructor(readonly definition: Readonly<api.EmptyValidator>) {}

  validate(request: ValidatableRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    if (value.length < 15) {
      return false;
    }
    if (value.length == 15) {
      return DIGITS_REGEXP.test(value);
    }
    if (value.length !== 18) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < value.length - 1; i++) {
      sum += Number(value.charAt(i)) * WEIGHTS[i];
    }

    const checkSum = (12 - (sum % 11)) % 11;
    const csChar = value.charAt(17);

    if (checkSum < 10) {
      return checkSum == Number(csChar); // check only values
    }

    return !!csChar && csChar.toUpperCase() === "X"; // check the type as well
  }
}

Object.freeze(ValidationRuleResidentIdNumber.prototype);
