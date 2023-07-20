import _ from 'lodash';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';

function makeDisk(enclosure: number, slot: number): UnusedDisk {
  return {
    type: DiskType.Hdd,
    devname: `enclosure${enclosure}-disk${slot}`,
    size: 5 * GiB,
    enclosure: {
      number: enclosure,
      slot,
    },
  } as UnusedDisk;
}

export const generateVdevDisks = _.shuffle([
  makeDisk(1, 1),
  makeDisk(1, 2),
  makeDisk(1, 3),

  makeDisk(2, 1),
  makeDisk(2, 2),
  {
    ...makeDisk(2, 4),
    devname: 'enclosure2-never-used-too-small',
    size: 0.2 * GiB,
  },

  makeDisk(3, 1),
  makeDisk(3, 2),
  makeDisk(3, 3),
  makeDisk(3, 4),
  makeDisk(3, 5),

  {
    ...makeDisk(4, 1),
    devname: 'larger1',
    size: 10 * GiB,
  },
  {
    ...makeDisk(4, 2),
    devname: 'larger2',
    size: 10 * GiB,
  },
  {
    ...makeDisk(4, 3),
    devname: 'larger3',
    size: 10 * GiB,
  },

  {
    type: DiskType.Hdd,
    devname: 'no-enclosure-disk1',
    size: 5 * GiB,
  },
  {
    ...makeDisk(5, 1),
    devname: 'small-ssd1',
    type: DiskType.Ssd,
    size: 2 * GiB,
  },
  {
    ...makeDisk(5, 2),
    devname: 'small-ssd2',
    type: DiskType.Ssd,
    size: 2 * GiB,
  },
] as UnusedDisk[]);

export function expectDisks(vdevs: string[][]): unknown[][] {
  return vdevs.map((vdev) => {
    return vdev.map((disk) => expect.objectContaining({ devname: disk }));
  });
}
