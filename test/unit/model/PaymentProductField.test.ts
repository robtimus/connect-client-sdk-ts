/**
 * @group unit:model
 */

import { api } from "../../../src/communicator/model";
import { toPaymentProductField } from "../../../src/model/PaymentProductField";

const minimalJson: api.PaymentProductField = {
  dataRestrictions: {
    isRequired: true,
    validators: {
      luhn: {},
    },
  },
  id: "expirationDate",
  type: "numericstring",
};

const jsonWithoutMask: api.PaymentProductField = {
  dataRestrictions: {
    isRequired: true,
    validators: {
      luhn: {},
    },
  },
  displayHints: {
    alwaysShow: true,
    displayOrder: 0,
    formElement: {
      type: "text",
    },
    obfuscate: false,
  },
  id: "expirationDate",
  type: "numericstring",
};

const fullJson: api.PaymentProductField = {
  dataRestrictions: {
    isRequired: true,
    validators: {
      luhn: {},
    },
  },
  displayHints: {
    alwaysShow: true,
    displayOrder: 0,
    formElement: {
      type: "text",
    },
    mask: "{{99}}-{{99}}",
    obfuscate: true,
  },
  id: "expirationDate",
  type: "numericstring",
  usedForLookup: false,
};

describe("toPaymentProductField", () => {
  const minimalField = toPaymentProductField(minimalJson);
  const fieldWithoutMask = toPaymentProductField(jsonWithoutMask);
  const fullField = toPaymentProductField(fullJson);

  describe("property mapping", () => {
    test("minimal", () => {
      expect(minimalField.dataRestrictions.isRequired).toBe(true);
      expect(minimalField.dataRestrictions.findValidationRule("luhn")).not.toBeUndefined();
      expect(minimalField.displayHints).toBeUndefined();
      expect(minimalField.id).toBe(minimalJson.id);
      expect(minimalField.type).toBe(minimalJson.type);
      expect(minimalField.usedForLookup).toBeUndefined();
    });

    test("full", () => {
      expect(fullField.dataRestrictions.isRequired).toBe(true);
      expect(fullField.dataRestrictions.findValidationRule("luhn")).not.toBeUndefined();
      expect(fullField.displayHints?.displayOrder).toBe(0);
      expect(fullField.id).toBe(fullJson.id);
      expect(fullField.type).toBe(fullJson.type);
      expect(fullField.usedForLookup).toBe(fullJson.usedForLookup);
    });
  });

  describe("applyMask", () => {
    test("without display hints", () => {
      const result = minimalField.applyMask("1230");
      expect(result).toStrictEqual({
        formattedValue: "1230",
        cursorIndex: 1,
      });
    });

    test("without mask", () => {
      const result = fieldWithoutMask.applyMask("1230");
      expect(result).toStrictEqual({
        formattedValue: "1230",
        cursorIndex: 1,
      });
    });

    test("with mask", () => {
      const result = fullField.applyMask("1230");
      expect(result).toStrictEqual({
        formattedValue: "12-30",
        cursorIndex: 1,
      });
    });
  });

  describe("applyWildcardMask", () => {
    test("without display hints", () => {
      const result = minimalField.applyWildcardMask("1230");
      expect(result).toStrictEqual({
        formattedValue: "1230",
        cursorIndex: 1,
      });
    });

    test("without mask", () => {
      const result = fieldWithoutMask.applyWildcardMask("1230");
      expect(result).toStrictEqual({
        formattedValue: "1230",
        cursorIndex: 1,
      });
    });

    test("with mask", () => {
      const result = fullField.applyWildcardMask("1230");
      expect(result).toStrictEqual({
        formattedValue: "12-30",
        cursorIndex: 1,
      });
    });
  });

  describe("removeMask", () => {
    test("without display hints", () => {
      const result = minimalField.removeMask("12-30");
      expect(result).toBe("12-30");
    });

    test("without mask", () => {
      const result = fieldWithoutMask.removeMask("12-30");
      expect(result).toBe("12-30");
    });

    test("with mask", () => {
      const result = fullField.removeMask("12-30");
      expect(result).toBe("1230");
    });
  });
});
