import { PaymentRequest, ValidationRuleBoletoBancarioRequiredness } from "../..";
import * as api from "../../../communicator/model";

class ValidationRuleBoletoBancarioRequirednessImpl implements ValidationRuleBoletoBancarioRequiredness {
  static readonly ID = "boletoBancarioRequiredness";

  readonly id = ValidationRuleBoletoBancarioRequirednessImpl.ID;
  readonly fiscalNumberLength: number;

  constructor(definition: api.BoletoBancarioRequirednessValidator) {
    this.fiscalNumberLength = definition.fiscalNumberLength;
  }

  validatePaymentRequest(request: PaymentRequest, fieldId: string): boolean {
    const value = request.getValue(fieldId);
    const fiscalNumber = request.getUnmaskedValue("fiscalNumber");
    return this.validateValueAgainstFiscalNumber(value, fiscalNumber);
  }

  validateValue(value: string, fiscalNumber?: string): boolean {
    return this.validateValueAgainstFiscalNumber(value, fiscalNumber);
  }

  private validateValueAgainstFiscalNumber(value: string | undefined, fiscalNumber?: string): boolean {
    const fiscalNumberLength = fiscalNumber?.length || 0;
    if (fiscalNumberLength !== this.fiscalNumberLength) {
      // The field is not required for Boleto; allow anything
      return true;
    }

    return !!value;
  }
}

Object.freeze(ValidationRuleBoletoBancarioRequirednessImpl.prototype);

export function toValidationRuleBoletoBancarioRequiredness(
  definition: api.BoletoBancarioRequirednessValidator
): ValidationRuleBoletoBancarioRequiredness {
  return new ValidationRuleBoletoBancarioRequirednessImpl(definition);
}
