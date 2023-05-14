import { PaymentProductFieldDisplayHints } from "..";
import * as api from "../../communicator/model";

export function toPaymentProductFieldDisplayHints(json: api.PaymentProductFieldDisplayHints): PaymentProductFieldDisplayHints {
  const wildcardMask = json.mask?.replace(/9/g, "*");
  return Object.assign({ wildcardMask }, json);
}
