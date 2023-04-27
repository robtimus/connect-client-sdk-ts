import { AccountOnFileDisplayHints, LabelTemplateElement } from ".";
import { api } from "../communicator/model";
import { toLabelTemplateElement } from "./LabelTemplateElement";

class AccountOnFileDisplayHintsImpl implements AccountOnFileDisplayHints {
  readonly labelTemplate: LabelTemplateElement[];
  readonly logo: string;

  constructor(json: api.AccountOnFileDisplayHints) {
    this.labelTemplate = json.labelTemplate.map(toLabelTemplateElement);
    this.logo = json.logo;
  }

  findLabelTemplate(attributeKey: string): LabelTemplateElement | undefined {
    return this.labelTemplate.find((element) => element.attributeKey === attributeKey);
  }

  getLabelTemplate(attributeKey: string): LabelTemplateElement {
    const labelTemplate = this.findLabelTemplate(attributeKey);
    if (labelTemplate) {
      return labelTemplate;
    }
    throw new Error(`could not find LabelTemplate with attributeKey ${attributeKey}`);
  }
}

Object.freeze(AccountOnFileDisplayHintsImpl.prototype);

export function toAccountOnFileDisplayHints(json: api.AccountOnFileDisplayHints): AccountOnFileDisplayHints {
  return new AccountOnFileDisplayHintsImpl(json);
}
