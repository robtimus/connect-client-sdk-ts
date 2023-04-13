import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

const IBAN_REGEXP = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;

function moveFirstCharactersToEnd(value: string): string {
  return value.substring(4) + value.substring(0, 4);
}

// A is 65, B is 66, etc.
// Subtract this to get 10, 11, etc.
const LETTER_OFFSET = 55;

function replaceLetters(value: string): string {
  return value.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - LETTER_OFFSET).toString());
}

function modulo(divident: string, divisor: number): number {
  // Based on https://stackoverflow.com/a/16019504/1180351
  const partLength = 10;

  while (divident.length > partLength) {
    const part = divident.substring(0, partLength);
    divident = (parseInt(part, 10) % divisor) + divident.substring(partLength);
  }
  return parseInt(divident, 10) % divisor;
}

export class ValidationRuleIban implements ValidationRule<api.EmptyValidator>, api.EmptyValidator {
  static readonly ID = "iban";

  readonly id = ValidationRuleIban.ID;

  constructor(readonly definition: Readonly<api.EmptyValidator>) {}

  validate(request: ValidatableRequest, fieldId: string): boolean {
    const value = request.getUnmaskedValue(fieldId);
    return !!value && this.validateValue(value);
  }

  validateValue(value: string): boolean {
    value = value.replace(/[^\d\w]+/g, "").toUpperCase();
    if (!IBAN_REGEXP.test(value)) {
      return false;
    }

    value = moveFirstCharactersToEnd(value);
    value = replaceLetters(value);
    return modulo(value, 97) === 1;
  }
}

Object.freeze(ValidationRuleIban.prototype);
