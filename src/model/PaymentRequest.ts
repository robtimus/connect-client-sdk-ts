import { AccountOnFile, PaymentProduct } from ".";
import { ValidatableRequest, ValidationError, ValidationResult } from "../validation";

export class PaymentRequest implements ValidatableRequest {
  private readonly fieldValues: Record<string, string | undefined> = {};
  private paymentProduct?: PaymentProduct;
  private accountOnFile?: AccountOnFile;
  private tokenize = false;

  getValue(fieldId: string): string | undefined {
    return this.fieldValues[fieldId];
  }

  setValue(fieldId: string, value: string): void {
    this.fieldValues[fieldId] = value;
  }

  getValues(): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const fieldId in this.fieldValues) {
      result[fieldId] = this.fieldValues[fieldId];
    }
    return result;
  }

  getMaskedValue(fieldId: string): string | undefined {
    const field = this.paymentProduct?.findField(fieldId);
    if (!field) {
      return undefined;
    }
    const value = this.getValue(fieldId);
    if (value === undefined) {
      return undefined;
    }
    return field.applyMask(value).formattedValue;
  }

  getMaskedValues(): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const fieldId in this.fieldValues) {
      result[fieldId] = this.getMaskedValue(fieldId);
    }
    return result;
  }

  getUnmaskedValue(fieldId: string): string | undefined {
    const field = this.paymentProduct?.findField(fieldId);
    if (!field) {
      return undefined;
    }
    const value = this.getValue(fieldId);
    if (value === undefined) {
      return undefined;
    }
    return field.removeMask(field.applyMask(value).formattedValue);
  }

  getUnmaskedValues(): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const fieldId in this.fieldValues) {
      result[fieldId] = this.getUnmaskedValue(fieldId);
    }
    return result;
  }

  getPaymentProduct(): PaymentProduct | undefined {
    return this.paymentProduct;
  }

  setPaymentProduct(paymentProduct: PaymentProduct): void {
    this.paymentProduct = paymentProduct;
  }

  getAccountOnFile(): AccountOnFile | undefined {
    return this.accountOnFile;
  }

  setAccountOnFile(accountOnFile?: AccountOnFile): void {
    if (accountOnFile) {
      accountOnFile.attributes.filter((attribute) => attribute.status !== "MUST_WRITE").forEach((attribute) => delete this.fieldValues[attribute.key]);
    }
    this.accountOnFile = accountOnFile;
  }

  getTokenize(): boolean {
    return this.tokenize;
  }

  setTokenize(tokenize: boolean): void {
    this.tokenize = tokenize;
  }

  validate(): ValidationResult {
    const paymentProduct = this.paymentProduct;
    if (!paymentProduct) {
      throw new Error("no PaymentProduct set");
    }
    const errors: ValidationError[] = [];
    for (const fieldId in this.fieldValues) {
      const rules = paymentProduct.findField(fieldId)?.dataRestrictions.validationRules || [];
      rules
        .filter((rule) => !rule.validate(this, fieldId))
        .forEach((rule) =>
          errors.push({
            fieldId,
            ruleId: rule.id,
          })
        );
    }

    const accountOnFile = this.accountOnFile;
    const hasValueInAof = (fieldId: string): boolean => {
      if (accountOnFile?.paymentProductId !== paymentProduct?.id) {
        // the account-on-file does not belong to the payment product; ignore it
        return false;
      }
      const attribute = accountOnFile?.findAttribute(fieldId);
      return !!attribute && attribute.mustWriteReason !== "MUST_WRITE";
    };
    for (const field of paymentProduct.fields) {
      if (field.dataRestrictions.isRequired && !this.getValue(field.id) && !hasValueInAof(field.id)) {
        errors.push({
          fieldId: field.id,
          ruleId: "required",
        });
      }
    }

    if (errors.length === 0) {
      return { valid: true };
    }
    return { valid: false, errors };
  }
}
