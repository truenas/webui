import { Validators } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { NewOrExisting } from 'app/enums/new-or-existing.enum';

export interface PortModeControls {
  port: FormControl<string | null>;
  host_id: FormControl<number | null>;
}

/**
 * Configures validators and enabled state for port/host_id controls
 * based on the selected mode (existing port vs new virtual port).
 *
 * This helper centralizes the logic for switching between two mutually exclusive
 * form control configurations in FC MPIO port selection:
 *
 * - **"existing" mode**: Uses the `port` control (string), disables `host_id`
 * - **"new" mode**: Uses the `host_id` control (number), disables `port`
 *
 * The function handles:
 * - Clearing validators from the disabled control
 * - Setting required validator on the enabled control
 * - Disabling/enabling controls appropriately
 * - Clearing values from disabled controls
 * - Calling updateValueAndValidity() to trigger validation
 *
 * @param mode The selected mode (`Existing` to use existing port, `New` to create virtual port)
 * @param controls Object containing both port and host_id form controls
 *
 * @example
 * ```typescript
 * // In component with mode switching:
 * this.modeControl.valueChanges.pipe(
 *   takeUntilDestroyed(this.destroyRef),
 * ).subscribe((mode) => {
 *   configurePortControlsForMode(mode, this.form().controls);
 * });
 * ```
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
