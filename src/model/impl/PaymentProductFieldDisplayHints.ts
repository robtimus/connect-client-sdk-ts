import { PaymentProductFieldDisplayHints } from "..";
import * as api from "../../communicator/model";
import { toPaymentProductFieldTooltip } from "./PaymentProductFieldTooltip";

export function toPaymentProductFieldDisplayHints(json: api.PaymentProductFieldDisplayHints, assetUrl: string): PaymentProductFieldDisplayHints {
  return {
    alwaysShow: json.alwaysShow,
    displayOrder: json.displayOrder,
    formElement: json.formElement,
    label: json.label,
    link: json.link,
    mask: json.mask,
    obfuscate: json.obfuscate,
    placeholderLabel: json.placeholderLabel,
    preferredInputType: json.preferredInputType,
    tooltip: json.tooltip ? toPaymentProductFieldTooltip(json.tooltip, assetUrl) : undefined,
    wildcardMask: json.mask?.replace(/9/g, "*"),
  };
}
