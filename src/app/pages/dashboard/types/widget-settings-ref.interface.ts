import { FormGroup, ValidationErrors } from '@angular/forms';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';

export class WidgetSettingsRef {
  getData: () => object = () => {
    return this.settings;
  };
  updateSettings: (settings: unknown) => void = (settings: object) => {
    this.reportSettingsUpdate(this.slot, settings);
  };
  updateValidity: (errors: ValidationErrors) => void = (errors: ValidationErrors) => {
    this.reportValidityUpdate(this.slot, errors);
  };

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

  constructor(
    private slot: SlotPosition,
    private settings: object,
    private reportSettingsUpdate: (slot: SlotPosition, settings: unknown) => void,
    private reportValidityUpdate: (slot: SlotPosition, errors: ValidationErrors) => void,
  ) {}
}
