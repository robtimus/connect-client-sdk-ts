/**
 * @group unit:model
 */

import { toPaymentProductFieldTooltip } from "../../../../src/model/impl/PaymentProductFieldTooltip";

describe("toPaymentProductFieldTooltip", () => {
  describe("property mapping", () => {
    test("minimal", () => {
      const json = {
        image: "cvv.png",
      };
      const tooltip = toPaymentProductFieldTooltip(json, "http://localhost");
      expect(tooltip.image.path).toBe(json.image);
      expect(tooltip.image.url).toBe("http://localhost/" + json.image);
      expect(tooltip.label).toBeUndefined();
    });

    test("full", () => {
      const json = {
        image: "cvv.png",
        label: "CVV",
      };
      const tooltip = toPaymentProductFieldTooltip(json, "http://localhost");
      expect(tooltip.image.path).toBe(json.image);
      expect(tooltip.image.url).toBe("http://localhost/" + json.image);
      expect(tooltip.label).toBe(json.label);
    });
  });
});
