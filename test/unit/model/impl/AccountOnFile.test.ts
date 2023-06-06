/**
 * @group unit:model
 */

import * as api from "../../../../src/communicator/model";
import { toAccountOnFile } from "../../../../src/model/impl/AccountOnFile";

const json: api.AccountOnFile = {
  attributes: [
    {
      key: "cardNumber",
      value: "****",
      status: "READ_ONLY",
    },
    {
      key: "cardholderName",
      value: "John Doe",
      status: "CAN_WRITE",
    },
    {
      key: "expirationDate",
      value: "12**",
      status: "MUST_WRITE",
      mustWriteReason: "EXPIRED",
    },
  ],
  displayHints: {
    labelTemplate: [
      {
        attributeKey: "expirationDate",
        mask: "{{99}}-{{99}}",
      },
    ],
    logo: "logo.png",
  },
  id: 1,
  paymentProductId: 1,
};

describe("toAccountOnFile", () => {
  const accountOnFile = toAccountOnFile(json, "http://localhost");

  test("property mapping", () => {
    expect(accountOnFile.attributes).toStrictEqual(json.attributes);
    expect(accountOnFile.displayHints.labelTemplate).toHaveLength(1);
    expect(accountOnFile.displayHints.labelTemplate[0].wildcardMask).toBe("{{**}}-{{**}}");
    expect(accountOnFile.displayHints.logo.path).toBe(json.displayHints.logo);
    expect(accountOnFile.displayHints.logo.url).toBe("http://localhost/" + json.displayHints.logo);
    expect(accountOnFile.id).toBe(json.id);
    expect(accountOnFile.paymentProductId).toBe(json.paymentProductId);
  });

  test("getLabel", () => {
    const result = accountOnFile.getLabel();
    expect(result).toBe("12-**");
  });

  describe("findAttribute", () => {
    test("non-matching", () => {
      const result = accountOnFile.findAttribute("foo");
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = accountOnFile.findAttribute("expirationDate");
      expect(result).toBe(accountOnFile.attributes[2]);
    });
  });

  describe("getAttribute", () => {
    test("non-matching", () => {
      expect(() => accountOnFile.getAttribute("foo")).toThrow(new Error("could not find AccountOnFileAttribute with key foo"));
    });

    test("matching", () => {
      const result = accountOnFile.getAttribute("expirationDate");
      expect(result).toBe(accountOnFile.attributes[2]);
    });
  });

  describe("findMaskedAttributeValue", () => {
    test("non-matching attribute", () => {
      const result = accountOnFile.findMaskedAttributeValue("foo");
      expect(result).toBeUndefined();
    });

    test("without wildcard mask", () => {
      const result = accountOnFile.findMaskedAttributeValue("cardNumber");
      expect(result).toBeUndefined();
    });

    test("with wildcard mask", () => {
      const result = accountOnFile.findMaskedAttributeValue("expirationDate");
      expect(result).toStrictEqual({
        formattedValue: "12-**",
        cursorIndex: 1,
      });
    });
  });

  describe("findAttributeDisplayValue", () => {
    test("non-matching attribute", () => {
      const result = accountOnFile.findAttributeDisplayValue("foo");
      expect(result).toBeUndefined();
    });

    test("without wildcard mask", () => {
      const result = accountOnFile.findAttributeDisplayValue("cardNumber");
      expect(result).toBe("****");
    });

    test("with wildcard mask", () => {
      const result = accountOnFile.findAttributeDisplayValue("expirationDate");
      expect(result).toBe("12-**");
    });
  });

  describe("getAttributeDisplayValue", () => {
    test("non-matching attribute", () => {
      expect(() => accountOnFile.getAttributeDisplayValue("foo")).toThrow(new Error("could not find AccountOnFileAttribute with key foo"));
    });

    test("without wildcard mask", () => {
      const result = accountOnFile.getAttributeDisplayValue("cardNumber");
      expect(result).toBe("****");
    });

    test("with wildcard mask", () => {
      const result = accountOnFile.getAttributeDisplayValue("expirationDate");
      expect(result).toBe("12-**");
    });
  });

  describe("isReadOnlyAttribute", () => {
    test("non-matching attribute", () => {
      expect(accountOnFile.isReadOnlyAttribute("foo")).toBe(false);
    });

    test("read-only attribute", () => {
      expect(accountOnFile.isReadOnlyAttribute("cardNumber")).toBe(true);
    });

    test("can-write attribute", () => {
      expect(accountOnFile.isReadOnlyAttribute("cardholderName")).toBe(false);
    });

    test("must-write attribute", () => {
      expect(accountOnFile.isReadOnlyAttribute("expirationDate")).toBe(false);
    });
  });
});
