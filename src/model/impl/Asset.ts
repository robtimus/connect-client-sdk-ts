import { Asset, SizeableAsset } from "..";

function prefixWithAssetUrl(url: string, assetUrl: string): string {
  if (assetUrl.endsWith("/") && url.startsWith("/")) {
    return assetUrl + url.substring(1);
  }
  if (!assetUrl.endsWith("/") && !url.startsWith("/")) {
    return assetUrl + "/" + url;
  }
  // Either assetUrl ends with / or url starts with / - use that
  return assetUrl + url;
}

class AssetImpl implements Asset {
  readonly url: string;

  constructor(readonly path: string, assetUrl: string) {
    this.url = prefixWithAssetUrl(path, assetUrl);
  }

  toString() {
    return this.url;
  }
}

Object.freeze(AssetImpl.prototype);

class SizeableAssetImpl extends AssetImpl implements SizeableAsset {
  readonly #assetUrl;

  constructor(readonly path: string, assetUrl: string) {
    super(path, assetUrl);
    this.#assetUrl = assetUrl;
  }

  sized(width: number, height: number): Asset {
    const separator = this.path.includes("?") ? "&" : "?";
    const addition = `${separator}size=${width}x${height}`;
    return new AssetImpl(this.path + addition, this.#assetUrl);
  }
}

Object.freeze(SizeableAssetImpl.prototype);

export function toAsset(path: string, assetUrl: string) {
  return new AssetImpl(path, assetUrl);
}

export function toSizableAsset(path: string, assetUrl: string) {
  return new SizeableAssetImpl(path, assetUrl);
}
