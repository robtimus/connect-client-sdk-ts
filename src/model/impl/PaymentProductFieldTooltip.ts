import * as api from "../../communicator/model";
import { toSizableAsset } from "./Asset";

export function toPaymentProductFieldTooltip(json: api.PaymentProductFieldTooltip, assetUrl: string) {
  return {
    image: toSizableAsset(json.image, assetUrl),
    label: json.label,
  };
}
