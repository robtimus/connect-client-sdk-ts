/**
 * @group unit:validation
 */

import * as dateFormat from "dateformat";
import * as duration from "duration-fns";
import { PaymentProduct } from "../../src/model";
import { toPaymentProduct } from "../../src/model/PaymentProduct";
import { PaymentRequest } from "../../src/model/PaymentRequest";
import { ValidationRuleBoletoBancarioRequiredness } from "../../src/validation/ValidationRuleBoletoBancarioRequiredness";
import { ValidationRuleEmailAddress } from "../../src/validation/ValidationRuleEmailAddress";
import { ValidationRuleExpirationDate } from "../../src/validation/ValidationRuleExpirationDate";
import { ValidationRuleFixedList } from "../../src/validation/ValidationRuleFixedList";
import { ValidationRuleIban } from "../../src/validation/ValidationRuleIban";
import { ValidationRuleLength } from "../../src/validation/ValidationRuleLength";
import { ValidationRuleLuhn } from "../../src/validation/ValidationRuleLuhn";
import { ValidationRuleRange } from "../../src/validation/ValidationRuleRange";
import { ValidationRuleRegularExpression } from "../../src/validation/ValidationRuleRegularExpression";
import { ValidationRuleResidentIdNumber } from "../../src/validation/ValidationRuleResidentIdNumber";
import { ValidationRuleTermsAndConditions } from "../../src/validation/ValidationRuleTermsAndConditions";
import { createValidationRule } from "../../src/validation/factory";
import { api } from "../../src/communicator/model";

const fieldId = "testField";
const fiscalNumberFieldId = "fiscalNumber";

const product: PaymentProduct = toPaymentProduct({
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
});

describe("validation", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {
      /* do nothing */
    });
  });

  describe("Boleto Bancario requiredness", () => {
    const rule = new ValidationRuleBoletoBancarioRequiredness({
      fiscalNumberLength: 10,
    });

    describe("missing value", () => {
      test("fiscalNumber missing", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber empty", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fiscalNumberFieldId, "");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber of matching length", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fiscalNumberFieldId, "1234567890");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });

      test("fiscalNumber of non-matching length", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fiscalNumberFieldId, "123456789");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("empty value", () => {
      test("fiscalNumber missing", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber empty", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "");
        request.setValue(fiscalNumberFieldId, "");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber of matching length", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "");
        request.setValue(fiscalNumberFieldId, "1234567890");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });

      test("fiscalNumber of non-matching length", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "");
        request.setValue(fiscalNumberFieldId, "123456789");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("non-empty value", () => {
      test("fiscalNumber missing", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "foo");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber empty", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "foo");
        request.setValue(fiscalNumberFieldId, "");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber of matching length", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "foo");
        request.setValue(fiscalNumberFieldId, "1234567890");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });

      test("fiscalNumber of non-matching length", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "foo");
        request.setValue(fiscalNumberFieldId, "123456789");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });
    });
  });

  describe("email address", () => {
    const rule = new ValidationRuleEmailAddress({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid", () => {
      test.each(["test@example.org", "test.user@example.org", "test@example.co.uk"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("invalid", () => {
      test.each(["@example.org", "test.user@", "test", "example.org"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("expiration date", () => {
    const rule = new ValidationRuleExpirationDate({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid", () => {
      describe("current month", () => {
        test.each(["mmyy", "mmyyyy"])("format: %s", (format) => {
          const date = new Date();
          const request = new PaymentRequest();
          request.setPaymentProduct(product);
          request.setValue(fieldId, dateFormat(date, format));
          const result = rule.validate(request, fieldId);
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
          const result = rule.validate(request, fieldId);
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
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("exceeding max", () => {
      const year = new Date().getFullYear() + 26;
      const date = new Date(year, 0, 1);
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, dateFormat(date, "mmyy"));
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    describe("invalid", () => {
      test.each(["430", "42030", "1330", "132030"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("fixed list", () => {
    const rule = new ValidationRuleFixedList({
      allowedValues: ["foo", "bar"],
    });

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid", () => {
      test.each(rule.allowedValues)("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("invalid", () => {
      test.each(rule.allowedValues.map((s) => s.toUpperCase()))("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("IBAN", () => {
    const rule = new ValidationRuleIban({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("valid", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "GB33BUKB20201555555555");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(true);
    });

    describe("invalid", () => {
      test.each(["GB94BARC20201530093459", "G833BUKB20201555555555"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("length", () => {
    const rule = new ValidationRuleLength({
      minLength: 2,
      maxLength: 5,
    });
    const ruleAllowingEmpty = new ValidationRuleLength({
      minLength: 0,
      maxLength: 5,
    });

    describe("missing value", () => {
      test("minLength > 0", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });

      test("minLength === 0", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        const result = ruleAllowingEmpty.validate(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("empty value", () => {
      test("minLength > 0", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "");
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });

      test("minLength === 0", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "");
        const result = ruleAllowingEmpty.validate(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("valid", () => {
      test.each(["ab", "abc", "abcd", "abcde"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(true);
      });
    });

    describe("invalid", () => {
      test.each(["a", "abcdef"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("Luhn", () => {
    const rule = new ValidationRuleLuhn({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("valid", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "4242424242424242");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(true);
    });

    test("invalid", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "1142424242424242");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });
  });

  describe("range", () => {
    const rule = new ValidationRuleRange({
      minValue: 2,
      maxValue: 5,
    });

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid value", () => {
      test.each(["2", "3", "4", "5"])("as string: %s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
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
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });

      test.each([0, 1, 6, NaN])("as number: %d", (value) => {
        const result = rule.validateValue(value);
        expect(result).toBe(false);
      });
    });
  });

  describe("regular expression", () => {
    const rule = new ValidationRuleRegularExpression({
      regularExpression: "\\d{4}[A-Z]{2}",
    });

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "1234AB");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(true);
    });

    describe("invalid value", () => {
      test.each(["1234", "1234ab", "x1234ABx"])("%s", (value) => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, value);
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("resident ID number", () => {
    const rule = new ValidationRuleResidentIdNumber({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
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
        const result = rule.validate(request, fieldId);
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
        const result = rule.validate(request, fieldId);
        expect(result).toBe(false);
      });
    });
  });

  describe("terms and conditions", () => {
    const rule = new ValidationRuleTermsAndConditions({});

    test("missing value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    test("empty value", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldId, "");
      const result = rule.validate(request, fieldId);
      expect(result).toBe(false);
    });

    describe("valid value", () => {
      test("as string", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldId, "true");
        const result = rule.validate(request, fieldId);
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
        const result = rule.validate(request, fieldId);
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
        (rule) => rule?.id === ValidationRuleBoletoBancarioRequiredness.ID
      ) as ValidationRuleBoletoBancarioRequiredness;
      expect(ruleBoletoBancarioRequiredness.definition).toBe(validators.boletoBancarioRequiredness);

      const ruleEmailAddress = rules.find((rule) => rule?.id === ValidationRuleEmailAddress.ID) as ValidationRuleEmailAddress;
      expect(ruleEmailAddress.definition).toBe(validators.emailAddress);

      const ruleExpirationDate = rules.find((rule) => rule?.id === ValidationRuleExpirationDate.ID) as ValidationRuleExpirationDate;
      expect(ruleExpirationDate.definition).toBe(validators.expirationDate);

      const ruleFixedList = rules.find((rule) => rule?.id === ValidationRuleFixedList.ID) as ValidationRuleFixedList;
      expect(ruleFixedList.allowedValues).toBe(validators.fixedList?.allowedValues);
      expect(ruleFixedList.definition).toBe(validators.fixedList);

      const ruleIban = rules.find((rule) => rule?.id === ValidationRuleIban.ID) as ValidationRuleIban;
      expect(ruleIban.definition).toBe(validators.iban);

      const ruleLength = rules.find((rule) => rule?.id === ValidationRuleLength.ID) as ValidationRuleLength;
      expect(ruleLength.minLength).toBe(validators.length?.minLength);
      expect(ruleLength.maxLength).toBe(validators.length?.maxLength);
      expect(ruleLength.definition).toBe(validators.length);

      const ruleLuhn = rules.find((rule) => rule?.id === ValidationRuleLuhn.ID) as ValidationRuleLuhn;
      expect(ruleLuhn.definition).toBe(validators.luhn);

      const ruleRange = rules.find((rule) => rule?.id === ValidationRuleRange.ID) as ValidationRuleRange;
      expect(ruleRange.minValue).toBe(validators.range?.minValue);
      expect(ruleRange.maxValue).toBe(validators.range?.maxValue);
      expect(ruleRange.definition).toBe(validators.range);

      const ruleRegularExpression = rules.find((rule) => rule?.id === ValidationRuleRegularExpression.ID) as ValidationRuleRegularExpression;
      expect(ruleRegularExpression.regularExpression).toBe(validators.regularExpression?.regularExpression);
      expect(ruleRegularExpression.definition).toBe(validators.regularExpression);

      const ruleResidentIdNumber = rules.find((rule) => rule?.id === ValidationRuleResidentIdNumber.ID) as ValidationRuleResidentIdNumber;
      expect(ruleResidentIdNumber.definition).toBe(validators.residentIdNumber);

      const ruleTermsAndConditions = rules.find((rule) => rule?.id === ValidationRuleTermsAndConditions.ID) as ValidationRuleTermsAndConditions;
      expect(ruleTermsAndConditions.definition).toBe(validators.termsAndConditions);
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
