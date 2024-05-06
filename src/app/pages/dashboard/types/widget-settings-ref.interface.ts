import { FormGroup, ValidationErrors } from '@angular/forms';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';

export class WidgetSettingsRef<Settings> {
  constructor(
    private slot: SlotPosition,
    private settings: Settings,
    private reportSettingsUpdate: (slot: SlotPosition, settings: Settings) => void,
    private reportValidityUpdate: (slot: SlotPosition, errors: ValidationErrors) => void,
  ) {}

  getData(): Settings {
    return this.settings;
  }

  updateSettings(settings: Settings): void {
    this.reportSettingsUpdate(this.slot, settings);
  }

  updateValidity(errors: ValidationErrors): void {
    this.reportValidityUpdate(this.slot, errors);
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
