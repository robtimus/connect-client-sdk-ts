/**
 * @group unit:model
 */

import * as api from "../../../../src/communicator/model";
import { toBasicPaymentProductGroup, toBasicPaymentProductGroups, toPaymentProductGroup } from "../../../../src/model/impl/PaymentProductGroup";

const minimalJson: api.PaymentProductGroup = {
  allowsInstallments: false,
  deviceFingerprintEnabled: true,
  displayHints: {
    displayOrder: 0,
    logo: "cards.png",
  },
  id: "cards",
};

const fullJson: api.PaymentProductGroup = {
  accountsOnFile: [
    {
      attributes: [],
      displayHints: {
        labelTemplate: [],
        logo: "visa.png",
      },
      id: 1,
      paymentProductId: 1,
    },
  ],
  allowsInstallments: false,
  deviceFingerprintEnabled: true,
  displayHints: {
    displayOrder: 0,
    logo: "cards.png",
  },
  fields: [
    {
      dataRestrictions: {
        isRequired: true,
        validators: {
          luhn: {},
        },
      },
      displayHints: {
        alwaysShow: false,
        displayOrder: 1,
        formElement: {
          type: "",
        },
        obfuscate: false,
      },
      id: "cardNumber",
      type: "",
    },
    {
      dataRestrictions: {
        isRequired: true,
        validators: {
          luhn: {},
        },
      },
      id: "expiryDate",
      type: "",
    },
    {
      dataRestrictions: {
        isRequired: true,
        validators: {
          luhn: {},
        },
      },
      displayHints: {
        alwaysShow: false,
        displayOrder: 2,
        formElement: {
          type: "",
        },
        obfuscate: false,
      },
      id: "cvv",
      type: "",
    },
  ],
  id: "cards",
};

describe("toBasicPaymentProductGroup", () => {
  const minimalGroup = toBasicPaymentProductGroup(minimalJson, "http://localhost");
  const fullGroup = toBasicPaymentProductGroup(fullJson, "http://localhost");

  describe("property mapping", () => {
    test("minimal", () => {
      expect(minimalGroup.accountsOnFile).toStrictEqual([]);
      expect(minimalGroup.allowsInstallments).toBe(minimalJson.allowsInstallments);
      expect(minimalGroup.deviceFingerprintEnabled).toBe(minimalJson.deviceFingerprintEnabled);
      expect(minimalGroup.displayHints.displayOrder).toBe(minimalJson.displayHints.displayOrder);
      expect(minimalGroup.displayHints.label).toBe(minimalJson.displayHints.label);
      expect(minimalGroup.displayHints.logo.path).toBe(minimalJson.displayHints.logo);
      expect(minimalGroup.displayHints.logo.url).toBe("http://localhost/" + minimalJson.displayHints.logo);
      expect(minimalGroup.id).toBe(minimalJson.id);
      expect(minimalGroup.type).toBe("group");
    });

    test("full", () => {
      expect(fullGroup.accountsOnFile).toHaveLength(1);
      expect(fullGroup.accountsOnFile[0].id).toBe(1);
      expect(fullGroup.allowsInstallments).toBe(fullJson.allowsInstallments);
      expect(fullGroup.deviceFingerprintEnabled).toBe(fullJson.deviceFingerprintEnabled);
      expect(fullGroup.displayHints.displayOrder).toBe(fullJson.displayHints.displayOrder);
      expect(fullGroup.displayHints.label).toBe(fullJson.displayHints.label);
      expect(fullGroup.displayHints.logo.path).toBe(fullJson.displayHints.logo);
      expect(fullGroup.displayHints.logo.url).toBe("http://localhost/" + fullJson.displayHints.logo);
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
      const groups = toBasicPaymentProductGroups(json, "http://localhost");
      expect(groups.accountsOnFile).toStrictEqual([]);
      expect(groups.paymentProductGroups).toHaveLength(1);
      expect(groups.paymentProductGroups[0].accountsOnFile).toStrictEqual([]);
      expect(groups.paymentProductGroups[0].allowsInstallments).toBe(minimalJson.allowsInstallments);
      expect(groups.paymentProductGroups[0].deviceFingerprintEnabled).toBe(minimalJson.deviceFingerprintEnabled);
      expect(groups.paymentProductGroups[0].displayHints.displayOrder).toBe(minimalJson.displayHints.displayOrder);
      expect(groups.paymentProductGroups[0].displayHints.label).toBe(minimalJson.displayHints.label);
      expect(groups.paymentProductGroups[0].displayHints.logo.path).toBe(minimalJson.displayHints.logo);
      expect(groups.paymentProductGroups[0].displayHints.logo.url).toBe("http://localhost/" + minimalJson.displayHints.logo);
      expect(groups.paymentProductGroups[0].id).toBe(minimalJson.id);
      expect(groups.paymentProductGroups[0].type).toBe("group");
    });

    test("full", () => {
      const json = {
        paymentProductGroups: [fullJson],
      };
      const groups = toBasicPaymentProductGroups(json, "http://localhost");
      expect(groups.accountsOnFile).toHaveLength(1);
      expect(groups.accountsOnFile[0].id).toBe(1);
      expect(groups.paymentProductGroups[0].accountsOnFile).toHaveLength(1);
      expect(groups.paymentProductGroups[0].accountsOnFile[0]).toBe(groups.accountsOnFile[0]);
      expect(groups.paymentProductGroups[0].allowsInstallments).toBe(fullJson.allowsInstallments);
      expect(groups.paymentProductGroups[0].deviceFingerprintEnabled).toBe(fullJson.deviceFingerprintEnabled);
      expect(groups.paymentProductGroups[0].displayHints.displayOrder).toBe(fullJson.displayHints.displayOrder);
      expect(groups.paymentProductGroups[0].displayHints.label).toBe(fullJson.displayHints.label);
      expect(groups.paymentProductGroups[0].displayHints.logo.path).toBe(fullJson.displayHints.logo);
      expect(groups.paymentProductGroups[0].displayHints.logo.url).toBe("http://localhost/" + fullJson.displayHints.logo);
      expect(groups.paymentProductGroups[0].id).toBe(fullJson.id);
      expect(groups.paymentProductGroups[0].type).toBe("group");
    });

    test("sorting", () => {
      const json = {
        paymentProductGroups: [
          {
            allowsInstallments: false,
            deviceFingerprintEnabled: false,
            displayHints: {
              displayOrder: 1,
              logo: "dummy.png",
            },
            id: "dummy",
          },
          fullJson,
        ],
      };
      const groups = toBasicPaymentProductGroups(json, "http://localhost");
      expect(groups.paymentProductGroups[0].id).toBe(fullJson.id);
      expect(groups.paymentProductGroups[1].id).not.toBe(fullJson.id);
      expect(groups.paymentProductGroups[1].id).toBe(json.paymentProductGroups[0].id);
    });
  });

  const groups = toBasicPaymentProductGroups(
    {
      paymentProductGroups: [fullJson],
    },
    "http://localhost"
  );

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
  const minimalGroup = toPaymentProductGroup(minimalJson, "http://localhost");
  const fullGroup = toPaymentProductGroup(fullJson, "http://localhost");

  describe("property mapping", () => {
    test("minimal", () => {
      expect(minimalGroup.accountsOnFile).toStrictEqual([]);
      expect(minimalGroup.allowsInstallments).toBe(minimalJson.allowsInstallments);
      expect(minimalGroup.deviceFingerprintEnabled).toBe(minimalJson.deviceFingerprintEnabled);
      expect(minimalGroup.displayHints.displayOrder).toBe(minimalJson.displayHints.displayOrder);
      expect(minimalGroup.displayHints.label).toBe(minimalJson.displayHints.label);
      expect(minimalGroup.displayHints.logo.path).toBe(minimalJson.displayHints.logo);
      expect(minimalGroup.displayHints.logo.url).toBe("http://localhost/" + minimalJson.displayHints.logo);
      expect(minimalGroup.fields).toStrictEqual([]);
      expect(minimalGroup.id).toBe(minimalJson.id);
      expect(minimalGroup.type).toBe("group");
    });

    test("full", () => {
      expect(fullGroup.accountsOnFile).toHaveLength(1);
      expect(fullGroup.accountsOnFile[0].id).toBe(1);
      expect(fullGroup.allowsInstallments).toBe(fullJson.allowsInstallments);
      expect(fullGroup.deviceFingerprintEnabled).toBe(fullJson.deviceFingerprintEnabled);
      expect(fullGroup.displayHints.displayOrder).toBe(fullJson.displayHints.displayOrder);
      expect(fullGroup.displayHints.label).toBe(fullJson.displayHints.label);
      expect(fullGroup.displayHints.logo.path).toBe(fullJson.displayHints.logo);
      expect(fullGroup.displayHints.logo.url).toBe("http://localhost/" + fullJson.displayHints.logo);
      expect(fullGroup.fields).toHaveLength(3);
      expect(fullGroup.fields[0].id).toBe("expiryDate");
      expect(fullGroup.fields[1].id).toBe("cardNumber");
      expect(fullGroup.fields[2].id).toBe("cvv");
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
      expect(result).toBe(fullGroup.fields[1]);
    });
  });

  describe("getField", () => {
    test("non-matching", () => {
      expect(() => fullGroup.getField("foo")).toThrow(new Error("could not find PaymentProductField with id foo"));
    });

    test("matching", () => {
      const result = fullGroup.getField("cardNumber");
      expect(result).toBe(fullGroup.fields[1]);
    });
  });
});
