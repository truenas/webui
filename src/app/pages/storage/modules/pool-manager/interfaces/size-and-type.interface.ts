import { DiskType } from 'app/enums/disk-type.enum';

/**
 * Object rather than a `[size, type]` tuple: `tn-select`'s `writeValue` unwraps an
 * array value to its first element in single-select mode, so an array-valued option
 * can never be written back into the control.
 */
export interface SizeAndType {
  size: number;
  type: DiskType;
}
