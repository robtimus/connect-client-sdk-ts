import { LabelTemplateElement } from "..";
import { api } from "../../communicator/model";

export function toLabelTemplateElement(json: api.LabelTemplateElement): LabelTemplateElement {
  const wildcardMask = json.mask && json.mask.replace(/9/g, "*");
  return Object.assign({ wildcardMask }, json);
}
