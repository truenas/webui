import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { sedStatusLabel } from 'app/pages/storage/modules/disks/utils/sed-status-label.utils';

describe('sedStatusLabel', () => {
  it.each([
    [{ sed: false } as Disk, 'Unsupported'],
    [{ sed: null } as unknown as Disk, 'Unsupported'],
    [{} as Disk, 'Unsupported'],
    [{ sed: true, sed_status: SedStatus.Unlocked } as Disk, 'Unlocked'],
    [{ sed: true, sed_status: SedStatus.Locked } as Disk, 'Locked'],
    [{ sed: true, sed_status: SedStatus.Uninitialized } as Disk, 'Uninitialized'],
    [{ sed: true, sed_status: SedStatus.Failed } as Disk, 'Failed'],
    [{ sed: true, sed_status: 'SOMETHING_ELSE' as SedStatus } as Disk, 'Unknown'],
  ])('labels %j as "%s"', (disk, label) => {
    expect(sedStatusLabel(disk)).toBe(label);
  });
});
