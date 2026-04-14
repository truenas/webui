import { CreateVdevLayout, TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  existingVdevLayout,
  nonDraidEquivalent,
  parseDraidVdevName,
  resolveTopologyLayout,
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
      [VDevType.Data]: {
        vdevs: [
          [disk1, disk2],
          [disk3],
        ],
      },
      [VDevType.Log]: {
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
      [VDevType.Data]: {
        layout: CreateVdevLayout.Mirror,
        vdevs: [
          [disk1, disk2],
          [disk3, disk4],
        ],
      },
      [VDevType.Log]: {
        layout: CreateVdevLayout.Stripe,
        vdevs: [
          [disk5],
          [disk6],
        ],
      },
      [VDevType.Spare]: {
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
      [VDevType.Data]: {
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

describe('nonDraidEquivalent', () => {
  it('maps DRAID layouts to equivalent RAIDZ layouts', () => {
    expect(nonDraidEquivalent(CreateVdevLayout.Draid1)).toBe(CreateVdevLayout.Raidz1);
    expect(nonDraidEquivalent(CreateVdevLayout.Draid2)).toBe(CreateVdevLayout.Raidz2);
    expect(nonDraidEquivalent(CreateVdevLayout.Draid3)).toBe(CreateVdevLayout.Raidz3);
  });

  it('returns non-DRAID layouts unchanged', () => {
    expect(nonDraidEquivalent(CreateVdevLayout.Mirror)).toBe(CreateVdevLayout.Mirror);
    expect(nonDraidEquivalent(CreateVdevLayout.Stripe)).toBe(CreateVdevLayout.Stripe);
    expect(nonDraidEquivalent(CreateVdevLayout.Raidz1)).toBe(CreateVdevLayout.Raidz1);
    expect(nonDraidEquivalent(CreateVdevLayout.Raidz2)).toBe(CreateVdevLayout.Raidz2);
    expect(nonDraidEquivalent(CreateVdevLayout.Raidz3)).toBe(CreateVdevLayout.Raidz3);
  });
});

describe('resolveTopologyLayout', () => {
  it('returns null for empty or undefined items', () => {
    expect(resolveTopologyLayout([])).toBeNull();
    expect(resolveTopologyLayout(undefined)).toBeNull();
  });

  it('returns Stripe for a single disk with no children', () => {
    const items = [{ type: TopologyItemType.Disk, children: [] }] as VDevItem[];
    expect(resolveTopologyLayout(items)).toBe(CreateVdevLayout.Stripe);
  });

  it('returns Mirror for mirror vdevs', () => {
    const items = [{ type: TopologyItemType.Mirror, children: [{}, {}] }] as VDevItem[];
    expect(resolveTopologyLayout(items)).toBe(CreateVdevLayout.Mirror);
  });

  it('returns dRAID layout for dRAID vdevs', () => {
    const items = [{ type: TopologyItemType.Draid, children: [], name: 'draid2:1d:6c:2s-0' }] as VDevItem[];
    expect(resolveTopologyLayout(items)).toBe(CreateVdevLayout.Draid2);
  });

  it('returns Raidz1 for raidz1 vdevs', () => {
    const items = [{ type: TopologyItemType.Raidz1, children: [{}, {}, {}] }] as VDevItem[];
    expect(resolveTopologyLayout(items)).toBe(CreateVdevLayout.Raidz1);
  });

  it('returns null for unhandled topology types', () => {
    const items = [{ type: TopologyItemType.Replacing, children: [] }] as VDevItem[];
    expect(resolveTopologyLayout(items)).toBeNull();
  });
});

describe('existingVdevLayout', () => {
  it('returns null for empty or undefined items', () => {
    expect(existingVdevLayout([])).toBeNull();
    expect(existingVdevLayout(undefined)).toBeNull();
  });

  it('returns Stripe for a single disk with no children', () => {
    const items = [{ type: TopologyItemType.Disk, children: [] }] as VDevItem[];
    expect(existingVdevLayout(items)).toBe(CreateVdevLayout.Stripe);
  });

  it('returns Mirror for mirror vdevs', () => {
    const items = [{ type: TopologyItemType.Mirror, children: [{}, {}] }] as VDevItem[];
    expect(existingVdevLayout(items)).toBe(CreateVdevLayout.Mirror);
  });

  it('maps dRAID vdevs to equivalent RAIDZ layout', () => {
    const items = [{ type: TopologyItemType.Draid, children: [], name: 'draid2:1d:6c:2s-0' }] as VDevItem[];
    expect(existingVdevLayout(items)).toBe(CreateVdevLayout.Raidz2);
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
