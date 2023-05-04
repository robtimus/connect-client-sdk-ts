import { PaymentRequest, ValidationRuleBoletoBancarioRequiredness } from "../..";
import * as api from "../../../communicator/model";

class ValidationRuleBoletoBancarioRequirednessImpl implements ValidationRuleBoletoBancarioRequiredness {
  static readonly ID = "boletoBancarioRequiredness";

  readonly id = ValidationRuleBoletoBancarioRequirednessImpl.ID;
  readonly fiscalNumberLength: number;

  constructor(definition: api.BoletoBancarioRequirednessValidator) {
    this.fiscalNumberLength = definition.fiscalNumberLength;
  }

  validate(request: PaymentRequest, fieldId: string): boolean {
    const fiscalNumber = request.getUnmaskedValue("fiscalNumber");
    const fiscalNumberLength = fiscalNumber?.length || 0;
    if (fiscalNumberLength !== this.fiscalNumberLength) {
      // The field is not required for Boleto; allow anything
      return true;
    }

    const value = request.getValue(fieldId);
    return !!value;
  }
}

Object.freeze(ValidationRuleBoletoBancarioRequirednessImpl.prototype);

export function toValidationRuleBoletoBancarioRequiredness(
  definition: api.BoletoBancarioRequirednessValidator
): ValidationRuleBoletoBancarioRequiredness {
  return new ValidationRuleBoletoBancarioRequirednessImpl(definition);
}
