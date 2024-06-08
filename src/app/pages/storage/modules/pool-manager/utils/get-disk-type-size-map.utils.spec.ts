import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';

describe('getDiskTypeSizeMap', () => {
  it('groups disks into types and sizes', () => {
    const ssd1 = {
      type: DiskType.Ssd,
      size: 4 * GiB,
    };
    const ssd2 = {
      type: DiskType.Ssd,
      size: 5 * GiB,
    };
    const hdd1 = {
      type: DiskType.Hdd,
      size: 2 * GiB,
    };
    const hdd2 = {
      type: DiskType.Hdd,
      size: 2 * GiB,
    };
    const hdd3 = {
      type: DiskType.Hdd,
      size: 3 * GiB,
    };

    const disks = [ssd1, ssd2, hdd1, hdd2, hdd3] as DetailsDisk[];

    const diskMap = getDiskTypeSizeMap(disks);
    expect(diskMap).toEqual({
      [DiskType.Ssd]: {
        [4 * GiB]: [ssd1],
        [5 * GiB]: [ssd2],
      },
      [DiskType.Hdd]: {
        [2 * GiB]: [hdd1, hdd2],
        [3 * GiB]: [hdd3],
      },
    });
  });
});
