import { DiskType } from 'app/enums/disk-type.enum';

/**
 * Object rather than a `[size, type]` tuple: `tn-select`'s `writeValue` unwraps an
 * array value to its first element in single-select mode, so an array-valued option
 * can never be written back into the control.
 *
 * TEMP (NAS-141021) — indexed in the tn-migration playbook's "Known upstream defects" table;
 * revisit once the library preserves array values in single-select.
 */
export interface SizeAndType {
  size: number;
  type: DiskType;
}
