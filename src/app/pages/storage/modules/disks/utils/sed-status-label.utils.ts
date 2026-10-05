import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';

/**
 * Untranslated SED status label for a disk. The disk list resolves it once per row, so the
 * table cell and the hidden-column readout in the expanded details row show the same text.
 */
export function sedStatusLabel(disk: Disk): string {
  if (!disk?.sed) {
    return T('Unsupported');
  }

  switch (disk.sed_status) {
    case SedStatus.Unlocked:
      return T('Unlocked');
    case SedStatus.Locked:
      return T('Locked');
    case SedStatus.Uninitialized:
      return T('Uninitialized');
    case SedStatus.Failed:
      return T('Failed');
    default:
      return T('Unknown');
  }
}
