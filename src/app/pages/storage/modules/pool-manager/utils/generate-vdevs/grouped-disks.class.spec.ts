import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { GroupedDisks } from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/grouped-disks.class';

describe('GroupedDisks', () => {
  let groupedDisks: GroupedDisks;

  beforeEach(() => {
    const disks = [
      {
        devname: 'sda',
        type: DiskType.Ssd,
        size: 2 * GiB,
      },
      {
        devname: 'sdb',
        type: DiskType.Hdd,
        size: 4 * GiB,
      },
      {
        devname: 'sdc',
        type: DiskType.Hdd,
        size: 5 * GiB,
      },
      {
        devname: 'sdd',
        type: DiskType.Hdd,
        size: 4 * GiB,
      },
    ] as DetailsDisk[];

    groupedDisks = new GroupedDisks(disks);
  });

  describe('findSuitableDisks', () => {
    it('returns disks matching type and size', () => {
      const disks = groupedDisks.findSuitableDisks({
        diskType: DiskType.Hdd,
        diskSize: 4 * GiB,
        treatDiskSizeAsMinimum: false,
      } as PoolManagerTopologyCategory);
      expect(disks).toHaveLength(2);
      expect(disks[0].devname).toBe('sdb');
      expect(disks[1].devname).toBe('sdd');
    });

    it('returns disks matching type and minimum size when treatDiskSizeAsMinimum is true', () => {
      const disks = groupedDisks.findSuitableDisks({
        diskType: DiskType.Hdd,
        diskSize: 4 * GiB,
        treatDiskSizeAsMinimum: true,
      } as PoolManagerTopologyCategory);
      expect(disks).toHaveLength(3);
      expect(disks[0].devname).toBe('sdb');
      expect(disks[1].devname).toBe('sdd');
      expect(disks[2].devname).toBe('sdc');
    });
  });

  describe('removeUsedDisks', () => {
    it('removes disks matching them by devname', () => {
      groupedDisks.removeUsedDisks([
        { devname: 'sdb' },
      ] as DetailsDisk[]);

      const disks = groupedDisks.findSuitableDisks({
        diskType: DiskType.Hdd,
        diskSize: 4 * GiB,
        treatDiskSizeAsMinimum: false,
      } as PoolManagerTopologyCategory);
      expect(disks).toHaveLength(1);
      expect(disks[0].devname).toBe('sdd');
    });
  });
});
