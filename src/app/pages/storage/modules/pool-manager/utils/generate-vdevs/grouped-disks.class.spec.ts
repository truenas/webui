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
      {
        devname: 'sde',
        type: DiskType.Ssd,
        size: 4 * GiB,
      },
      {
        devname: 'sdf',
        type: DiskType.Ssd,
        size: 5 * GiB,
      },
      {
        devname: 'sdg',
        type: DiskType.Hdd,
        size: 2 * GiB,
      },
      {
        devname: 'sdh',
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
      expect(disks).toHaveLength(3);
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdb' }));
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdd' }));
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdh' }));
      expect(disks.every((disk) => disk.type === DiskType.Hdd)).toBe(true);
    });

    it('returns disks matching type and minimum size when treatDiskSizeAsMinimum is true', () => {
      const disks = groupedDisks.findSuitableDisks({
        diskType: DiskType.Hdd,
        diskSize: 4 * GiB,
        treatDiskSizeAsMinimum: true,
      } as PoolManagerTopologyCategory);
      expect(disks).toHaveLength(4);
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdb' }));
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdc' }));
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdd' }));
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdh' }));
      expect(disks.every((disk) => disk.type === DiskType.Hdd)).toBe(true);
    });

    describe('when SSDs and HDDs of the same size exist', () => {
      it('returns only SSDs when SSD type is selected (treatDiskSizeAsMinimum = false)', () => {
        const disks = groupedDisks.findSuitableDisks({
          diskType: DiskType.Ssd,
          diskSize: 4 * GiB,
          treatDiskSizeAsMinimum: false,
        } as PoolManagerTopologyCategory);

        expect(disks).toHaveLength(1);
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sde' }));
        expect(disks.every((disk) => disk.type === DiskType.Ssd)).toBe(true);
      });

      it('returns only SSDs when SSD type is selected (treatDiskSizeAsMinimum = true)', () => {
        const disks = groupedDisks.findSuitableDisks({
          diskType: DiskType.Ssd,
          diskSize: 2 * GiB,
          treatDiskSizeAsMinimum: true,
        } as PoolManagerTopologyCategory);

        expect(disks).toHaveLength(3);
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sda' }));
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sde' }));
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdf' }));
        expect(disks.every((disk) => disk.type === DiskType.Ssd)).toBe(true);
      });

      it('returns only HDDs when HDD type is selected (treatDiskSizeAsMinimum = false)', () => {
        const disks = groupedDisks.findSuitableDisks({
          diskType: DiskType.Hdd,
          diskSize: 4 * GiB,
          treatDiskSizeAsMinimum: false,
        } as PoolManagerTopologyCategory);

        expect(disks).toHaveLength(3);
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdb' }));
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdd' }));
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdh' }));
        expect(disks.every((disk) => disk.type === DiskType.Hdd)).toBe(true);
      });

      it('returns only HDDs when HDD type is selected (treatDiskSizeAsMinimum = true)', () => {
        const disks = groupedDisks.findSuitableDisks({
          diskType: DiskType.Hdd,
          diskSize: 2 * GiB,
          treatDiskSizeAsMinimum: true,
        } as PoolManagerTopologyCategory);

        expect(disks).toHaveLength(5);
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdb' }));
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdc' }));
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdd' }));
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdg' }));
        expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdh' }));
        expect(disks.every((disk) => disk.type === DiskType.Hdd)).toBe(true);
      });
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
      expect(disks).toHaveLength(2);
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdd' }));
      expect(disks).toContainEqual(expect.objectContaining({ devname: 'sdh' }));
    });
  });
});
