import { CreateVdevLayout, TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  existingVdevLayout,
  layoutParity,
  nonDraidEquivalent,
  nonDraidLayouts,
  parseDraidVdevName,
  resolveParityLock,
  resolveTopologyLayout,
  topologyCategoryToDisks,
  topologyToDisks,
  topologyToPayload,
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

  it('throws when a non-spare category has vdevs but layout is null', () => {
    const topology = {
      [VDevType.Data]: {
        layout: null,
        vdevs: [[{ devname: 'ada1' } as DetailsDisk]],
      },
    } as PoolManagerTopology;

    expect(() => topologyToPayload(topology)).toThrow(
      'topologyToPayload: category "data" has vdevs but no layout set.',
    );
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

  it('returns Raidz1 for bare RAIDZ vdevs', () => {
    const items = [{ type: TopologyItemType.Raidz, children: [{}, {}, {}] }] as VDevItem[];
    expect(resolveTopologyLayout(items)).toBe(CreateVdevLayout.Raidz1);
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
    expect(existingVdevLayout(undefined)).toBeNull();
    expect(existingVdevLayout([])).toBeNull();
  });

  it('passes non-dRAID layouts through unchanged', () => {
    const items = [{ type: TopologyItemType.Mirror, children: [{}, {}] }] as VDevItem[];
    expect(existingVdevLayout(items)).toBe(CreateVdevLayout.Mirror);
  });

  it('maps dRAID layouts to their non-dRAID equivalent', () => {
    const items = [{ type: TopologyItemType.Draid, children: [], name: 'draid3:1d:6c:2s-0' }] as VDevItem[];
    expect(existingVdevLayout(items)).toBe(CreateVdevLayout.Raidz3);
  });
});

describe('layoutParity', () => {
  it('returns 0 for Stripe regardless of width', () => {
    expect(layoutParity(CreateVdevLayout.Stripe, 1)).toBe(0);
    expect(layoutParity(CreateVdevLayout.Stripe, 5)).toBe(0);
  });

  it('returns width-1 for Mirror', () => {
    expect(layoutParity(CreateVdevLayout.Mirror, 2)).toBe(1);
    expect(layoutParity(CreateVdevLayout.Mirror, 3)).toBe(2);
    expect(layoutParity(CreateVdevLayout.Mirror, 4)).toBe(3);
  });

  it('returns 1/2/3 for RAIDZ and dRAID variants', () => {
    expect(layoutParity(CreateVdevLayout.Raidz1, 3)).toBe(1);
    expect(layoutParity(CreateVdevLayout.Draid1, 3)).toBe(1);
    expect(layoutParity(CreateVdevLayout.Raidz2, 4)).toBe(2);
    expect(layoutParity(CreateVdevLayout.Draid2, 4)).toBe(2);
    expect(layoutParity(CreateVdevLayout.Raidz3, 5)).toBe(3);
    expect(layoutParity(CreateVdevLayout.Draid3, 5)).toBe(3);
  });
});

describe('resolveParityLock', () => {
  const mirror2Vdev = [{ type: TopologyItemType.Mirror, children: [{}, {}] }] as VDevItem[];
  const raidz2Vdev = [{ type: TopologyItemType.Raidz2, children: [{}, {}, {}, {}] }] as VDevItem[];
  const stripeVdev = [{ type: TopologyItemType.Disk, children: [] }] as VDevItem[];
  const layoutsWithoutStripeOrDraid = [
    CreateVdevLayout.Mirror, CreateVdevLayout.Raidz1, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
  ];

  it('returns Mirror + RAIDZ1/2/3 (no Stripe, no dRAID) when data is non-stripe', () => {
    const lock = resolveParityLock(raidz2Vdev, { layout: null });
    expect(lock.allowedLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('keeps Mirror always at 2-way regardless of data mirror width', () => {
    const mirror4Vdev = [{ type: TopologyItemType.Mirror, children: [{}, {}, {}, {}] }] as VDevItem[];
    const lock = resolveParityLock(mirror4Vdev, { layout: null });
    expect(lock.allowedLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('allows RAIDZ1 even when data is RAIDZ3', () => {
    const raidz3Vdev = [{ type: TopologyItemType.Raidz3, children: [{}, {}, {}, {}, {}] }] as VDevItem[];
    const lock = resolveParityLock(raidz3Vdev, { layout: null });
    expect(lock.allowedLayouts).toContain(CreateVdevLayout.Raidz1);
    expect(lock.allowedLayouts).toContain(CreateVdevLayout.Mirror);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('falls back to wizard data layout when no existing data is present', () => {
    const lock = resolveParityLock(undefined, { layout: CreateVdevLayout.Raidz2 });
    expect(lock.allowedLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('still hides dRAID layouts even when wizard data is dRAID', () => {
    const lock = resolveParityLock(undefined, { layout: CreateVdevLayout.Draid3 });
    expect(lock.allowedLayouts).not.toContain(CreateVdevLayout.Draid1);
    expect(lock.allowedLayouts).not.toContain(CreateVdevLayout.Draid2);
    expect(lock.allowedLayouts).not.toContain(CreateVdevLayout.Draid3);
  });

  it('hides Stripe when neither existing nor wizard data is Stripe', () => {
    const lock = resolveParityLock(mirror2Vdev, { layout: null });
    expect(lock.allowedLayouts).not.toContain(CreateVdevLayout.Stripe);
  });

  it('hides Stripe when nothing is set yet', () => {
    const lock = resolveParityLock(undefined, { layout: null });
    expect(lock.allowedLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('exposes Stripe only when existing data is Stripe', () => {
    const lock = resolveParityLock(stripeVdev, { layout: null });
    expect(lock.allowedLayouts).toStrictEqual([...nonDraidLayouts]);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('exposes Stripe when wizard data is Stripe and no pool exists yet', () => {
    const lock = resolveParityLock(undefined, { layout: CreateVdevLayout.Stripe });
    expect(lock.allowedLayouts).toStrictEqual([...nonDraidLayouts]);
    expect(lock.minMirrorWidth).toBe(2);
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
