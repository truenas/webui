import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';

/**
 * Translation marker for a disk's Self-Encrypting Drive status. Returns an
 * untranslated marker — pass it through `translate` at the call site.
 */
export function sedStatusLabel(disk: Disk): string {
  if (!disk.sed) {
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
