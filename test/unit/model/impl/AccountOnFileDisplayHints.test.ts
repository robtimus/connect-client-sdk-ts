/**
 * @group unit:model
 */

import * as api from "../../../../src/communicator/model";
import { toAccountOnFileDisplayHints } from "../../../../src/model/impl/AccountOnFileDisplayHints";

const json: api.AccountOnFileDisplayHints = {
  labelTemplate: [
    {
      attributeKey: "expirationDate",
      mask: "{{99}}-{{99}}",
    },
  ],
  logo: "logo.png",
};

describe("toAccountOnFileDisplayHints", () => {
  const displayHints = toAccountOnFileDisplayHints(json, "http://localhost");

  test("property mapping", () => {
    expect(displayHints.labelTemplate).toHaveLength(1);
    expect(displayHints.labelTemplate[0].attributeKey).toBe(json.labelTemplate[0].attributeKey);
    expect(displayHints.labelTemplate[0].mask).toBe(json.labelTemplate[0].mask);
    expect(displayHints.labelTemplate[0].wildcardMask).toBe("{{**}}-{{**}}");
    expect(displayHints.logo.path).toBe(json.logo);
    expect(displayHints.logo.url).toBe("http://localhost/" + json.logo);
  });

  describe("findLabelTemplate", () => {
    test("non-matching", () => {
      const result = displayHints.findLabelTemplate("foo");
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = displayHints.findLabelTemplate("expirationDate");
      expect(result?.mask).toBe(json.labelTemplate[0].mask);
    });
  });

  describe("getLabelTemplate", () => {
    test("non-matching", () => {
      expect(() => displayHints.getLabelTemplate("foo")).toThrow(new Error("could not find LabelTemplate with attributeKey foo"));
    });

    test("matching", () => {
      const result = displayHints.getLabelTemplate("expirationDate");
      expect(result.mask).toBe(json.labelTemplate[0].mask);
    });
  });
});
