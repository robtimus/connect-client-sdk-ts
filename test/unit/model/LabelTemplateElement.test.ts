/**
 * @group unit:model
 */

import { toLabelTemplateElement } from "../../../src/model/LabelTemplateElement";

describe("toLabelTemplateElement", () => {
  test("without mask", () => {
    const json = {
      attributeKey: "expirationDate",
    };
    const result = toLabelTemplateElement(json);
    expect(result.wildcardMask).toBeUndefined();
  });

  test("with mask", () => {
    const json = {
      attributeKey: "expirationDate",
      mask: "{{99}}-{{99}}",
    };
    const result = toLabelTemplateElement(json);
    expect(result.wildcardMask).toBe("{{**}}-{{**}}");
  });
});
