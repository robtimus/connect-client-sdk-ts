/**
 * @group unit:metadata
 */

import { sdkVersion, sdkIdentifier } from "../../../src/util/metadata";

describe("meta", () => {
  test("sdkVersion", () => {
    expect(sdkVersion).toBe(process.env.npm_package_version);
  });

  test("SdkIdentifier", () => {
    expect(sdkIdentifier).toBe(`${process.env.npm_package_name}/v${process.env.npm_package_version}`);
  });
});
