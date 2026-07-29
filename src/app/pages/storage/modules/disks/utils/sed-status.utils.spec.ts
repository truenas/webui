import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { sedStatusLabel } from 'app/pages/storage/modules/disks/utils/sed-status.utils';

describe('sedStatusLabel', () => {
  it('reports disks without SED support as unsupported', () => {
    expect(sedStatusLabel({ sed: false } as Disk)).toBe('Unsupported');
  });

  it('maps each known SED status to its label', () => {
    expect(sedStatusLabel({ sed: true, sed_status: SedStatus.Unlocked } as Disk)).toBe('Unlocked');
    expect(sedStatusLabel({ sed: true, sed_status: SedStatus.Locked } as Disk)).toBe('Locked');
    expect(sedStatusLabel({ sed: true, sed_status: SedStatus.Uninitialized } as Disk)).toBe('Uninitialized');
    expect(sedStatusLabel({ sed: true, sed_status: SedStatus.Failed } as Disk)).toBe('Failed');
  });

  it('falls back to unknown for an unrecognised status', () => {
    expect(sedStatusLabel({ sed: true } as Disk)).toBe('Unknown');
  });
});
