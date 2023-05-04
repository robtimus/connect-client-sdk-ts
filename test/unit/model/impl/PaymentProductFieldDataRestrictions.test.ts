/**
 * @group unit:model
 */

import * as api from "../../../../src/communicator/model";
import { toPaymentProductFieldDataRestrictions } from "../../../../src/model/impl/PaymentProductFieldDataRestrictions";

describe("toPaymentProductFieldDataRestrictions", () => {
  const minimalJson: api.PaymentProductFieldDataRestrictions = {
    isRequired: true,
    validators: {},
  };

  const jsonWithUndefinedValidator: api.PaymentProductFieldDataRestrictions = {
    isRequired: true,
    validators: {
      length: undefined,
    },
  };

  const fullJson: api.PaymentProductFieldDataRestrictions = {
    isRequired: true,
    validators: {
      boletoBancarioRequiredness: {
        fiscalNumberLength: 10,
      },
      emailAddress: {},
      expirationDate: {},
      fixedList: {
        allowedValues: ["foo", "bar"],
      },
      iban: {},
      length: {
        minLength: 2,
        maxLength: 5,
      },
      luhn: {},
      range: {
        minValue: 2,
        maxValue: 5,
      },
      regularExpression: {
        regularExpression: "\\d+",
      },
      residentIdNumber: {},
      termsAndConditions: {},
    },
  };

  describe("property mapping", () => {
    test("minimal", () => {
      const result = toPaymentProductFieldDataRestrictions(minimalJson);
      expect(result.isRequired).toBe(true);
      expect(result.validationRules).toStrictEqual([]);
    });

    test("with undefined validators", () => {
      const result = toPaymentProductFieldDataRestrictions(jsonWithUndefinedValidator);
      expect(result.isRequired).toBe(true);
      expect(result.validationRules).toStrictEqual([]);
    });

    test("full", () => {
      const result = toPaymentProductFieldDataRestrictions(fullJson);
      expect(result.isRequired).toBe(true);
      expect(result.validationRules).toHaveLength(11);
      expect(result.validationRules.map((rule) => rule.id)).toStrictEqual([
        "boletoBancarioRequiredness",
        "emailAddress",
        "expirationDate",
        "fixedList",
        "iban",
        "length",
        "luhn",
        "range",
        "regularExpression",
        "residentIdNumber",
        "termsAndConditions",
      ]);
    });
  });

  describe("findValidationRule", () => {
    test("non-matching", () => {
      const dataRestrictions = toPaymentProductFieldDataRestrictions(fullJson);
      const result = dataRestrictions.findValidationRule("foo");
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const dataRestrictions = toPaymentProductFieldDataRestrictions(fullJson);
      const result = dataRestrictions.findValidationRule("length");
      expect(result).toHaveProperty("minLength", fullJson.validators.length?.minLength);
      expect(result).toHaveProperty("maxLength", fullJson.validators.length?.maxLength);
    });
  });

  describe("getValidationRule", () => {
    test("non-matching", () => {
      const dataRestrictions = toPaymentProductFieldDataRestrictions(fullJson);
      expect(() => dataRestrictions.getValidationRule("foo")).toThrow(new Error("could not find ValidationRule with id foo"));
    });

    test("matching", () => {
      const dataRestrictions = toPaymentProductFieldDataRestrictions(fullJson);
      const result = dataRestrictions.getValidationRule("length");
      expect(result).toHaveProperty("minLength", fullJson.validators.length?.minLength);
      expect(result).toHaveProperty("maxLength", fullJson.validators.length?.maxLength);
    });
  });
});
