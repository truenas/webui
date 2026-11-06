import { Validators, FormControl } from '@angular/forms';
import { NewOrExisting } from 'app/enums/new-or-existing.enum';

export interface PortModeControls {
  port: FormControl<string | null>;
  host_id: FormControl<number | null>;
}

/**
 * Switches FC MPIO port selection between its two exclusive controls: `Existing` uses `port`, `New`
 * uses `host_id`. The other control is disabled, cleared and stripped of validators, the active one
 * made required, and both revalidated. Call it on every mode change.
 */
export function configurePortControlsForMode(
  mode: NewOrExisting | null,
  controls: PortModeControls,
): void {
  if (mode === NewOrExisting.New) {
    // Creating new virtual port - use host_id
    controls.port.clearValidators();
    controls.port.disable();
    controls.port.setValue(null);

    controls.host_id.enable();
    controls.host_id.setValidators([Validators.required]);
  } else {
    // Using existing port - use port string
    controls.host_id.clearValidators();
    controls.host_id.disable();
    controls.host_id.setValue(null);

    controls.port.enable();
    controls.port.setValidators([Validators.required]);
  }

  controls.port.updateValueAndValidity();
  controls.host_id.updateValueAndValidity();
}
