import { ValidatableRequest, ValidationRule } from ".";
import { api } from "../communicator/model";

export class ValidationRuleBoletoBancarioRequiredness
  implements ValidationRule<api.BoletoBancarioRequirednessValidator>, api.BoletoBancarioRequirednessValidator
{
  static readonly ID = "boletoBancarioRequiredness";

  readonly id = ValidationRuleBoletoBancarioRequiredness.ID;
  readonly fiscalNumberLength: number;

  constructor(readonly definition: Readonly<api.BoletoBancarioRequirednessValidator>) {
    this.fiscalNumberLength = definition.fiscalNumberLength;
  }

  validate(request: ValidatableRequest, fieldId: string): boolean {
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

Object.freeze(ValidationRuleBoletoBancarioRequiredness.prototype);
