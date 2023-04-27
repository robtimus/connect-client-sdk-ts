import { ValidationRule } from "../..";
import { toValidationRuleBoletoBancarioRequiredness } from "./ValidationRuleBoletoBancarioRequiredness";
import { toValidationRuleEmailAddress } from "./ValidationRuleEmailAddress";
import { toValidationRuleExpirationDate } from "./ValidationRuleExpirationDate";
import { toValidationRuleFixedList } from "./ValidationRuleFixedList";
import { toValidationRuleIban } from "./ValidationRuleIban";
import { toValidationRuleLength } from "./ValidationRuleLength";
import { toValidationRuleLuhn } from "./ValidationRuleLuhn";
import { toValidationRuleRange } from "./ValidationRuleRange";
import { toValidationRuleRegularExpression } from "./ValidationRuleRegularExpression";
import { toValidationRuleResidentIdNumber } from "./ValidationRuleResidentIdNumber";
import { toValidationRuleTermsAndConditions } from "./ValidationRuleTermsAndConditions";

const validationRules = {
  boletoBancarioRequiredness: toValidationRuleBoletoBancarioRequiredness,
  emailAddress: toValidationRuleEmailAddress,
  expirationDate: toValidationRuleExpirationDate,
  fixedList: toValidationRuleFixedList,
  iban: toValidationRuleIban,
  length: toValidationRuleLength,
  luhn: toValidationRuleLuhn,
  range: toValidationRuleRange,
  regularExpression: toValidationRuleRegularExpression,
  residentIdNumber: toValidationRuleResidentIdNumber,
  termsAndConditions: toValidationRuleTermsAndConditions,
};

export function createValidationRule(id: string, definition: unknown): ValidationRule | undefined {
  if (Object.prototype.hasOwnProperty.call(validationRules, id)) {
    return validationRules[id](definition);
  }
  console.warn(`No validator for rule ${id}`);
  return undefined;
}
