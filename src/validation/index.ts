export interface ValidatableRequest {
  getValue(fieldId: string): string | undefined;
  getMaskedValue(fieldId: string): string | undefined;
  getUnmaskedValue(fieldId: string): string | undefined;
}

export interface ValidationError {
  readonly fieldId: string;
  readonly ruleId: string;
}

export type ValidationResult = { valid: true } | { valid: false; errors: ValidationError[] };

export interface ValidationRule<T> {
  readonly id: string;
  readonly definition: Readonly<T>;
  validate(request: ValidatableRequest, fieldId: string): boolean;
}
