import { ValidationErrors } from '@angular/forms';
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

  constructor(
    private slot: SlotPosition,
    private settings: object,
    private reportSettingsUpdate: (slot: SlotPosition, settings: unknown) => void,
    private reportValidityUpdate: (slot: SlotPosition, errors: ValidationErrors) => void,
  ) {}
}
