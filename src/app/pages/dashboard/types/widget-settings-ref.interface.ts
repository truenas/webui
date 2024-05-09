import { ValidationErrors } from '@angular/forms';

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
}
