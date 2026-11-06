import { FormControl } from '@angular/forms';

/**
 * The flat `FormControl` map for a value interface, so a typed `FormGroup` / `FormArray` can be
 * declared from the value it holds: `FormArray<FormGroup<ControlsOf<SyslogServer>>>`.
 */
export type ControlsOf<T> = {
  [K in keyof T]-?: FormControl<T[K]>;
};
