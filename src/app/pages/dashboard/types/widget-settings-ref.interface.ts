import { ValidationErrors } from '@angular/forms';

export class WidgetSettingsRef {
  getData: () => { slot: number; settings: object };
  updateSettings: (slot: number, settings: unknown) => void;
  updateValidity: (slot: number, errors: ValidationErrors) => void;
}
