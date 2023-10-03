/**
 * @group unit:model
 */

import * as api from "../../../../src/communicator/model";
import { toInstallmentOptionsResponse } from "../../../../src/model/impl/InstallmentOptionsResponse";

const fullJson: api.InstallmentOptionsResponse = {
  installmentOptions: [
    {
      displayHints: {
        displayOrder: 2,
        label: "test2",
        logo: "somefilename.png",
      },
      id: "test2",
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
          interestRate: "4.000",
          numberOfInstallments: 10,
        },
      ],
    },
    {
      displayHints: {
        displayOrder: 1,
        label: "test1",
        logo: "somefilename.png",
      },
      id: "test1",
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
    },
  ],
};

describe("toInstallmentOptionsResponse", () => {
  const fullInstallmentOptionsResponse = toInstallmentOptionsResponse(fullJson, "http://localhost");

  describe("property mapping", () => {
    test("full", () => {
      expect(fullInstallmentOptionsResponse.installmentOptions).toHaveLength(2);
      expect(fullInstallmentOptionsResponse.installmentOptions[0].displayHints?.displayOrder).toBe(1);
      expect(fullInstallmentOptionsResponse.installmentOptions[0].id).toBe(fullJson.installmentOptions[1].id);
      expect(fullInstallmentOptionsResponse.installmentOptions[0].installmentPlans).toStrictEqual(fullJson.installmentOptions[1].installmentPlans);
      expect(fullInstallmentOptionsResponse.installmentOptions[1].displayHints?.displayOrder).toBe(2);
      expect(fullInstallmentOptionsResponse.installmentOptions[1].id).toBe(fullJson.installmentOptions[0].id);
      expect(fullInstallmentOptionsResponse.installmentOptions[1].installmentPlans).toStrictEqual(fullJson.installmentOptions[0].installmentPlans);
    });
  });
});
