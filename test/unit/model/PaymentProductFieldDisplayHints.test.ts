/**
 * @group unit:model
 */

import { toPaymentProductFieldDisplayHints } from "../../../src/model/PaymentProductFieldDisplayHints";

describe("toPaymentProductFieldDisplayHints", () => {
  test("without mask", () => {
    const json = {
      alwaysShow: false,
      displayOrder: 0,
      formElement: {
        type: "",
        valueMapping: [],
      },
      obfuscate: false,
    };
    const result = toPaymentProductFieldDisplayHints(json);
    expect(result.wildcardMask).toBeUndefined();
  });

  test("with mask", () => {
    const json = {
      alwaysShow: false,
      displayOrder: 0,
      formElement: {
        type: "",
        valueMapping: [],
      },
      mask: "{{99}}-{{99}}",
      obfuscate: false,
    };
    const result = toPaymentProductFieldDisplayHints(json);
    expect(result.wildcardMask).toBe("{{**}}-{{**}}");
  });
});
