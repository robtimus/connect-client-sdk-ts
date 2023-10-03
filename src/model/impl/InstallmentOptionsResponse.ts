import { InstallmentOptionsResponse } from "..";
import * as api from "../../communicator/model";
import { toInstallmentOptions } from "./InstallmentOptions";

export function toInstallmentOptionsResponse(json: api.InstallmentOptionsResponse, assetUrl: string): InstallmentOptionsResponse {
  return {
    installmentOptions: json.installmentOptions
      .map((options) => toInstallmentOptions(options, assetUrl))
      .sort((o1, o2) => o1.displayHints.displayOrder - o2.displayHints.displayOrder),
  };
}
