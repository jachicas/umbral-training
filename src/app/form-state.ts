import { FieldValidationError, ValidationErrors, type ValidationField } from "@/lib/services/errors";

/** Errors keyed by field name so each input can render its own message. */
export interface FormState {
  errors?: Partial<Record<ValidationField, string>>;
  success?: boolean;
}

/** A form action's failure as field errors; anything else becomes the form's general error. */
export function fieldErrorState(error: unknown): FormState {
  if (error instanceof ValidationErrors) {
    return { errors: error.errors };
  }
  if (error instanceof FieldValidationError) {
    return { errors: { [error.field]: error.message } };
  }
  return { errors: { general: error instanceof Error ? error.message : "Algo salió mal." } };
}
