/**
 * @group unit:model
 */

import { toBasicPaymentItems } from "../../../../src/model/impl/PaymentItem";
import { toBasicPaymentProducts } from "../../../../src/model/impl/PaymentProduct";
import { toBasicPaymentProductGroups } from "../../../../src/model/impl/PaymentProductGroup";

const products = toBasicPaymentProducts({
  paymentProducts: [
    {
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
      allowsRecurring: true,
      allowsTokenization: true,
      autoTokenized: false,
      deviceFingerprintEnabled: true,
      displayHints: {
        displayOrder: 0,
        logo: "",
      },
      id: 1,
      mobileIntegrationLevel: "OPTIMIZED",
      paymentMethod: "cards",
      paymentProductGroup: "cards",
      usesRedirectionTo3rdParty: false,
    },
    {
      allowsInstallments: false,
      allowsRecurring: true,
      allowsTokenization: true,
      autoTokenized: false,
      deviceFingerprintEnabled: true,
      displayHints: {
        displayOrder: 0,
        logo: "",
      },
      id: 809,
      mobileIntegrationLevel: "OPTIMIZED",
      paymentMethod: "redirect",
      usesRedirectionTo3rdParty: false,
    },
    {
      allowsInstallments: false,
      allowsRecurring: true,
      allowsTokenization: true,
      autoTokenized: false,
      deviceFingerprintEnabled: true,
      displayHints: {
        displayOrder: 0,
        logo: "",
      },
      id: 2,
      mobileIntegrationLevel: "OPTIMIZED",
      paymentMethod: "cards",
      paymentProductGroup: "cards",
      usesRedirectionTo3rdParty: false,
    },
  ],
});

const groups = toBasicPaymentProductGroups({
  paymentProductGroups: [
    {
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
      id: "cards",
    },
  ],
});

describe("toBasicPaymentItems", () => {
  test("products only", () => {
    const result = toBasicPaymentItems(products);
    expect(result.accountsOnFile).toHaveLength(1);
    expect(result.accountsOnFile[0]).toBe(products.paymentProducts[0].accountsOnFile[0]);
    expect(result.paymentItems).toHaveLength(products.paymentProducts.length);
    expect(result.paymentItems[0]).toBe(products.paymentProducts[0]);
    expect(result.paymentItems[1]).toBe(products.paymentProducts[1]);
    expect(result.paymentItems[2]).toBe(products.paymentProducts[2]);
  });

  test("products and groups", () => {
    const result = toBasicPaymentItems(products, groups);
    expect(result.accountsOnFile).toHaveLength(1);
    expect(result.accountsOnFile[0]).toBe(groups.paymentProductGroups[0].accountsOnFile[0]);
    expect(result.paymentItems).toHaveLength(2);
    expect(result.paymentItems[0]).toBe(groups.paymentProductGroups[0]);
    expect(result.paymentItems[1]).toBe(products.paymentProducts[1]);
  });

  describe("findPaymentItem", () => {
    test.each([1, 2, "foo"])("non-matching: %s", (id) => {
      const items = toBasicPaymentItems(products, groups);
      const result = items.findPaymentItem(id);
      expect(result).toBeUndefined();
    });

    test("matching product", () => {
      const items = toBasicPaymentItems(products, groups);
      const result = items.findPaymentItem(809);
      expect(result).toBe(products.paymentProducts[1]);
    });

    test("matching group", () => {
      const items = toBasicPaymentItems(products, groups);
      const result = items.findPaymentItem("cards");
      expect(result).toBe(groups.paymentProductGroups[0]);
    });
  });

  describe("getPaymentItem", () => {
    test.each([1, 2, "foo"])("non-matching: %s", (id) => {
      const items = toBasicPaymentItems(products, groups);
      expect(() => items.getPaymentItem(id)).toThrow(new Error(`could not find BasicPaymentItem with id ${id}`));
    });

    test("matching product", () => {
      const items = toBasicPaymentItems(products, groups);
      const result = items.getPaymentItem(809);
      expect(result).toBe(products.paymentProducts[1]);
    });

    test("matching group", () => {
      const items = toBasicPaymentItems(products, groups);
      const result = items.getPaymentItem("cards");
      expect(result).toBe(groups.paymentProductGroups[0]);
    });
  });

  describe("findAccountOnFile", () => {
    test("non-matching", () => {
      const items = toBasicPaymentItems(products, groups);
      const result = items.findAccountOnFile(0);
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const items = toBasicPaymentItems(products, groups);
      const result = items.findAccountOnFile(1);
      expect(result).toBe(groups.accountsOnFile[0]);
    });
  });

  describe("getAccountOnFile", () => {
    test("non-matching", () => {
      const items = toBasicPaymentItems(products, groups);
      expect(() => items.getAccountOnFile(0)).toThrow(new Error("could not find AccountOnFile with id 0"));
    });

    test("matching", () => {
      const items = toBasicPaymentItems(products, groups);
      const result = items.getAccountOnFile(1);
      expect(result).toBe(groups.accountsOnFile[0]);
    });
  });
});
