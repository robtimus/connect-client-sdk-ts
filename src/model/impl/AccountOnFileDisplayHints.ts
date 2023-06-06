import { AccountOnFileDisplayHints, LabelTemplateElement, SizeableAsset } from "..";
import * as api from "../../communicator/model";
import { toSizableAsset } from "./Asset";
import { toLabelTemplateElement } from "./LabelTemplateElement";

class AccountOnFileDisplayHintsImpl implements AccountOnFileDisplayHints {
  readonly labelTemplate: LabelTemplateElement[];
  readonly logo: SizeableAsset;

  constructor(json: api.AccountOnFileDisplayHints, assetUrl: string) {
    this.labelTemplate = json.labelTemplate.map(toLabelTemplateElement);
    this.logo = toSizableAsset(json.logo, assetUrl);
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

export function toAccountOnFileDisplayHints(json: api.AccountOnFileDisplayHints, assetUrl: string): AccountOnFileDisplayHints {
  return new AccountOnFileDisplayHintsImpl(json, assetUrl);
}
