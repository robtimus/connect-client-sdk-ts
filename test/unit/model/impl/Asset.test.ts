/**
 * @group unit:model
 */

import { toAsset, toSizableAsset } from "../../../../src/model/impl/Asset";

describe("toAsset", () => {
  test("assetUrl ends with /, url starts with /", () => {
    const asset = toAsset("/image.png", "http://localhost/");
    expect(asset.path).toBe("/image.png");
    expect(asset.url).toBe("http://localhost/image.png");
    expect(asset.toString()).toBe("http://localhost/image.png");
  });

  test("assetUrl ends with /, url does not start with /", () => {
    const asset = toAsset("image.png", "http://localhost/");
    expect(asset.path).toBe("image.png");
    expect(asset.url).toBe("http://localhost/image.png");
    expect(asset.toString()).toBe("http://localhost/image.png");
  });

  test("assetUrl does not end with /, url starts with /", () => {
    const asset = toAsset("/image.png", "http://localhost");
    expect(asset.path).toBe("/image.png");
    expect(asset.url).toBe("http://localhost/image.png");
    expect(asset.toString()).toBe("http://localhost/image.png");
  });

  test("assetUrl does not end with /, url does not start with /", () => {
    const asset = toAsset("image.png", "http://localhost");
    expect(asset.path).toBe("image.png");
    expect(asset.url).toBe("http://localhost/image.png");
    expect(asset.toString()).toBe("http://localhost/image.png");
  });
});

describe("toSizableAsset", () => {
  test("url and path", () => {
    const asset = toSizableAsset("image.png", "http://localhost");
    expect(asset.path).toBe("image.png");
    expect(asset.url).toBe("http://localhost/image.png");
    expect(asset.toString()).toBe("http://localhost/image.png");
  });

  describe("sized", () => {
    test("url does not contain ?", () => {
      const asset = toSizableAsset("image.png", "http://localhost").sized(320, 240);
      expect(asset.path).toBe("image.png?size=320x240");
      expect(asset.url).toBe("http://localhost/image.png?size=320x240");
      expect(asset.toString()).toBe("http://localhost/image.png?size=320x240");
    });

    test("url contains ?", () => {
      const asset = toSizableAsset("image.png?q=value", "http://localhost").sized(320, 240);
      expect(asset.path).toBe("image.png?q=value&size=320x240");
      expect(asset.url).toBe("http://localhost/image.png?q=value&size=320x240");
      expect(asset.toString()).toBe("http://localhost/image.png?q=value&size=320x240");
    });
  });
});
