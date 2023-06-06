/**
 * @group unit:model
 */

import { toPaymentProductFieldDisplayHints } from "../../../../src/model/impl/PaymentProductFieldDisplayHints";

describe("toPaymentProductFieldDisplayHints", () => {
  test("minimal", () => {
    const json = {
      alwaysShow: false,
      displayOrder: 0,
      formElement: {
        type: "",
        valueMapping: [],
      },
      obfuscate: false,
    };
    const result = toPaymentProductFieldDisplayHints(json, "http://localhost");
    expect(result.alwaysShow).toBe(json.alwaysShow);
    expect(result.displayOrder).toBe(json.displayOrder);
    expect(result.formElement).toBe(json.formElement);
    expect(result.label).toBeUndefined();
    expect(result.link).toBeUndefined();
    expect(result.mask).toBeUndefined();
    expect(result.obfuscate).toBe(json.obfuscate);
    expect(result.placeholderLabel).toBeUndefined();
    expect(result.preferredInputType).toBeUndefined();
    expect(result.tooltip).toBeUndefined();
    expect(result.wildcardMask).toBeUndefined();
  });

  test("full", () => {
    const json = {
      alwaysShow: false,
      displayOrder: 0,
      formElement: {
        type: "",
        valueMapping: [],
      },
      label: "Expiry date",
      link: "http://localhost",
      mask: "{{99}}-{{99}}",
      obfuscate: false,
      placeholderLabel: "mm/YY",
      preferredInputType: "text",
      tooltip: {
        image: "date.png",
        label: "Date",
      },
    };
    const result = toPaymentProductFieldDisplayHints(json, "http://localhost");
    expect(result.alwaysShow).toBe(json.alwaysShow);
    expect(result.displayOrder).toBe(json.displayOrder);
    expect(result.formElement).toBe(json.formElement);
    expect(result.label).toBe(json.label);
    expect(result.link).toBe(json.link);
    expect(result.mask).toBe(json.mask);
    expect(result.obfuscate).toBe(json.obfuscate);
    expect(result.placeholderLabel).toBe(json.placeholderLabel);
    expect(result.preferredInputType).toBe(json.preferredInputType);
    expect(result.tooltip).toBeDefined();
    expect(result.tooltip?.image.path).toBe(json.tooltip.image);
    expect(result.tooltip?.image.url).toBe("http://localhost/" + json.tooltip.image);
    expect(result.wildcardMask).toBe("{{**}}-{{**}}");
  });
});
