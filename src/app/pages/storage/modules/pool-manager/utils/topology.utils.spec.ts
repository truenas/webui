import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  parseDraidVdevName,
  topologyCategoryToDisks,
  topologyToDisks, topologyToPayload,
} from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

describe('topologyCategoryToDisks', () => {
  it('converts topology category to an array of disks', () => {
    const disk1 = {} as DetailsDisk;
    const disk2 = {} as DetailsDisk;
    const disk3 = {} as DetailsDisk;

    const category = {
      vdevs: [
        [disk1, disk2],
        [disk3],
      ],
    } as PoolManagerTopologyCategory;

    expect(topologyCategoryToDisks(category)).toEqual([disk1, disk2, disk3]);
  });
});

describe('topologyToDisks', () => {
  it('converts topology to an array of disks', () => {
    const disk1 = {} as DetailsDisk;
    const disk2 = {} as DetailsDisk;
    const disk3 = {} as DetailsDisk;
    const disk4 = {} as DetailsDisk;
    const disk5 = {} as DetailsDisk;

    const topology = {
      [VdevType.Data]: {
        vdevs: [
          [disk1, disk2],
          [disk3],
        ],
      },
      [VdevType.Log]: {
        vdevs: [
          [disk4],
          [disk5],
        ],
      },
    } as PoolManagerTopology;

    expect(topologyToDisks(topology)).toEqual([disk1, disk2, disk3, disk4, disk5]);
  });
});

describe('topologyToPayload', () => {
  it('converts store topology to websocket payload', () => {
    const disk1 = { devname: 'ada1' } as DetailsDisk;
    const disk2 = { devname: 'ada2' } as DetailsDisk;
    const disk3 = { devname: 'ada3' } as DetailsDisk;
    const disk4 = { devname: 'ada4' } as DetailsDisk;
    const disk5 = { devname: 'ada5' } as DetailsDisk;
    const disk6 = { devname: 'ada6' } as DetailsDisk;
    const disk7 = { devname: 'ada7' } as DetailsDisk;

    const topology = {
      [VdevType.Data]: {
        layout: CreateVdevLayout.Mirror,
        vdevs: [
          [disk1, disk2],
          [disk3, disk4],
        ],
      },
      [VdevType.Log]: {
        layout: CreateVdevLayout.Stripe,
        vdevs: [
          [disk5],
          [disk6],
        ],
      },
      [VdevType.Spare]: {
        vdevs: [
          [disk7],
        ],
      },
    } as PoolManagerTopology;

    expect(topologyToPayload(topology)).toEqual({
      data: [
        { type: CreateVdevLayout.Mirror, disks: ['ada1', 'ada2'] },
        { type: CreateVdevLayout.Mirror, disks: ['ada3', 'ada4'] },
      ],
      log: [
        { type: CreateVdevLayout.Stripe, disks: ['ada5'] },
        { type: CreateVdevLayout.Stripe, disks: ['ada6'] },
      ],
      spares: ['ada7'],
    });
  });

  it('converts dRAID layout to websocket payload', () => {
    const disk1 = { devname: 'ada1' } as DetailsDisk;
    const disk2 = { devname: 'ada2' } as DetailsDisk;
    const disk3 = { devname: 'ada3' } as DetailsDisk;
    const disk4 = { devname: 'ada4' } as DetailsDisk;

    const topology = {
      [VdevType.Data]: {
        layout: CreateVdevLayout.Draid1,
        vdevs: [
          [disk1, disk2],
          [disk3, disk4],
        ],
        draidSpareDisks: 1,
        draidDataDisks: 1,
      },
    } as PoolManagerTopology;

    expect(topologyToPayload(topology)).toEqual({
      data: [
        {
          type: CreateVdevLayout.Draid1, disks: ['ada1', 'ada2'], draid_data_disks: 1, draid_spare_disks: 1,
        },
        {
          type: CreateVdevLayout.Draid1, disks: ['ada3', 'ada4'], draid_data_disks: 1, draid_spare_disks: 1,
        },
      ],
    });
  });
});

describe('parseDraidVdevName', () => {
  it('parses dRAID vdev name into layout, data disks and spare', () => {
    expect(parseDraidVdevName('draid3:1d:6c:2s-0')).toEqual({
      layout: CreateVdevLayout.Draid3,
      dataDisks: 1,
      spareDisks: 2,
    });
  });
});
