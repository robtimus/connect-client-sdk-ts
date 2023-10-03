import { InstallmentDisplayHints, SizeableAsset } from "..";
import * as api from "../../communicator/model";
import { toSizableAsset } from "./Asset";

class InstallmentDisplayHintsImpl implements InstallmentDisplayHints {
  readonly displayOrder: number;
  readonly label: string;
  readonly logo: SizeableAsset;

  constructor(json: api.InstallmentDisplayHints, assetUrl: string) {
    this.displayOrder = json.displayOrder;
    this.label = json.label;
    this.logo = toSizableAsset(json.logo, assetUrl);
  }
}

Object.freeze(InstallmentDisplayHintsImpl.prototype);

export function toInstallmentDisplayHints(json: api.InstallmentDisplayHints, assetUrl: string): InstallmentDisplayHints {
  return new InstallmentDisplayHintsImpl(json, assetUrl);
}
