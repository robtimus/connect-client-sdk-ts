import * as api from "../../communicator/model";
import { toSizableAsset } from "./Asset";

export function toPaymentProductDisplayHints(json: api.PaymentProductDisplayHints, assetUrl: string) {
  return {
    displayOrder: json.displayOrder,
    label: json.label,
    logo: toSizableAsset(json.logo, assetUrl),
  };
}
