import { LabelTemplateElement } from "..";
import * as api from "../../communicator/model";

export function toLabelTemplateElement(json: api.LabelTemplateElement): LabelTemplateElement {
  const wildcardMask = json.mask?.replace(/9/g, "*");
  return { ...json, wildcardMask };
}
