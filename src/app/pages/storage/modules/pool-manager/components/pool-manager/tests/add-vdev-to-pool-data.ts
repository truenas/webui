import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { TopologyDisk, VDevItem } from 'app/interfaces/storage.interface';

export const existingPool = {
  id: 1,
  name: 'APPS',
  guid: '4801980308377066041',
  path: '/mnt/APPS',
  status: PoolStatus.Online,
  scan: {},
  topology: {
    data: [
      {
        name: 'mirror-0',
        type: TopologyItemType.Mirror,
        guid: '6331690695774156983',
        status: TopologyItemStatus.Online,
        children: [
          {
            name: 'f5973318-16d3-4ba1-99ff-e4e78c88671e',
            type: TopologyItemType.Disk,
            path: '/dev/disk/by-partuuid/f5973318-16d3-4ba1-99ff-e4e78c88671e',
            guid: '4839666105427328895',
            status: TopologyItemStatus.Online,
            children: [] as TopologyDisk[],
            device: 'sdc1',
            disk: 'sdc',
            stats: {
              size: 12000138625024,
            },
            unavail_disk: null,
          },
          {
            name: 'f851ae00-b096-4342-88c0-27786cfed87a',
            type: 'DISK',
            path: '/dev/disk/by-partuuid/f851ae00-b096-4342-88c0-27786cfed87a',
            guid: '6546818946238472251',
            status: TopologyItemStatus.Online,
            children: [],
            device: 'sda1',
            disk: 'sda',
            stats: {
              size: 12000138625024,
            },
            unavail_disk: null,
          },
        ] as TopologyDisk[],
        unavail_disk: null,
      } as VDevItem,
      {
        name: 'mirror-1',
        type: TopologyItemType.Mirror,
        guid: '13849375887047425360',
        status: TopologyItemStatus.Online,
        children: [
          {
            name: 'ea279fcf-56bf-47c0-a386-506fe5eceb9e',
            type: TopologyItemType.Disk,
            path: '/dev/disk/by-partuuid/ea279fcf-56bf-47c0-a386-506fe5eceb9e',
            guid: '15911602115397506092',
            status: TopologyItemStatus.Online,
            children: [] as TopologyDisk[],
            device: 'sdh1',
            disk: 'sdh',
            stats: {
              size: 12000138625024,
            },
            unavail_disk: null,
          } as TopologyDisk,
          {
            name: '2314cb64-b4e1-4df9-8708-a55a7cb6ae64',
            type: TopologyItemType.Disk,
            path: '/dev/disk/by-partuuid/2314cb64-b4e1-4df9-8708-a55a7cb6ae64',
            guid: '2384382266614160232',
            status: TopologyItemStatus.Online,
            children: [],
            device: 'sdk1',
            disk: 'sdk',
            stats: {
              size: 12000138625024,
            },
            unavail_disk: null,
          },
        ] as TopologyDisk[],
        unavail_disk: null,
      } as VDevItem,
      {
        name: 'mirror-2',
        type: TopologyItemType.Mirror,
        guid: '18023735252693805632',
        status: TopologyItemStatus.Online,
        children: [
          {
            name: '6aff38aa-f776-45a4-8e04-913615ef0183',
            type: TopologyItemType.Disk,
            path: '/dev/disk/by-partuuid/6aff38aa-f776-45a4-8e04-913615ef0183',
            guid: '345418775175878585',
            status: TopologyItemStatus.Online,
            children: [] as TopologyDisk[],
            device: 'sdi1',
            disk: 'sdi',
            stats: {
              size: 12000138625024,
            },
            unavail_disk: null,
          },
          {
            name: 'b85f206e-a13e-4c93-a395-615193d19d45',
            type: TopologyItemType.Disk,
            path: '/dev/disk/by-partuuid/b85f206e-a13e-4c93-a395-615193d19d45',
            guid: '12869578439632579419',
            status: TopologyItemStatus.Online,
            children: [],
            device: 'sdj1',
            disk: 'sdj',
            stats: {
              size: 12000138625024,
            },
            unavail_disk: null,
          },
        ] as TopologyDisk[],
        unavail_disk: null,
      } as VDevItem,
    ],
    log: [],
    cache: [],
    spare: [],
    special: [],
    dedup: [],
  } as PoolTopology,
  healthy: true,
  size: 35974646071296,
} as Pool;

export const existingPoolDisks = [
  {
    identifier: '{serial_lunid}8HG7RJKH_5000cca2700e0cc0',
    name: 'sdc',
    subsystem: 'scsi',
    number: 2080,
    serial: '8HG7RJKH',
    lunid: '5000cca2700e0cc0',
    size: 12000138625024,
    type: 'HDD',
    devname: 'sdc',
    pool: 'APPS',
  },
  {
    identifier: '{serial_lunid}8HG2GZ5H_5000cca2700483cc',
    name: 'sda',
    subsystem: 'scsi',
    number: 2048,
    serial: '8HG2GZ5H',
    lunid: '5000cca2700483cc',
    size: 12000138625024,
    type: 'HDD',
    devname: 'sda',
    pool: 'APPS',
  },
  {
    identifier: '{serial_lunid}8HG29G5H_5000cca2700430f8',
    name: 'sdh',
    subsystem: 'scsi',
    number: 2160,
    serial: '8HG29G5H',
    lunid: '5000cca2700430f8',
    size: 12000138625024,
    type: 'HDD',
    devname: 'sdh',
    pool: 'APPS',
  },
  {
    identifier: '{serial_lunid}8HG3USZH_5000cca27006f774',
    name: 'sdk',
    subsystem: 'scsi',
    number: 2208,
    serial: '8HG3USZH',
    lunid: '5000cca27006f774',
    size: 12000138625024,
    type: 'HDD',
    devname: 'sdk',
    pool: 'APPS',
  },
  {
    identifier: '{serial_lunid}8HG5372H_5000cca2700947e4',
    name: 'sdi',
    subsystem: 'scsi',
    number: 2176,
    serial: '8HG5372H',
    lunid: '5000cca2700947e4',
    size: 12000138625024,
    type: 'HDD',
    devname: 'sdi',
    pool: 'APPS',
  },
  {
    identifier: '{serial_lunid}8HG77D9H_5000cca2700d2974',
    name: 'sdj',
    subsystem: 'scsi',
    number: 2192,
    serial: '8HG77D9H',
    lunid: '5000cca2700d2974',
    size: 12000138625024,
    type: 'HDD',
    devname: 'sdj',
    pool: 'APPS',
  },
] as Disk[];
