import { shuffle } from 'lodash-es';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';

function makeDisk(enclosure: string, slot: number): DetailsDisk {
  return {
    type: DiskType.Hdd,
    devname: `enclosure${enclosure}-disk${slot}`,
    size: 5 * GiB,
    enclosure: {
      id: enclosure,
      drive_bay_number: slot,
    },
  } as DetailsDisk;
}

export const generateVdevDisks = shuffle([
  makeDisk('1', 1),
  makeDisk('1', 2),
  makeDisk('1', 3),

  makeDisk('2', 1),
  makeDisk('2', 2),
  {
    ...makeDisk('2', 4),
    devname: 'enclosure2-never-used-too-small',
    size: 0.2 * GiB,
  },

  makeDisk('3', 1),
  makeDisk('3', 2),
  makeDisk('3', 3),
  makeDisk('3', 4),
  makeDisk('3', 5),

  {
    ...makeDisk('4', 1),
    devname: 'larger1',
    size: 10 * GiB,
  },
  {
    ...makeDisk('4', 2),
    devname: 'larger2',
    size: 10 * GiB,
  },
  {
    ...makeDisk('4', 3),
    devname: 'larger3',
    size: 10 * GiB,
  },

  {
    type: DiskType.Hdd,
    devname: 'no-enclosure-disk1',
    size: 5 * GiB,
  },
  {
    ...makeDisk('5', 1),
    devname: 'small-ssd1',
    type: DiskType.Ssd,
    size: 2 * GiB,
  },
  {
    ...makeDisk('5', 2),
    devname: 'small-ssd2',
    type: DiskType.Ssd,
    size: 2 * GiB,
  },
] as DetailsDisk[]);

export const categorySequence: VdevType[] = [
  VdevType.Data,
  VdevType.Log,
  VdevType.Spare,
  VdevType.Cache,
  VdevType.Special,
  VdevType.Dedup,
];

export function expectDisks(vdevs: string[][]): unknown[][] {
  return vdevs.map((vdev) => {
    return vdev.map((disk) => expect.objectContaining({ devname: disk }));
  });
}
