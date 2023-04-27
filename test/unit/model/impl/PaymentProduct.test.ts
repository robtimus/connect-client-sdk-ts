/**
 * @group unit:model
 */

import { api } from "../../../../src/communicator/model";
import { toBasicPaymentProduct, toBasicPaymentProducts, toPaymentProduct } from "../../../../src/model/impl/PaymentProduct";

const minimalJson: api.PaymentProduct = {
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
  usesRedirectionTo3rdParty: false,
};

const fullJson: api.PaymentProduct = {
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
  acquirerCountry: "NL",
  allowsInstallments: false,
  allowsRecurring: true,
  allowsTokenization: true,
  authenticationIndicator: {
    name: "key",
    value: "val",
  },
  autoTokenized: false,
  canBeIframed: false,
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
  fieldsWarning: "warning",
  id: 1,
  isJavaScriptRequired: false,
  maxAmount: 10000,
  minAmount: 10,
  mobileIntegrationLevel: "OPTIMIZED",
  paymentMethod: "cards",
  paymentProduct302SpecificData: {
    networks: ["VISA"],
  },
  paymentProduct320SpecificData: {
    gateway: "ingenico",
    networks: ["1"],
  },
  paymentProduct863SpecificData: {
    integrationTypes: ["QA"],
  },
  paymentProductGroup: "cards",
  supportsMandates: false,
  usesRedirectionTo3rdParty: false,
};

describe("toBasicPaymentProduct", () => {
  const minimalProduct = toBasicPaymentProduct(minimalJson);
  const fullProduct = toBasicPaymentProduct(fullJson);

  describe("property mapping", () => {
    test("minimal", () => {
      expect(minimalProduct.accountsOnFile).toStrictEqual([]);
      expect(minimalProduct.acquirerCountry).toBeUndefined();
      expect(minimalProduct.allowsInstallments).toBe(minimalJson.allowsInstallments);
      expect(minimalProduct.allowsRecurring).toBe(minimalJson.allowsRecurring);
      expect(minimalProduct.allowsTokenization).toBe(minimalJson.allowsTokenization);
      expect(minimalProduct.authenticationIndicator).toBeUndefined();
      expect(minimalProduct.autoTokenized).toBe(minimalJson.autoTokenized);
      expect(minimalProduct.canBeIframed).toBeUndefined();
      expect(minimalProduct.deviceFingerprintEnabled).toBe(minimalJson.deviceFingerprintEnabled);
      expect(minimalProduct.displayHints).toBe(minimalJson.displayHints);
      expect(minimalProduct.id).toBe(minimalJson.id);
      expect(minimalProduct.isJavaScriptRequired).toBeUndefined();
      expect(minimalProduct.maxAmount).toBeUndefined();
      expect(minimalProduct.minAmount).toBeUndefined();
      expect(minimalProduct.mobileIntegrationLevel).toBe(minimalJson.mobileIntegrationLevel);
      expect(minimalProduct.paymentMethod).toBe(minimalJson.paymentMethod);
      expect(minimalProduct.paymentProduct302SpecificData).toBeUndefined();
      expect(minimalProduct.paymentProduct320SpecificData).toBeUndefined();
      expect(minimalProduct.paymentProduct863SpecificData).toBeUndefined();
      expect(minimalProduct.paymentProductGroup).toBeUndefined();
      expect(minimalProduct.supportsMandates).toBeUndefined();
      expect(minimalProduct.usesRedirectionTo3rdParty).toBe(minimalJson.usesRedirectionTo3rdParty);
      expect(minimalProduct.type).toBe("product");
    });

    test("full", () => {
      expect(fullProduct.accountsOnFile).toHaveLength(1);
      expect(fullProduct.accountsOnFile[0].id).toBe(1);
      expect(fullProduct.acquirerCountry).toBe(fullJson.acquirerCountry);
      expect(fullProduct.allowsInstallments).toBe(fullJson.allowsInstallments);
      expect(fullProduct.allowsRecurring).toBe(fullJson.allowsRecurring);
      expect(fullProduct.allowsTokenization).toBe(fullJson.allowsTokenization);
      expect(fullProduct.authenticationIndicator).toBe(fullJson.authenticationIndicator);
      expect(fullProduct.autoTokenized).toBe(fullJson.autoTokenized);
      expect(fullProduct.canBeIframed).toBe(fullJson.canBeIframed);
      expect(fullProduct.deviceFingerprintEnabled).toBe(fullJson.deviceFingerprintEnabled);
      expect(fullProduct.displayHints).toBe(fullJson.displayHints);
      expect(fullProduct.id).toBe(fullJson.id);
      expect(fullProduct.isJavaScriptRequired).toBe(fullJson.isJavaScriptRequired);
      expect(fullProduct.maxAmount).toBe(fullJson.maxAmount);
      expect(fullProduct.minAmount).toBe(fullJson.minAmount);
      expect(fullProduct.mobileIntegrationLevel).toBe(fullJson.mobileIntegrationLevel);
      expect(fullProduct.paymentMethod).toBe(fullJson.paymentMethod);
      expect(fullProduct.paymentProduct302SpecificData).toBe(fullJson.paymentProduct302SpecificData);
      expect(fullProduct.paymentProduct320SpecificData).toBe(fullJson.paymentProduct320SpecificData);
      expect(fullProduct.paymentProduct863SpecificData).toBe(fullJson.paymentProduct863SpecificData);
      expect(fullProduct.paymentProductGroup).toBe(fullJson.paymentProductGroup);
      expect(fullProduct.supportsMandates).toBe(fullJson.supportsMandates);
      expect(fullProduct.usesRedirectionTo3rdParty).toBe(fullJson.usesRedirectionTo3rdParty);
      expect(fullProduct.type).toBe("product");
    });
  });

  describe("findAccountOnFile", () => {
    test("non-matching", () => {
      const result = fullProduct.findAccountOnFile(0);
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = fullProduct.findAccountOnFile(1);
      expect(result).toBe(fullProduct.accountsOnFile[0]);
    });
  });

  describe("getAccountOnFile", () => {
    test("non-matching", () => {
      expect(() => fullProduct.getAccountOnFile(0)).toThrow(new Error("could not find AccountOnFile with id 0"));
    });

    test("matching", () => {
      const result = fullProduct.getAccountOnFile(1);
      expect(result).toBe(fullProduct.accountsOnFile[0]);
    });
  });
});

describe("toBasicPaymentProducts", () => {
  describe("property mapping", () => {
    test("minimal", () => {
      const json = {
        paymentProducts: [minimalJson],
      };
      const products = toBasicPaymentProducts(json);
      expect(products.accountsOnFile).toStrictEqual([]);
      expect(products.paymentProducts).toHaveLength(1);
      expect(products.paymentProducts[0].accountsOnFile).toStrictEqual([]);
      expect(products.paymentProducts[0].acquirerCountry).toBeUndefined();
      expect(products.paymentProducts[0].allowsInstallments).toBe(minimalJson.allowsInstallments);
      expect(products.paymentProducts[0].allowsRecurring).toBe(minimalJson.allowsRecurring);
      expect(products.paymentProducts[0].allowsTokenization).toBe(minimalJson.allowsTokenization);
      expect(products.paymentProducts[0].authenticationIndicator).toBeUndefined();
      expect(products.paymentProducts[0].autoTokenized).toBe(minimalJson.autoTokenized);
      expect(products.paymentProducts[0].canBeIframed).toBeUndefined();
      expect(products.paymentProducts[0].deviceFingerprintEnabled).toBe(minimalJson.deviceFingerprintEnabled);
      expect(products.paymentProducts[0].displayHints).toBe(minimalJson.displayHints);
      expect(products.paymentProducts[0].id).toBe(minimalJson.id);
      expect(products.paymentProducts[0].isJavaScriptRequired).toBeUndefined();
      expect(products.paymentProducts[0].maxAmount).toBeUndefined();
      expect(products.paymentProducts[0].minAmount).toBeUndefined();
      expect(products.paymentProducts[0].mobileIntegrationLevel).toBe(minimalJson.mobileIntegrationLevel);
      expect(products.paymentProducts[0].paymentMethod).toBe(minimalJson.paymentMethod);
      expect(products.paymentProducts[0].paymentProduct302SpecificData).toBeUndefined();
      expect(products.paymentProducts[0].paymentProduct320SpecificData).toBeUndefined();
      expect(products.paymentProducts[0].paymentProduct863SpecificData).toBeUndefined();
      expect(products.paymentProducts[0].paymentProductGroup).toBeUndefined();
      expect(products.paymentProducts[0].supportsMandates).toBeUndefined();
      expect(products.paymentProducts[0].usesRedirectionTo3rdParty).toBe(minimalJson.usesRedirectionTo3rdParty);
      expect(products.paymentProducts[0].type).toBe("product");
    });

    test("full", () => {
      const json = {
        paymentProducts: [fullJson],
      };
      const products = toBasicPaymentProducts(json);
      expect(products.accountsOnFile).toHaveLength(1);
      expect(products.accountsOnFile[0].id).toBe(1);
      expect(products.paymentProducts[0].accountsOnFile).toHaveLength(1);
      expect(products.paymentProducts[0].accountsOnFile[0]).toBe(products.accountsOnFile[0]);
      expect(products.paymentProducts[0].acquirerCountry).toBe(fullJson.acquirerCountry);
      expect(products.paymentProducts[0].allowsInstallments).toBe(fullJson.allowsInstallments);
      expect(products.paymentProducts[0].allowsRecurring).toBe(fullJson.allowsRecurring);
      expect(products.paymentProducts[0].allowsTokenization).toBe(fullJson.allowsTokenization);
      expect(products.paymentProducts[0].authenticationIndicator).toBe(fullJson.authenticationIndicator);
      expect(products.paymentProducts[0].autoTokenized).toBe(fullJson.autoTokenized);
      expect(products.paymentProducts[0].canBeIframed).toBe(fullJson.canBeIframed);
      expect(products.paymentProducts[0].deviceFingerprintEnabled).toBe(fullJson.deviceFingerprintEnabled);
      expect(products.paymentProducts[0].displayHints).toBe(fullJson.displayHints);
      expect(products.paymentProducts[0].id).toBe(fullJson.id);
      expect(products.paymentProducts[0].isJavaScriptRequired).toBe(fullJson.isJavaScriptRequired);
      expect(products.paymentProducts[0].maxAmount).toBe(fullJson.maxAmount);
      expect(products.paymentProducts[0].minAmount).toBe(fullJson.minAmount);
      expect(products.paymentProducts[0].mobileIntegrationLevel).toBe(fullJson.mobileIntegrationLevel);
      expect(products.paymentProducts[0].paymentMethod).toBe(fullJson.paymentMethod);
      expect(products.paymentProducts[0].paymentProduct302SpecificData).toBe(fullJson.paymentProduct302SpecificData);
      expect(products.paymentProducts[0].paymentProduct320SpecificData).toBe(fullJson.paymentProduct320SpecificData);
      expect(products.paymentProducts[0].paymentProduct863SpecificData).toBe(fullJson.paymentProduct863SpecificData);
      expect(products.paymentProducts[0].paymentProductGroup).toBe(fullJson.paymentProductGroup);
      expect(products.paymentProducts[0].supportsMandates).toBe(fullJson.supportsMandates);
      expect(products.paymentProducts[0].usesRedirectionTo3rdParty).toBe(fullJson.usesRedirectionTo3rdParty);
      expect(products.paymentProducts[0].type).toBe("product");
    });
  });

  const products = toBasicPaymentProducts({
    paymentProducts: [fullJson],
  });

  describe("findPaymentProduct", () => {
    test("non-matching", () => {
      const result = products.findPaymentProduct(2);
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = products.findPaymentProduct(1);
      expect(result).toBe(products.paymentProducts[0]);
    });
  });

  describe("getPaymentProduct", () => {
    test("non-matching", () => {
      expect(() => products.getPaymentProduct(2)).toThrow(new Error("could not find BasicPaymentProduct with id 2"));
    });

    test("matching", () => {
      const result = products.getPaymentProduct(1);
      expect(result).toBe(products.paymentProducts[0]);
    });
  });

  describe("findAccountOnFile", () => {
    test("non-matching", () => {
      const result = products.findAccountOnFile(0);
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = products.findAccountOnFile(1);
      expect(result).toBe(products.accountsOnFile[0]);
    });
  });

  describe("getAccountOnFile", () => {
    test("non-matching", () => {
      expect(() => products.getAccountOnFile(0)).toThrow(new Error("could not find AccountOnFile with id 0"));
    });

    test("matching", () => {
      const result = products.getAccountOnFile(1);
      expect(result).toBe(products.accountsOnFile[0]);
    });
  });
});

describe("toPaymentProduct", () => {
  const minimalProduct = toPaymentProduct(minimalJson);
  const fullProduct = toPaymentProduct(fullJson);

  describe("property mapping", () => {
    test("minimal", () => {
      expect(minimalProduct.accountsOnFile).toStrictEqual([]);
      expect(minimalProduct.acquirerCountry).toBeUndefined();
      expect(minimalProduct.allowsInstallments).toBe(minimalJson.allowsInstallments);
      expect(minimalProduct.allowsRecurring).toBe(minimalJson.allowsRecurring);
      expect(minimalProduct.allowsTokenization).toBe(minimalJson.allowsTokenization);
      expect(minimalProduct.authenticationIndicator).toBeUndefined();
      expect(minimalProduct.autoTokenized).toBe(minimalJson.autoTokenized);
      expect(minimalProduct.canBeIframed).toBeUndefined();
      expect(minimalProduct.deviceFingerprintEnabled).toBe(minimalJson.deviceFingerprintEnabled);
      expect(minimalProduct.displayHints).toBe(minimalJson.displayHints);
      expect(minimalProduct.fields).toStrictEqual([]);
      expect(minimalProduct.fieldsWarning).toBeUndefined();
      expect(minimalProduct.id).toBe(minimalJson.id);
      expect(minimalProduct.isJavaScriptRequired).toBeUndefined();
      expect(minimalProduct.maxAmount).toBeUndefined();
      expect(minimalProduct.minAmount).toBeUndefined();
      expect(minimalProduct.mobileIntegrationLevel).toBe(minimalJson.mobileIntegrationLevel);
      expect(minimalProduct.paymentMethod).toBe(minimalJson.paymentMethod);
      expect(minimalProduct.paymentProduct302SpecificData).toBeUndefined();
      expect(minimalProduct.paymentProduct320SpecificData).toBeUndefined();
      expect(minimalProduct.paymentProduct863SpecificData).toBeUndefined();
      expect(minimalProduct.paymentProductGroup).toBeUndefined();
      expect(minimalProduct.supportsMandates).toBeUndefined();
      expect(minimalProduct.usesRedirectionTo3rdParty).toBe(minimalJson.usesRedirectionTo3rdParty);
      expect(minimalProduct.type).toBe("product");
    });

    test("full", () => {
      expect(fullProduct.accountsOnFile).toHaveLength(1);
      expect(fullProduct.accountsOnFile[0].id).toBe(1);
      expect(fullProduct.acquirerCountry).toBe(fullJson.acquirerCountry);
      expect(fullProduct.allowsInstallments).toBe(fullJson.allowsInstallments);
      expect(fullProduct.allowsRecurring).toBe(fullJson.allowsRecurring);
      expect(fullProduct.allowsTokenization).toBe(fullJson.allowsTokenization);
      expect(fullProduct.authenticationIndicator).toBe(fullJson.authenticationIndicator);
      expect(fullProduct.autoTokenized).toBe(fullJson.autoTokenized);
      expect(fullProduct.canBeIframed).toBe(fullJson.canBeIframed);
      expect(fullProduct.deviceFingerprintEnabled).toBe(fullJson.deviceFingerprintEnabled);
      expect(fullProduct.displayHints).toBe(fullJson.displayHints);
      expect(fullProduct.fields).toHaveLength(1);
      expect(fullProduct.fields[0].id).toBe("cardNumber");
      expect(fullProduct.fieldsWarning).toBe(fullJson.fieldsWarning);
      expect(fullProduct.id).toBe(fullJson.id);
      expect(fullProduct.isJavaScriptRequired).toBe(fullJson.isJavaScriptRequired);
      expect(fullProduct.maxAmount).toBe(fullJson.maxAmount);
      expect(fullProduct.minAmount).toBe(fullJson.minAmount);
      expect(fullProduct.mobileIntegrationLevel).toBe(fullJson.mobileIntegrationLevel);
      expect(fullProduct.paymentMethod).toBe(fullJson.paymentMethod);
      expect(fullProduct.paymentProduct302SpecificData).toBe(fullJson.paymentProduct302SpecificData);
      expect(fullProduct.paymentProduct320SpecificData).toBe(fullJson.paymentProduct320SpecificData);
      expect(fullProduct.paymentProduct863SpecificData).toBe(fullJson.paymentProduct863SpecificData);
      expect(fullProduct.paymentProductGroup).toBe(fullJson.paymentProductGroup);
      expect(fullProduct.supportsMandates).toBe(fullJson.supportsMandates);
      expect(fullProduct.usesRedirectionTo3rdParty).toBe(fullJson.usesRedirectionTo3rdParty);
      expect(fullProduct.type).toBe("product");
    });
  });

  describe("findAccountOnFile", () => {
    test("non-matching", () => {
      const result = fullProduct.findAccountOnFile(0);
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = fullProduct.findAccountOnFile(1);
      expect(result).toBe(fullProduct.accountsOnFile[0]);
    });
  });

  describe("getAccountOnFile", () => {
    test("non-matching", () => {
      expect(() => fullProduct.getAccountOnFile(0)).toThrow(new Error("could not find AccountOnFile with id 0"));
    });

    test("matching", () => {
      const result = fullProduct.getAccountOnFile(1);
      expect(result).toBe(fullProduct.accountsOnFile[0]);
    });
  });

  describe("findField", () => {
    test("non-matching", () => {
      const result = fullProduct.findField("foo");
      expect(result).toBeUndefined();
    });

    test("matching", () => {
      const result = fullProduct.findField("cardNumber");
      expect(result).toBe(fullProduct.fields[0]);
    });
  });

  describe("getField", () => {
    test("non-matching", () => {
      expect(() => fullProduct.getField("foo")).toThrow(new Error("could not find PaymentProductField with id foo"));
    });

    test("matching", () => {
      const result = fullProduct.getField("cardNumber");
      expect(result).toBe(fullProduct.fields[0]);
    });
  });
});
