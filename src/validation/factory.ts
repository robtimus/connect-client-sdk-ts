import { ValidationRule } from ".";
import { ValidationRuleBoletoBancarioRequiredness } from "./ValidationRuleBoletoBancarioRequiredness";
import { ValidationRuleEmailAddress } from "./ValidationRuleEmailAddress";
import { ValidationRuleExpirationDate } from "./ValidationRuleExpirationDate";
import { ValidationRuleFixedList } from "./ValidationRuleFixedList";
import { ValidationRuleIban } from "./ValidationRuleIban";
import { ValidationRuleLength } from "./ValidationRuleLength";
import { ValidationRuleLuhn } from "./ValidationRuleLuhn";
import { ValidationRuleRange } from "./ValidationRuleRange";
import { ValidationRuleRegularExpression } from "./ValidationRuleRegularExpression";
import { ValidationRuleResidentIdNumber } from "./ValidationRuleResidentIdNumber";
import { ValidationRuleTermsAndConditions } from "./ValidationRuleTermsAndConditions";

const validationRules = {
  boletoBancarioRequiredness: ValidationRuleBoletoBancarioRequiredness,
  emailAddress: ValidationRuleEmailAddress,
  expirationDate: ValidationRuleExpirationDate,
  fixedList: ValidationRuleFixedList,
  iban: ValidationRuleIban,
  length: ValidationRuleLength,
  luhn: ValidationRuleLuhn,
  range: ValidationRuleRange,
  regularExpression: ValidationRuleRegularExpression,
  residentIdNumber: ValidationRuleResidentIdNumber,
  termsAndConditions: ValidationRuleTermsAndConditions,
};

export function createValidationRule(id: string, definition: unknown): ValidationRule<unknown> | undefined {
  if (Object.prototype.hasOwnProperty.call(validationRules, id)) {
    return new validationRules[id](definition);
  }
  console.warn(`No validator for rule ${id}`);
  return undefined;
}
