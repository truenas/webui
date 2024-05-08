import { FormGroup, ValidationErrors } from '@angular/forms';

export class WidgetSettingsRef<Settings> {
  constructor(
    private settings: Settings,
    private reportSettingsUpdate: (settings: Settings) => void,
    private reportValidityUpdate: (errors: ValidationErrors) => void,
  ) {}

  getSettings(): Settings {
    return this.settings;
  }

  updateSettings(settings: Settings): void {
    this.reportSettingsUpdate(settings);
  }

  updateValidity(errors: ValidationErrors): void {
    this.reportValidityUpdate(errors);
  }

  getAllFormErrors(form: FormGroup, fields: string[]): Record<string, ValidationErrors> {
    let errorsByName: Record<string, ValidationErrors> = {};
    for (const field of fields) {
      const field2 = field as keyof (typeof form.controls);
      if (form.controls[field2].errors) {
        errorsByName = { ...errorsByName, [field]: form.controls[field2].errors };
      }
    }
    return errorsByName;
  }
}
