/**
 * @group unit:model
 */

import * as api from "../../../../src/communicator/model";
import { toInstallmentOptions } from "../../../../src/model/impl/InstallmentOptions";

const fullJson: api.InstallmentOptions = {
  displayHints: {
    displayOrder: 1,
    label: "test",
    logo: "somefilename.png",
  },
  id: "test",
  installmentPlans: [
    {
      amountOfMoneyPerInstallment: {
        amount: 1000,
        currencyCode: "EUR",
      },
      amountOfMoneyTotal: {
        amount: 10000,
        currencyCode: "EUR",
      },
      frequencyOfInstallments: "monthly",
      installmentPlanCode: 0,
      interestRate: "4.000",
      numberOfInstallments: 10,
    },
  ],
};

describe("toInstallmentOptions", () => {
  const fullInstallmentOptions = toInstallmentOptions(fullJson, "http://localhost");

  describe("property mapping", () => {
    test("full", () => {
      expect(fullInstallmentOptions.displayHints?.displayOrder).toBe(1);
      expect(fullInstallmentOptions.id).toBe(fullJson.id);
      expect(fullInstallmentOptions.installmentPlans).toStrictEqual(fullJson.installmentPlans);
    });
  });
});
