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
  parityLockForMinParity,
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

describe('parityLockForMinParity', () => {
  it('allows all non-dRAID layouts when minParity is 0', () => {
    const lock = parityLockForMinParity(0);
    expect(lock.allowedLayouts).toStrictEqual([...nonDraidLayouts]);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('drops Stripe and keeps Mirror + RAIDZ1/2/3 at minParity 1', () => {
    const lock = parityLockForMinParity(1);
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz1, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('keeps Mirror + RAIDZ2/3 and raises minMirrorWidth at minParity 2', () => {
    const lock = parityLockForMinParity(2);
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(3);
  });

  it('keeps only Mirror + RAIDZ3 and requires 4-wide mirror at minParity 3', () => {
    const lock = parityLockForMinParity(3);
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(4);
  });
});

describe('resolveParityLock', () => {
  const mirror2Vdev = [{ type: TopologyItemType.Mirror, children: [{}, {}] }] as VDevItem[];
  const mirror3Vdev = [{ type: TopologyItemType.Mirror, children: [{}, {}, {}] }] as VDevItem[];
  const raidz2Vdev = [{ type: TopologyItemType.Raidz2, children: [{}, {}, {}, {}] }] as VDevItem[];
  const draid2Vdev = [{
    type: TopologyItemType.Draid, children: [], name: 'draid2:1d:6c:2s-0',
  }] as VDevItem[];

  it('prefers existing category layout over everything else (strict single-layout match)', () => {
    const lock = resolveParityLock(
      mirror2Vdev,
      raidz2Vdev,
      { layout: CreateVdevLayout.Raidz3, width: 5 },
    );
    expect(lock.allowedLayouts).toStrictEqual([CreateVdevLayout.Mirror]);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('falls back to existing data parity when category is empty', () => {
    const lock = resolveParityLock(undefined, raidz2Vdev, { layout: CreateVdevLayout.Raidz1, width: 3 });
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(3);
  });

  it('derives parity from existing data mirror width', () => {
    const lock = resolveParityLock(undefined, mirror3Vdev, { layout: null, width: null });
    // 3-way mirror tolerates 2 failures -> minParity 2
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(3);
  });

  it('treats existing data dRAID as its raidz parity equivalent', () => {
    const lock = resolveParityLock(undefined, draid2Vdev, { layout: null, width: null });
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(3);
  });

  it('locks to existing category dRAID as its non-dRAID equivalent', () => {
    const lock = resolveParityLock(draid2Vdev, undefined, { layout: null, width: null });
    expect(lock.allowedLayouts).toStrictEqual([CreateVdevLayout.Raidz2]);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('uses wizard layout and width when no existing topology is present', () => {
    const lock = resolveParityLock(undefined, undefined, { layout: CreateVdevLayout.Raidz2, width: 4 });
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(3);
  });

  it('derives parity from wizard mirror width', () => {
    const lock = resolveParityLock(undefined, undefined, { layout: CreateVdevLayout.Mirror, width: 4 });
    // 4-way mirror tolerates 3 failures -> minParity 3
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(4);
  });

  it('leaves the lock unconstrained when wizard mirror width is not yet set', () => {
    const lock = resolveParityLock(undefined, undefined, { layout: CreateVdevLayout.Mirror, width: null });
    expect(lock.allowedLayouts).toStrictEqual([...nonDraidLayouts]);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('maps wizard dRAID layout to its raidz parity equivalent', () => {
    const lock = resolveParityLock(undefined, undefined, { layout: CreateVdevLayout.Draid3, width: 5 });
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(4);
  });

  it('returns a fully permissive lock when nothing is set', () => {
    const lock = resolveParityLock(undefined, undefined, { layout: null, width: null });
    expect(lock.allowedLayouts).toStrictEqual([...nonDraidLayouts]);
    expect(lock.minMirrorWidth).toBe(2);
  });

  it('ignores an existing Stripe category (misconfigured pool) and falls through to data parity', () => {
    const stripeVdev = [{ type: TopologyItemType.Disk, children: [] }] as VDevItem[];
    const lock = resolveParityLock(stripeVdev, raidz2Vdev, { layout: null, width: null });
    expect(lock.allowedLayouts).toStrictEqual([
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);
    expect(lock.minMirrorWidth).toBe(3);
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
