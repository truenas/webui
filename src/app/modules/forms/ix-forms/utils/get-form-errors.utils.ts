import { FormGroup, ValidationErrors } from '@angular/forms';

export function getAllFormErrors(form: FormGroup, fields: string[]): Record<string, ValidationErrors | null> {
  let errorsByName: Record<string, ValidationErrors | null> = {};
  for (const field of fields) {
    const control = form.controls[field as keyof (typeof form.controls)];
    if (control?.errors) {
      errorsByName = { ...errorsByName, [field]: control.errors };
    }
  }
  return errorsByName;
}
