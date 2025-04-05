import { FormGroup, ValidationErrors } from '@angular/forms';

export function getAllFormErrors(form: FormGroup, fields: string[]): Record<string, ValidationErrors | null> {
  let errorsByName: Record<string, ValidationErrors | null> = {};
  for (const field of fields) {
    if (form.controls[field as keyof (typeof form.controls)].errors) {
      errorsByName = { ...errorsByName, [field]: form.controls[field as keyof (typeof form.controls)].errors };
    }
  }
  return errorsByName;
}
