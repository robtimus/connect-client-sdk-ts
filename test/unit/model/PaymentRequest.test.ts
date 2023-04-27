/**
 * @group unit:model
 */

import { PaymentRequest } from "../../../src/model";
import { toAccountOnFile } from "../../../src/model/AccountOnFile";
import { toPaymentProduct } from "../../../src/model/PaymentProduct";
import { ValidationRuleExpirationDate } from "../../../src/validation/ValidationRuleExpirationDate";
import { ValidationRuleLuhn } from "../../../src/validation/ValidationRuleLuhn";

const fieldIdWithoutMask = "cardNumber";
const fieldIdWithMask = "expirationDate";
const optionalField = "cardHolderName";

const product = toPaymentProduct({
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
        validators: {
          luhn: {},
        },
      },
      id: fieldIdWithoutMask,
      type: "",
    },
    {
      dataRestrictions: {
        isRequired: true,
        validators: {
          expirationDate: {},
        },
      },
      displayHints: {
        alwaysShow: false,
        displayOrder: 0,
        formElement: {
          type: "",
        },
        obfuscate: false,
        mask: "{{99}}-{{99}}",
      },
      id: fieldIdWithMask,
      type: "",
    },
    {
      dataRestrictions: {
        isRequired: false,
        validators: {},
      },
      id: optionalField,
      type: "",
    },
  ],
  id: 1,
  mobileIntegrationLevel: "",
  paymentMethod: "",
  usesRedirectionTo3rdParty: false,
});

const productWithoutFields = toPaymentProduct({
  allowsInstallments: false,
  allowsRecurring: false,
  allowsTokenization: false,
  autoTokenized: false,
  deviceFingerprintEnabled: false,
  displayHints: {
    displayOrder: 0,
    logo: "",
  },
  id: 1,
  mobileIntegrationLevel: "",
  paymentMethod: "",
  usesRedirectionTo3rdParty: false,
});

describe("PaymentRequest", () => {
  describe("getValue", () => {
    test("value not set", () => {
      const request = new PaymentRequest();
      const value = request.getValue("id");
      expect(value).toBe(undefined);
    });

    test("value set", () => {
      const request = new PaymentRequest();
      request.setValue(fieldIdWithoutMask, "test");
      const value = request.getValue(fieldIdWithoutMask);
      expect(value).toBe("test");
    });
  });

  describe("getValues", () => {
    test("no values set", () => {
      const request = new PaymentRequest();
      const values = request.getValues();
      expect(values).toStrictEqual({});
    });

    test("some values set", () => {
      const request = new PaymentRequest();
      request.setValue("field1", "value1");
      request.setValue("field2", "value2");
      const values = request.getValues();
      expect(values).toStrictEqual({
        field1: "value1",
        field2: "value2",
      });
    });
  });

  describe("getMaskedValue", () => {
    test("no product set", () => {
      const request = new PaymentRequest();
      request.setValue(fieldIdWithoutMask, "value");
      const value = request.getMaskedValue(fieldIdWithoutMask);
      expect(value).toBe(undefined);
    });

    test("non-existing field", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue("other", "value");
      const value = request.getMaskedValue("other");
      expect(value).toBe(undefined);
    });

    test("field without mask", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldIdWithoutMask, "1230");
      const value = request.getMaskedValue(fieldIdWithoutMask);
      expect(value).toBe("1230");
    });

    test("field with mask", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldIdWithMask, "1230");
      const value = request.getMaskedValue(fieldIdWithMask);
      expect(value).toBe("12-30");
    });

    test("value not set", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const value = request.getMaskedValue(fieldIdWithMask);
      expect(value).toBeUndefined();
    });
  });

  describe("getMaskedValues", () => {
    test("no values set", () => {
      const request = new PaymentRequest();
      const values = request.getMaskedValues();
      expect(values).toStrictEqual({});
    });

    test("some values set", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldIdWithMask, "1230");
      request.setValue(fieldIdWithoutMask, "1235");
      request.setValue("field1", "value1");
      request.setValue("field2", "value2");
      const values = request.getMaskedValues();
      expect(values).toStrictEqual({
        cardNumber: "1235",
        expirationDate: "12-30",
        field1: undefined,
        field2: undefined,
      });
    });
  });

  describe("getUnmaskedValue", () => {
    test("no product set", () => {
      const request = new PaymentRequest();
      request.setValue(fieldIdWithoutMask, "value");
      const value = request.getUnmaskedValue(fieldIdWithoutMask);
      expect(value).toBe(undefined);
    });

    test("non-existing field", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue("other", "value");
      const value = request.getUnmaskedValue("other");
      expect(value).toBe(undefined);
    });

    describe("field without mask", () => {
      test("value had mask", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithoutMask, "12-30");
        const value = request.getUnmaskedValue(fieldIdWithoutMask);
        expect(value).toBe("12-30");
      });

      test("value did not have mask", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithoutMask, "1230");
        const value = request.getUnmaskedValue(fieldIdWithoutMask);
        expect(value).toBe("1230");
      });
    });

    describe("field with mask", () => {
      test("value had mask", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithMask, "12-30");
        const value = request.getUnmaskedValue(fieldIdWithMask);
        expect(value).toBe("1230");
      });

      test("value did not have mask", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithMask, "1230");
        const value = request.getUnmaskedValue(fieldIdWithMask);
        expect(value).toBe("1230");
      });
    });

    test("value not set", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const value = request.getUnmaskedValue(fieldIdWithMask);
      expect(value).toBeUndefined();
    });
  });

  describe("getUnmaskedValues", () => {
    test("no values set", () => {
      const request = new PaymentRequest();
      const values = request.getUnmaskedValues();
      expect(values).toStrictEqual({});
    });

    describe("some values set", () => {
      test("values had mask", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithMask, "12-30");
        request.setValue(fieldIdWithoutMask, "12-35");
        request.setValue("field1", "value1");
        request.setValue("field2", "value2");
        const values = request.getUnmaskedValues();
        expect(values).toStrictEqual({
          cardNumber: "12-35",
          expirationDate: "1230",
          field1: undefined,
          field2: undefined,
        });
      });

      test("values did not have mask", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithMask, "1230");
        request.setValue(fieldIdWithoutMask, "1235");
        request.setValue("field1", "value1");
        request.setValue("field2", "value2");
        const values = request.getUnmaskedValues();
        expect(values).toStrictEqual({
          cardNumber: "1235",
          expirationDate: "1230",
          field1: undefined,
          field2: undefined,
        });
      });
    });
  });

  describe("getPaymentProduct", () => {
    test("product not set", () => {
      const request = new PaymentRequest();
      const result = request.getPaymentProduct();
      expect(result).toBeUndefined();
    });

    test("product set", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = request.getPaymentProduct();
      expect(result).toBe(product);
    });
  });

  describe("getAccountOnFile", () => {
    test("account on file not set", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      const result = request.getAccountOnFile();
      expect(result).toBeUndefined();
    });

    test("account on file set", () => {
      const accountOnFile = toAccountOnFile({
        attributes: [],
        displayHints: {
          labelTemplate: [],
          logo: "",
        },
        id: 1,
        paymentProductId: product.id,
      });

      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setAccountOnFile(accountOnFile);
      const result = request.getAccountOnFile();
      expect(result).toBe(accountOnFile);
    });
  });

  describe("setAccountOnFile", () => {
    const accountOnFile = toAccountOnFile({
      attributes: [
        {
          key: fieldIdWithoutMask,
          value: "****",
          status: "READ_ONLY",
        },
        {
          key: fieldIdWithMask,
          value: "1225",
          status: "MUST_WRITE",
          mustWriteReason: "expired",
        },
      ],
      displayHints: {
        labelTemplate: [],
        logo: "",
      },
      id: 1,
      paymentProductId: product.id,
    });

    test("provided attributes are reset", () => {
      const request = new PaymentRequest();
      request.setPaymentProduct(product);
      request.setValue(fieldIdWithMask, "1230");
      request.setValue(fieldIdWithoutMask, "123456");
      const originalValues = request.getValues();
      expect(originalValues).toStrictEqual({
        cardNumber: "123456",
        expirationDate: "1230",
      });

      request.setAccountOnFile(accountOnFile);
      const values = request.getValues();
      expect(values).toStrictEqual({
        expirationDate: "1230",
      });
    });
  });

  describe("getTokenize", () => {
    test("tokenize not set", () => {
      const request = new PaymentRequest();
      const tokenize = request.getTokenize();
      expect(tokenize).toBe(false);
    });

    describe("tokenize not set", () => {
      test.each([true, false])("to %b", (value) => {
        const request = new PaymentRequest();
        request.setTokenize(value);
        const tokenize = request.getTokenize();
        expect(tokenize).toBe(value);
      });
    });
  });

  describe("validate", () => {
    test("no product set", () => {
      const request = new PaymentRequest();
      expect(() => request.validate()).toThrowError(new Error("no PaymentProduct set"));
    });

    describe("no account on file set", () => {
      test("no fields or values", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(productWithoutFields);
        const result = request.validate();
        expect(result.valid).toBe(true);
        expect(result).not.toHaveProperty("errors");
      });

      test("no fields", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(productWithoutFields);
        request.setValue(fieldIdWithMask, "1230");
        const result = request.validate();
        expect(result.valid).toBe(true);
        expect(result).not.toHaveProperty("errors");
      });

      test("all fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithoutMask, "4242424242424242");
        request.setValue(fieldIdWithMask, "1230");
        request.setValue(optionalField, "John Doe");
        const result = request.validate();
        expect(result.valid).toBe(true);
        expect(result).not.toHaveProperty("errors");
      });

      test("all required fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithoutMask, "4242424242424242");
        request.setValue(fieldIdWithMask, "1230");
        const result = request.validate();
        expect(result.valid).toBe(true);
        expect(result).not.toHaveProperty("errors");
      });

      test("invalid values set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setValue(fieldIdWithoutMask, "1142424242424242");
        request.setValue(fieldIdWithMask, "1330");
        const result = request.validate();
        expect(result.valid).toBe(false);
        const errors = result.valid ? [] : result.errors;
        expect(errors).toStrictEqual([
          {
            fieldId: fieldIdWithoutMask,
            ruleId: ValidationRuleLuhn.ID,
          },
          {
            fieldId: fieldIdWithMask,
            ruleId: ValidationRuleExpirationDate.ID,
          },
        ]);
      });

      test("no fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        const result = request.validate();
        expect(result.valid).toBe(false);
        const errors = result.valid ? [] : result.errors;
        expect(errors).toStrictEqual([
          {
            fieldId: fieldIdWithoutMask,
            ruleId: "required",
          },
          {
            fieldId: fieldIdWithMask,
            ruleId: "required",
          },
        ]);
      });
    });

    describe("non-matching account on file set", () => {
      const accountOnFile = toAccountOnFile({
        attributes: [
          {
            key: fieldIdWithoutMask,
            value: "****",
            status: "READ_ONLY",
          },
          {
            key: fieldIdWithMask,
            value: "1225",
            status: "MUST_WRITE",
            mustWriteReason: "expired",
          },
        ],
        displayHints: {
          labelTemplate: [],
          logo: "",
        },
        id: 1,
        paymentProductId: product.id + 1,
      });

      test("all fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setAccountOnFile(accountOnFile);
        request.setValue(fieldIdWithoutMask, "4242424242424242");
        request.setValue(fieldIdWithMask, "1230");
        request.setValue(optionalField, "John Doe");
        const result = request.validate();
        expect(result.valid).toBe(true);
        expect(result).not.toHaveProperty("errors");
      });

      test("all required fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setAccountOnFile(accountOnFile);
        request.setValue(fieldIdWithoutMask, "4242424242424242");
        request.setValue(fieldIdWithMask, "1230");
        const result = request.validate();
        expect(result.valid).toBe(true);
        expect(result).not.toHaveProperty("errors");
      });

      test("invalid values set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setAccountOnFile(accountOnFile);
        request.setValue(fieldIdWithoutMask, "1142424242424242");
        request.setValue(fieldIdWithMask, "1330");
        const result = request.validate();
        expect(result.valid).toBe(false);
        const errors = result.valid ? [] : result.errors;
        expect(errors).toStrictEqual([
          {
            fieldId: fieldIdWithoutMask,
            ruleId: ValidationRuleLuhn.ID,
          },
          {
            fieldId: fieldIdWithMask,
            ruleId: ValidationRuleExpirationDate.ID,
          },
        ]);
      });

      test("no fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setAccountOnFile(accountOnFile);
        const result = request.validate();
        expect(result.valid).toBe(false);
        const errors = result.valid ? [] : result.errors;
        expect(errors).toStrictEqual([
          {
            fieldId: fieldIdWithoutMask,
            ruleId: "required",
          },
          {
            fieldId: fieldIdWithMask,
            ruleId: "required",
          },
        ]);
      });
    });

    describe("matching account on file set", () => {
      const accountOnFile = toAccountOnFile({
        attributes: [
          {
            key: fieldIdWithoutMask,
            value: "****",
            status: "READ_ONLY",
          },
          {
            key: fieldIdWithMask,
            value: "1225",
            status: "MUST_WRITE",
            mustWriteReason: "expired",
          },
        ],
        displayHints: {
          labelTemplate: [],
          logo: "",
        },
        id: 1,
        paymentProductId: product.id,
      });

      test("all fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setAccountOnFile(accountOnFile);
        request.setValue(fieldIdWithoutMask, "4242424242424242");
        request.setValue(fieldIdWithMask, "1230");
        request.setValue(optionalField, "John Doe");
        const result = request.validate();
        expect(result.valid).toBe(true);
        expect(result).not.toHaveProperty("errors");
      });

      test("all required fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setAccountOnFile(accountOnFile);
        request.setValue(fieldIdWithoutMask, "4242424242424242");
        request.setValue(fieldIdWithMask, "1230");
        const result = request.validate();
        expect(result.valid).toBe(true);
        expect(result).not.toHaveProperty("errors");
      });

      test("invalid values set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setAccountOnFile(accountOnFile);
        request.setValue(fieldIdWithoutMask, "1142424242424242");
        request.setValue(fieldIdWithMask, "1330");
        const result = request.validate();
        expect(result.valid).toBe(false);
        const errors = result.valid ? [] : result.errors;
        expect(errors).toStrictEqual([
          {
            fieldId: fieldIdWithoutMask,
            ruleId: ValidationRuleLuhn.ID,
          },
          {
            fieldId: fieldIdWithMask,
            ruleId: ValidationRuleExpirationDate.ID,
          },
        ]);
      });

      test("no fields set", () => {
        const request = new PaymentRequest();
        request.setPaymentProduct(product);
        request.setAccountOnFile(accountOnFile);
        const result = request.validate();
        expect(result.valid).toBe(false);
        const errors = result.valid ? [] : result.errors;
        expect(errors).toStrictEqual([
          {
            fieldId: fieldIdWithMask,
            ruleId: "required",
          },
        ]);
      });
    });
  });
});
