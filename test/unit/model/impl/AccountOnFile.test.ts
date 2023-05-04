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
      key: "expirationDate",
      value: "12**",
      status: "CAN_WRITE",
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
  const accountOnFile = toAccountOnFile(json);

  test("property mapping", () => {
    expect(accountOnFile.attributes).toStrictEqual(json.attributes);
    expect(accountOnFile.displayHints.labelTemplate).toHaveLength(1);
    expect(accountOnFile.displayHints.labelTemplate[0].wildcardMask).toBe("{{**}}-{{**}}");
    expect(accountOnFile.id).toBe(json.id);
    expect(accountOnFile.paymentProductId).toBe(json.paymentProductId);
  });

  describe("findAttribute", () => {
    test("non-matching", () => {
      const result = accountOnFile.findAttribute("foo");
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = accountOnFile.findAttribute("expirationDate");
      expect(result).toBe(accountOnFile.attributes[1]);
    });
  });

  describe("getAttribute", () => {
    test("non-matching", () => {
      expect(() => accountOnFile.getAttribute("foo")).toThrow(new Error("could not find AccountOnFileAttribute with key foo"));
    });

    test("matching", () => {
      const result = accountOnFile.getAttribute("expirationDate");
      expect(result).toBe(accountOnFile.attributes[1]);
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
});
