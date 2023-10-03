/**
 * @group unit:model
 */

import { toInstallmentDisplayHints } from "../../../../src/model/impl/InstallmentDisplayHints";

describe("toInstallmentDisplayHints", () => {
  describe("property mapping", () => {
    test("full", () => {
      const json = {
        displayOrder: 0,
        label: "VISA",
        logo: "somefilename.png",
      };
      const displayHints = toInstallmentDisplayHints(json, "http://localhost");
      expect(displayHints.displayOrder).toBe(json.displayOrder);
      expect(displayHints.label).toBe(json.label);
      expect(displayHints.logo.path).toBe(json.logo);
      expect(displayHints.logo.url).toBe("http://localhost/" + json.logo);
    });
  });
});
