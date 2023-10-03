import { InstallmentOptions } from "..";
import * as api from "../../communicator/model";
import { toInstallmentDisplayHints } from "./InstallmentDisplayHints";

export function toInstallmentOptions(json: api.InstallmentOptions, assetUrl: string): InstallmentOptions {
  return {
    displayHints: toInstallmentDisplayHints(json.displayHints, assetUrl),
    id: json.id,
    installmentPlans: json.installmentPlans,
  };
}
