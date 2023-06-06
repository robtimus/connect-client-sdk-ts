/**
 * @group unit:model
 */

import { toPaymentProductDisplayHints } from "../../../../src/model/impl/PaymentProductDisplayHints";

describe("toPaymentProductDisplayHints", () => {
  describe("property mapping", () => {
    test("minimal", () => {
      const json = {
        displayOrder: 0,
        logo: "visa.png",
      };
      const displayHints = toPaymentProductDisplayHints(json, "http://localhost");
      expect(displayHints.displayOrder).toBe(json.displayOrder);
      expect(displayHints.label).toBeUndefined();
      expect(displayHints.logo.path).toBe(json.logo);
      expect(displayHints.logo.url).toBe("http://localhost/" + json.logo);
    });

    test("full", () => {
      const json = {
        displayOrder: 0,
        label: "VISA",
        logo: "visa.png",
      };
      const displayHints = toPaymentProductDisplayHints(json, "http://localhost");
      expect(displayHints.displayOrder).toBe(json.displayOrder);
      expect(displayHints.label).toBe(json.label);
      expect(displayHints.logo.path).toBe(json.logo);
      expect(displayHints.logo.url).toBe("http://localhost/" + json.logo);
    });
  });
});
