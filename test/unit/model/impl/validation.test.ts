/**
 * @group unit:validation
 */

import * as dateFormat from "dateformat";
import * as duration from "duration-fns";
import {
  PaymentProduct,
  PaymentRequest,
  ValidationRuleBoletoBancarioRequiredness,
  ValidationRuleEmailAddress,
  ValidationRuleExpirationDate,
  ValidationRuleFixedList,
  ValidationRuleIban,
  ValidationRuleLength,
  ValidationRuleLuhn,
  ValidationRuleRange,
  ValidationRuleRegularExpression,
  ValidationRuleResidentIdNumber,
  ValidationRuleTermsAndConditions,
} from "../../../../src/model";
import { toPaymentProduct } from "../../../../src/model/impl/PaymentProduct";
import { toValidationRuleBoletoBancarioRequiredness } from "../../../../src/model/impl/validation/ValidationRuleBoletoBancarioRequiredness";
import { toValidationRuleEmailAddress } from "../../../../src/model/impl/validation/ValidationRuleEmailAddress";
import { toValidationRuleExpirationDate } from "../../../../src/model/impl/validation/ValidationRuleExpirationDate";
import { toValidationRuleFixedList } from "../../../../src/model/impl/validation/ValidationRuleFixedList";
import { toValidationRuleIban } from "../../../../src/model/impl/validation/ValidationRuleIban";
import { toValidationRuleLength } from "../../../../src/model/impl/validation/ValidationRuleLength";
import { toValidationRuleLuhn } from "../../../../src/model/impl/validation/ValidationRuleLuhn";
import { toValidationRuleRange } from "../../../../src/model/impl/validation/ValidationRuleRange";
import { toValidationRuleRegularExpression } from "../../../../src/model/impl/validation/ValidationRuleRegularExpression";
import { toValidationRuleResidentIdNumber } from "../../../../src/model/impl/validation/ValidationRuleResidentIdNumber";
import { toValidationRuleTermsAndConditions } from "../../../../src/model/impl/validation/ValidationRuleTermsAndConditions";
import { createValidationRule } from "../../../../src/model/impl/validation";
import * as api from "../../../../src/communicator/model";

const fieldId = "testField";
const fiscalNumberFieldId = "fiscalNumber";

const product: PaymentProduct = toPaymentProduct(
  {
    allowsInstallments: false,
    allowsRecurring: false,
    allowsTokenization: false,
    autoTokenized: false,
    deviceFingerprintEnabled: false,
    displayHints: {
      displayOrder: 0,
      logo: "",
    },
    fields: [
      {
        dataRestrictions: {
          isRequired: true,
          validators: {},
        },
        id: fieldId,
        type: "",
      },
      {
        dataRestrictions: {
          isRequired: false,
          validators: {},
        },
        id: fiscalNumberFieldId,
        type: "",
      },
    ],
    id: 1,
    mobileIntegrationLevel: "",
    paymentMethod: "",
    usesRedirectionTo3rdParty: false,
  },
  "http://localhost"
);

describe("validation", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {
      /* do nothing */
    });
  });

  describe("Boleto Bancario requiredness", () => {
    const rule = toValidationRuleBoletoBancarioRequiredness({
      fiscalNumberLength: 10,
    });

    describe("missing value", () => {
      test("fiscalNumber missing", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber empty", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fiscalNumberFieldId, "");
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber of matching length", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fiscalNumberFieldId, "1234567890");
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });

      test("fiscalNumber of non-matching length", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fiscalNumberFieldId, "123456789");
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("empty value", () => {
      describe("validating PaymentRequest", () => {
        test("fiscalNumber missing", () => {
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, "");
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });

        test("fiscalNumber empty", () => {
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, "");
          request.setValue(fiscalNumberFieldId, "");
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });

        test("fiscalNumber of matching length", () => {
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, "");
          request.setValue(fiscalNumberFieldId, "1234567890");
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(false);
        });

        test("fiscalNumber of non-matching length", () => {
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, "");
          request.setValue(fiscalNumberFieldId, "123456789");
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });
      });

      describe("validating value", () => {
        test("fiscalNumber missing", () => {
          const result = rule.validateValue("");
          expect(result).toBe(true);
        });

        test("fiscalNumber empty", () => {
          const result = rule.validateValue("", "");
          expect(result).toBe(true);
        });

        test("fiscalNumber of matching length", () => {
          const result = rule.validateValue("", "1234567890");
          expect(result).toBe(false);
        });

        test("fiscalNumber of non-matching length", () => {
          const result = rule.validateValue("", "123456789");
          expect(result).toBe(true);
        });
      });
    });

    describe("non-empty value", () => {
      describe("validating PaymentRequest", () => {
        test("fiscalNumber missing", () => {
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, "foo");
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });

        test("fiscalNumber empty", () => {
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, "foo");
          request.setValue(fiscalNumberFieldId, "");
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });

        test("fiscalNumber of matching length", () => {
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, "foo");
          request.setValue(fiscalNumberFieldId, "1234567890");
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });

        test("fiscalNumber of non-matching length", () => {
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, "foo");
          request.setValue(fiscalNumberFieldId, "123456789");
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });
      });

      describe("validating string", () => {
        test("fiscalNumber not provided", () => {
          const result = rule.validateValue("foo");
          expect(result).toBe(true);
        });

        test("fiscalNumber empty", () => {
          const result = rule.validateValue("foo", "");
          expect(result).toBe(true);
        });

        test("fiscalNumber of matching length", () => {
          const result = rule.validateValue("foo", "1234567890");
          expect(result).toBe(true);
        });

        test("fiscalNumber of non-matching length", () => {
          const result = rule.validateValue("foo", "123456789");
          expect(result).toBe(true);
        });
      });
    });
  });

  describe("email address", () => {
    const rule = toValidationRuleEmailAddress({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid", () => {
      test.each(["test@example.org", "test.user@example.org", "test@example.co.uk"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("invalid", () => {
      test.each(["@example.org", "test.user@", "test", "example.org"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("expiration date", () => {
    const rule = toValidationRuleExpirationDate({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid", () => {
      describe("current month", () => {
        test.each(["mmyy", "mmyyyy"])("format: %s", (format) => {
          const date = new Date();
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, dateFormat(date, format));
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });
      });

      describe("future value", () => {
        test.each(["mmyy", "mmyyyy"])("format: %s", (format) => {
          const period = duration.parse("P1M");
          const date = duration.apply(new Date(), period);
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, dateFormat(date, format));
          const result = rule.validatePaymentRequest(request, fieldId);
          expect(result).toBe(true);
        });
      });
    });

    test("expired", () => {
      const period = duration.parse("P-1M");
      const date = duration.apply(new Date(), period);
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, dateFormat(date, "mmyy"));
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("exceeding max", () => {
      const year = new Date().getFullYear() + 26;
      const date = new Date(year, 0, 1);
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, dateFormat(date, "mmyy"));
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    describe("invalid", () => {
      test.each(["430", "42030", "1330", "132030"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("fixed list", () => {
    const rule = toValidationRuleFixedList({
      allowedValues: ["foo", "bar"],
    });

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid", () => {
      test.each(rule.allowedValues)("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("invalid", () => {
      test.each(rule.allowedValues.map((s) => s.toUpperCase()))("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("IBAN", () => {
    const rule = toValidationRuleIban({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("valid", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "GB33BUKB20201555555555");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(true);
    });

    describe("invalid", () => {
      test.each(["GB94BARC20201530093459", "G833BUKB20201555555555"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("length", () => {
    const rule = toValidationRuleLength({
      minLength: 2,
      maxLength: 5,
    });
    const ruleAllowingEmpty = toValidationRuleLength({
      minLength: 0,
      maxLength: 5,
    });

    describe("missing value", () => {
      test("minLength > 0", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });

      test("minLength === 0", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        const result = ruleAllowingEmpty.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("empty value", () => {
      test("minLength > 0", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "");
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });

      test("minLength === 0", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "");
        const result = ruleAllowingEmpty.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("valid", () => {
      test.each(["ab", "abc", "abcd", "abcde"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("invalid", () => {
      test.each(["a", "abcdef"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("Luhn", () => {
    const rule = toValidationRuleLuhn({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("valid", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "4242424242424242");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(true);
    });

    test("invalid", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "1142424242424242");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });
  });

  describe("range", () => {
    const rule = toValidationRuleRange({
      minValue: 2,
      maxValue: 5,
    });

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid value", () => {
      test.each(["2", "3", "4", "5"])("as string: %s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });

      test.each([2, 3, 4, 5])("as number: %d", (value) => {
        const result = rule.validateValue(value);
        expect(result).toBe(true);
      });
    });

    describe("invalid value", () => {
      test.each(["0", "1", "6", "2a", "a2"])("as string: %s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });

      test.each([0, 1, 6, NaN])("as number: %d", (value) => {
        const result = rule.validateValue(value);
        expect(result).toBe(false);
      });
    });
  });

  describe("regular expression", () => {
    const rule = toValidationRuleRegularExpression({
      regularExpression: "\\d{4}[A-Z]{2}",
    });

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "1234AB");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(true);
    });

    describe("invalid value", () => {
      test.each(["1234", "1234ab", "x1234ABx"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("resident ID number", () => {
    const rule = toValidationRuleResidentIdNumber({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid value", () => {
      const validValues = [
        "123456789012345", // old ID card format contains only 15 digits and no checksum, this is valid
        "110101202002042275",
        "110101202002049979",
        "11010120200211585X",
        "11010120200211585x",
        "11010120200325451X",
        "11010120200325451x",
      ];
      test.each(validValues)("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("invalid value", () => {
      const invalidValues = [
        "1234567890",
        "12345678901234X",
        "12345678901234x",
        "12345678901234a",
        "110101202002042274",
        "1101012020020227a4",
        "b10101202002049979",
        "15242719920303047X",
        "15242719920303047x",
        "15242719920303047a",
        "11010120200325451xa",
      ];
      test.each(invalidValues)("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("terms and conditions", () => {
    const rule = toValidationRuleTermsAndConditions({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validatePaymentRequest(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid value", () => {
      test("as string", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "true");
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(true);
      });

      test("as boolean", () => {
        const result = rule.validateValue(true);
        expect(result).toBe(true);
      });
    });

    describe("invalid value", () => {
      test.each(["false", "TRUE", "yes"])("as string: %s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validatePaymentRequest(request, fieldId);
        expect(result).toBe(false);
      });

      test("as boolean", () => {
        const result = rule.validateValue(false);
        expect(result).toBe(false);
      });
    });
  });

  describe("factory", () => {
    test("all available", () => {
      const validators: api.PaymentProductFieldValidators = {
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
      };

      const rules = Object.keys(validators).map((id) => createValidationRule(id, validators[id]));
      expect(rules.length).toBe(11);

      const ruleBoletoBancarioRequiredness = rules.find(
        (rule) => rule?.id === "boletoBancarioRequiredness"
      ) as ValidationRuleBoletoBancarioRequiredness;
      expect(ruleBoletoBancarioRequiredness.fiscalNumberLength).toBe(validators.boletoBancarioRequiredness?.fiscalNumberLength);

      const ruleEmailAddress = rules.find((rule) => rule?.id === "emailAddress") as ValidationRuleEmailAddress;
      expect(ruleEmailAddress).toBeTruthy();

      const ruleExpirationDate = rules.find((rule) => rule?.id === "expirationDate") as ValidationRuleExpirationDate;
      expect(ruleExpirationDate).toBeTruthy();

      const ruleFixedList = rules.find((rule) => rule?.id === "fixedList") as ValidationRuleFixedList;
      expect(ruleFixedList.allowedValues).toBe(validators.fixedList?.allowedValues);

      const ruleIban = rules.find((rule) => rule?.id === "iban") as ValidationRuleIban;
      expect(ruleIban).toBeTruthy();

      const ruleLength = rules.find((rule) => rule?.id === "length") as ValidationRuleLength;
      expect(ruleLength.minLength).toBe(validators.length?.minLength);
      expect(ruleLength.maxLength).toBe(validators.length?.maxLength);

      const ruleLuhn = rules.find((rule) => rule?.id === "luhn") as ValidationRuleLuhn;
      expect(ruleLuhn).toBeTruthy();

      const ruleRange = rules.find((rule) => rule?.id === "range") as ValidationRuleRange;
      expect(ruleRange.minValue).toBe(validators.range?.minValue);
      expect(ruleRange.maxValue).toBe(validators.range?.maxValue);

      const ruleRegularExpression = rules.find((rule) => rule?.id === "regularExpression") as ValidationRuleRegularExpression;
      expect(ruleRegularExpression.regularExpression).toBe(validators.regularExpression?.regularExpression);

      const ruleResidentIdNumber = rules.find((rule) => rule?.id === "residentIdNumber") as ValidationRuleResidentIdNumber;
      expect(ruleResidentIdNumber).toBeTruthy();

      const ruleTermsAndConditions = rules.find((rule) => rule?.id === "termsAndConditions") as ValidationRuleTermsAndConditions;
      expect(ruleTermsAndConditions).toBeTruthy();
    });

    test("none available", () => {
      const validators: api.PaymentProductFieldValidators = {};

      const rules = Object.keys(validators).map((id) => createValidationRule(id, validators[id]));
      expect(rules.length).toBe(0);
    });

    test("unknown rule", () => {
      const rule = createValidationRule("unknown", {});
      expect(rule).toBeUndefined();
    });
  });
});
