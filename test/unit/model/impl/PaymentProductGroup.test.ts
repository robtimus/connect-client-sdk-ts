/**
 * @group unit:model
 */

import { api } from "../../../../src/communicator/model";
import { toBasicPaymentProductGroup, toBasicPaymentProductGroups, toPaymentProductGroup } from "../../../../src/model/impl/PaymentProductGroup";

const minimalJson: api.PaymentProductGroup = {
  allowsInstallments: false,
  deviceFingerprintEnabled: true,
  displayHints: {
    displayOrder: 0,
    logo: "",
  },
  id: "cards",
};

const fullJson: api.PaymentProductGroup = {
  accountsOnFile: [
    {
      attributes: [],
      displayHints: {
        labelTemplate: [],
        logo: "",
      },
      id: 1,
      paymentProductId: 1,
    },
  ],
  allowsInstallments: false,
  deviceFingerprintEnabled: true,
  displayHints: {
    displayOrder: 0,
    logo: "",
  },
  fields: [
    {
      dataRestrictions: {
        isRequired: true,
        validators: {
          luhn: {},
        },
      },
      id: "cardNumber",
      type: "",
    },
  ],
  id: "cards",
};

describe("toBasicPaymentProductGroup", () => {
  const minimalGroup = toBasicPaymentProductGroup(minimalJson);
  const fullGroup = toBasicPaymentProductGroup(fullJson);

  describe("property mapping", () => {
    test("minimal", () => {
      expect(minimalGroup.accountsOnFile).toStrictEqual([]);
      expect(minimalGroup.allowsInstallments).toBe(minimalJson.allowsInstallments);
      expect(minimalGroup.deviceFingerprintEnabled).toBe(minimalJson.deviceFingerprintEnabled);
      expect(minimalGroup.displayHints).toBe(minimalJson.displayHints);
      expect(minimalGroup.id).toBe(minimalJson.id);
      expect(minimalGroup.type).toBe("group");
    });

    test("full", () => {
      expect(fullGroup.accountsOnFile).toHaveLength(1);
      expect(fullGroup.accountsOnFile[0].id).toBe(1);
      expect(fullGroup.allowsInstallments).toBe(fullJson.allowsInstallments);
      expect(fullGroup.deviceFingerprintEnabled).toBe(fullJson.deviceFingerprintEnabled);
      expect(fullGroup.displayHints).toBe(fullJson.displayHints);
      expect(fullGroup.id).toBe(fullJson.id);
      expect(fullGroup.type).toBe("group");
    });
  });

  describe("findAccountOnFile", () => {
    test("non-matching", () => {
      const result = fullGroup.findAccountOnFile(0);
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = fullGroup.findAccountOnFile(1);
      expect(result).toBe(fullGroup.accountsOnFile[0]);
    });
  });

  describe("getAccountOnFile", () => {
    test("non-matching", () => {
      expect(() => fullGroup.getAccountOnFile(0)).toThrow(new Error("could not find AccountOnFile with id 0"));
    });

    test("matching", () => {
      const result = fullGroup.getAccountOnFile(1);
      expect(result).toBe(fullGroup.accountsOnFile[0]);
    });
  });
});

describe("toBasicPaymentProductGroups", () => {
  describe("property mapping", () => {
    test("minimal", () => {
      const json = {
        paymentProductGroups: [minimalJson],
      };
      const groups = toBasicPaymentProductGroups(json);
      expect(groups.accountsOnFile).toStrictEqual([]);
      expect(groups.paymentProductGroups).toHaveLength(1);
      expect(groups.paymentProductGroups[0].accountsOnFile).toStrictEqual([]);
      expect(groups.paymentProductGroups[0].allowsInstallments).toBe(json.paymentProductGroups[0].allowsInstallments);
      expect(groups.paymentProductGroups[0].deviceFingerprintEnabled).toBe(json.paymentProductGroups[0].deviceFingerprintEnabled);
      expect(groups.paymentProductGroups[0].displayHints).toBe(json.paymentProductGroups[0].displayHints);
      expect(groups.paymentProductGroups[0].id).toBe(json.paymentProductGroups[0].id);
      expect(groups.paymentProductGroups[0].type).toBe("group");
    });

    test("full", () => {
      const json = {
        paymentProductGroups: [fullJson],
      };
      const groups = toBasicPaymentProductGroups(json);
      expect(groups.accountsOnFile).toHaveLength(1);
      expect(groups.accountsOnFile[0].id).toBe(1);
      expect(groups.paymentProductGroups[0].accountsOnFile).toHaveLength(1);
      expect(groups.paymentProductGroups[0].accountsOnFile[0]).toBe(groups.accountsOnFile[0]);
      expect(groups.paymentProductGroups[0].allowsInstallments).toBe(json.paymentProductGroups[0].allowsInstallments);
      expect(groups.paymentProductGroups[0].deviceFingerprintEnabled).toBe(json.paymentProductGroups[0].deviceFingerprintEnabled);
      expect(groups.paymentProductGroups[0].displayHints).toBe(json.paymentProductGroups[0].displayHints);
      expect(groups.paymentProductGroups[0].id).toBe(json.paymentProductGroups[0].id);
      expect(groups.paymentProductGroups[0].type).toBe("group");
    });
  });

  const groups = toBasicPaymentProductGroups({
    paymentProductGroups: [fullJson],
  });

  describe("findPaymentProductGroup", () => {
    test("non-matching", () => {
      const result = groups.findPaymentProductGroup("foo");
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = groups.findPaymentProductGroup("cards");
      expect(result).toBe(groups.paymentProductGroups[0]);
    });
  });

  describe("getPaymentProductGroup", () => {
    test("non-matching", () => {
      expect(() => groups.getPaymentProductGroup("foo")).toThrow(new Error("could not find BasicPaymentProductGroup with id foo"));
    });

    test("matching", () => {
      const result = groups.getPaymentProductGroup("cards");
      expect(result).toBe(groups.paymentProductGroups[0]);
    });
  });

  describe("findAccountOnFile", () => {
    test("non-matching", () => {
      const result = groups.findAccountOnFile(0);
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = groups.findAccountOnFile(1);
      expect(result).toBe(groups.accountsOnFile[0]);
    });
  });

  describe("getAccountOnFile", () => {
    test("non-matching", () => {
      expect(() => groups.getAccountOnFile(0)).toThrow(new Error("could not find AccountOnFile with id 0"));
    });

    test("matching", () => {
      const result = groups.getAccountOnFile(1);
      expect(result).toBe(groups.accountsOnFile[0]);
    });
  });
});

describe("toPaymentProductGroup", () => {
  const minimalGroup = toPaymentProductGroup(minimalJson);
  const fullGroup = toPaymentProductGroup(fullJson);

  describe("property mapping", () => {
    test("minimal", () => {
      expect(minimalGroup.accountsOnFile).toStrictEqual([]);
      expect(minimalGroup.allowsInstallments).toBe(minimalJson.allowsInstallments);
      expect(minimalGroup.deviceFingerprintEnabled).toBe(minimalJson.deviceFingerprintEnabled);
      expect(minimalGroup.displayHints).toBe(minimalJson.displayHints);
      expect(minimalGroup.fields).toStrictEqual([]);
      expect(minimalGroup.id).toBe(minimalJson.id);
      expect(minimalGroup.type).toBe("group");
    });

    test("full", () => {
      expect(fullGroup.accountsOnFile).toHaveLength(1);
      expect(fullGroup.accountsOnFile[0].id).toBe(1);
      expect(fullGroup.allowsInstallments).toBe(fullJson.allowsInstallments);
      expect(fullGroup.deviceFingerprintEnabled).toBe(fullJson.deviceFingerprintEnabled);
      expect(fullGroup.displayHints).toBe(fullJson.displayHints);
      expect(fullGroup.fields).toHaveLength(1);
      expect(fullGroup.fields[0].id).toBe("cardNumber");
      expect(fullGroup.id).toBe(fullJson.id);
      expect(fullGroup.type).toBe("group");
    });
  });

  describe("findAccountOnFile", () => {
    test("non-matching", () => {
      const result = fullGroup.findAccountOnFile(0);
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = fullGroup.findAccountOnFile(1);
      expect(result).toBe(fullGroup.accountsOnFile[0]);
    });
  });

  describe("getAccountOnFile", () => {
    test("non-matching", () => {
      expect(() => fullGroup.getAccountOnFile(0)).toThrow(new Error("could not find AccountOnFile with id 0"));
    });

    test("matching", () => {
      const result = fullGroup.getAccountOnFile(1);
      expect(result).toBe(fullGroup.accountsOnFile[0]);
    });
  });

  describe("findField", () => {
    test("non-matching", () => {
      const result = fullGroup.findField("foo");
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = fullGroup.findField("cardNumber");
      expect(result).toBe(fullGroup.fields[0]);
    });
  });

  describe("getField", () => {
    test("non-matching", () => {
      expect(() => fullGroup.getField("foo")).toThrow(new Error("could not find PaymentProductField with id foo"));
    });

    test("matching", () => {
      const result = fullGroup.getField("cardNumber");
      expect(result).toBe(fullGroup.fields[0]);
    });
  });
});
