import { combineLatest, distinctUntilChanged, map, Observable } from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  DataPoolTopologyUpdate, Pool, PoolTopology, UpdatePoolTopology,
} from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export function topologyToDisks(topology: PoolManagerTopology): DetailsDisk[] {
  return Object.values(topology).flatMap((category) => topologyCategoryToDisks(category));
}

export function topologyCategoryToDisks(topologyCategory: PoolManagerTopologyCategory): DetailsDisk[] {
  return topologyCategory.vdevs.flat();
}

export function topologyToPayload(topology: PoolManagerTopology): UpdatePoolTopology {
  const payload: UpdatePoolTopology = {};

  (Object.entries(topology) as [VDevType, PoolManagerTopologyCategory][]).forEach(([vdevType, category]) => {
    if (!category.vdevs.length) {
      return;
    }

    if (vdevType === VDevType.Spare) {
      payload.spares = category.vdevs.flatMap((vdev) => {
        return vdev.map((disk) => disk.devname);
      });
      return;
    }

    if (category.layout === null) {
      // Invariant assertion: by the time submit runs, every category with vdevs
      // must have a layout. A silent skip here would drop the user's configured
      // vdevs from the payload, so failing loud is preferable to a pool missing
      // its special/dedup category.
      throw new Error(`topologyToPayload: category "${vdevType}" has vdevs but no layout set.`);
    }

    const { layout } = category;

    payload[vdevType] = category.vdevs.map((vdev) => {
      let typePayload = {
        type: layout,
        disks: vdev.map((disk) => disk.devname),
      };

      if (isDraidLayout(layout)) {
        typePayload = {
          ...typePayload,
          draid_data_disks: category.draidDataDisks,
          draid_spare_disks: category.draidSpareDisks,
        } as DataPoolTopologyUpdate;
      }

      return typePayload;
    });
  });

  return payload;
}

export function poolTopologyToStoreTopology(topology: PoolTopology, disks: DetailsDisk[]): PoolManagerTopology {
  const categories = Object.values(VDevType);

  const poolManagerTopology: PoolManagerTopology = Object.values(VDevType).reduce((topologySoFar, value) => {
    return {
      ...topologySoFar,
      [value]: {
        layout: null,
        width: null,
        diskSize: null,
        diskType: null,
        vdevsNumber: null,
        treatDiskSizeAsMinimum: false,
        vdevs: [],
        hasCustomDiskSelection: false,
        draidDataDisks: null,
        draidSpareDisks: null,
      } as PoolManagerTopologyCategory,
    };
  }, {} as PoolManagerTopology);
  for (const category of categories) {
    const vdevs = topology[category as VDevType];

    if (!vdevs?.length) {
      continue;
    }
    const layout = resolveTopologyLayout(vdevs);
    const width = vdevs[0].children.length || 1;
    const minSize = Math.min(...(disks.map((disk) => disk.size)));

    let draidDataDisks: number | null = null;
    let draidSpareDisks: number | null = null;

    if (vdevs[0].type === TopologyItemType.Draid) {
      const parsedDraidInfo = parseDraidVdevName(vdevs[0].name);
      draidDataDisks = parsedDraidInfo.dataDisks;
      draidSpareDisks = parsedDraidInfo.spareDisks;
    }

    poolManagerTopology[category as VDevType] = {
      diskType: disks[0].type,
      diskSize: minSize,
      layout,
      vdevsNumber: vdevs.length,
      width,
      hasCustomDiskSelection: vdevs.some((vdev) => vdevs[0].children.length !== vdev.children.length),
      vdevs: topology[category as VDevType].map(
        (topologyItem) => {
          if (topologyItem.children.length) {
            return topologyItem.children.map(
              (topologyDisk) => ({
                name: topologyDisk.disk,
                size: topologyDisk.stats.size,
                type: DiskType.Hdd,
                devname: topologyDisk.disk,
              } as DetailsDisk),
            );
          }
          const matchedDisk = disks.find((disk) => disk.devname === topologyItem.disk);
          return matchedDisk ? [{ ...matchedDisk }] : [];
        },
      ),
      treatDiskSizeAsMinimum: false,
      draidDataDisks,
      draidSpareDisks,
    };
  }
  return poolManagerTopology;
}

/**
 * Single source of truth for which CreateVdevLayout values are dRAID.
 * isDraidLayout and nonDraidLayouts both derive from this so a new DRAID
 * enum member can't slip into nonDraidLayouts by accident.
 */
const draidCreateLayouts: readonly CreateVdevLayout[] = [
  CreateVdevLayout.Draid1,
  CreateVdevLayout.Draid2,
  CreateVdevLayout.Draid3,
];

/**
 * Non-data vdevs (special, dedup) don't support DRAID, but should match the
 * redundancy level of the data vdevs. This maps any layout to its non-DRAID
 * equivalent with the same parity level.
 */
export function nonDraidEquivalent(layout: CreateVdevLayout): CreateVdevLayout {
  switch (layout) {
    case CreateVdevLayout.Draid1: return CreateVdevLayout.Raidz1;
    case CreateVdevLayout.Draid2: return CreateVdevLayout.Raidz2;
    case CreateVdevLayout.Draid3: return CreateVdevLayout.Raidz3;
    default: return layout;
  }
}

/** Used only via {@link resolveTopologyLayout}; Disk and Draid are handled before lookup. */
const topologyTypeToLayout: Partial<Record<TopologyItemType, CreateVdevLayout>> = {
  [TopologyItemType.Stripe]: CreateVdevLayout.Stripe,
  [TopologyItemType.Mirror]: CreateVdevLayout.Mirror,
  [TopologyItemType.Raidz]: CreateVdevLayout.Raidz1,
  [TopologyItemType.Raidz1]: CreateVdevLayout.Raidz1,
  [TopologyItemType.Raidz2]: CreateVdevLayout.Raidz2,
  [TopologyItemType.Raidz3]: CreateVdevLayout.Raidz3,
};

/**
 * Resolves the layout of existing vdev items to a CreateVdevLayout.
 * All items in the array are assumed to share the same layout (ZFS guarantees
 * this per vdev category), so only the first item is inspected.
 * Returns null when there are no existing items or the type is unrecognised
 * (e.g. transient states like Replacing / Spare).
 */
export function resolveTopologyLayout(items: VDevItem[] | undefined): CreateVdevLayout | null {
  if (!items?.length) {
    return null;
  }
  const firstItem = items[0];
  if (firstItem.type === TopologyItemType.Disk && !firstItem.children.length) {
    return CreateVdevLayout.Stripe;
  }
  if (firstItem.type === TopologyItemType.Draid) {
    return parseDraidVdevName(firstItem.name).layout;
  }
  return topologyTypeToLayout[firstItem.type] ?? null;
}

/**
 * Like resolveTopologyLayout, but maps dRAID layouts to their raidz equivalents.
 * Used for non-data vdevs (special, dedup) that don't support dRAID.
 */
export function existingVdevLayout(items: VDevItem[] | undefined): CreateVdevLayout | null {
  const layout = resolveTopologyLayout(items);
  return layout !== null ? nonDraidEquivalent(layout) : null;
}

/**
 * Every CreateVdevLayout value except the dRAID ones. Order is not semantic —
 * dropdown ordering is driven by {@link vdevLayoutOptions} in the component.
 */
export const nonDraidLayouts: readonly CreateVdevLayout[] = Object.values(CreateVdevLayout)
  .filter((layout) => !draidCreateLayouts.includes(layout));

/**
 * Constraint on the Layout + Width controls for a special/dedup vdev.
 * Expressed as the set of layouts the user may pick plus a minimum Mirror
 * width, rather than a single locked layout, so that any layout matching the
 * data vdev's parity level is allowed (e.g. a 3-way mirror alongside RAIDZ2).
 */
export interface ParityLock {
  allowedLayouts: readonly CreateVdevLayout[];
  /** Applies only when Mirror is selected. `2` is the effective floor. */
  minMirrorWidth: number;
}

const unconstrainedParityLock: ParityLock = {
  allowedLayouts: nonDraidLayouts,
  minMirrorWidth: 2,
};

/**
 * Number of simultaneous drive failures `layout` at the given width can
 * survive: Stripe = 0, Mirror = width-1, RaidzN/DraidN = N.
 */
export function layoutParity(layout: CreateVdevLayout, width: number): number {
  switch (layout) {
    case CreateVdevLayout.Stripe: return 0;
    case CreateVdevLayout.Mirror: return Math.max(0, width - 1);
    case CreateVdevLayout.Raidz1:
    case CreateVdevLayout.Draid1: return 1;
    case CreateVdevLayout.Raidz2:
    case CreateVdevLayout.Draid2: return 2;
    case CreateVdevLayout.Raidz3:
    case CreateVdevLayout.Draid3: return 3;
    default: return 0;
  }
}

/**
 * ParityLock admitting every non-dRAID layout that can tolerate at least
 * `minParity` drive failures. Mirror is always in the set but gated by
 * `minMirrorWidth` (width-1 >= minParity).
 */
export function parityLockForMinParity(minParity: number): ParityLock {
  const allowedLayouts = nonDraidLayouts.filter((layout) => {
    if (layout === CreateVdevLayout.Mirror) {
      return true;
    }
    return layoutParity(layout, 0) >= minParity;
  });
  return {
    allowedLayouts,
    minMirrorWidth: Math.max(2, minParity + 1),
  };
}

/**
 * Resolves the parity lock for a special or dedup vdev. These vdevs' failure
 * destroys the whole pool, so their redundancy must be at least the data
 * vdev's. Preference order:
 *   1. Existing special/dedup layout (pool already has vdevs in this category;
 *      the new vdev must match exactly — pools don't mix layouts inside a
 *      category).
 *   2. Existing data layout (pool has data vdevs; match their parity level).
 *   3. Wizard-selected data layout and width (new pool; match parity).
 * Returns the fully permissive lock when none are set (e.g. user jumps to the
 * step before picking a data layout).
 */
export function resolveParityLock(
  existingCategory: VDevItem[] | undefined,
  existingData: VDevItem[] | undefined,
  wizardData: { layout: CreateVdevLayout | null; width: number | null } | undefined,
): ParityLock {
  // A Stripe special/dedup vdev would be a misconfigured pool (no redundancy
  // where it's required). Ignore it and fall through to data-parity so we
  // don't "lock" a new vdev into a no-redundancy layout.
  const categoryLayout = existingVdevLayout(existingCategory);
  if (categoryLayout !== null && categoryLayout !== CreateVdevLayout.Stripe) {
    return { allowedLayouts: [categoryLayout], minMirrorWidth: 2 };
  }

  if (existingData?.length) {
    const layout = resolveTopologyLayout(existingData);
    if (layout !== null) {
      const width = existingData[0].children?.length ?? 2;
      return parityLockForMinParity(layoutParity(layout, width));
    }
  }

  if (wizardData?.layout) {
    // Mirror parity depends on width; if width isn't picked yet, don't lock.
    if (wizardData.layout === CreateVdevLayout.Mirror && !wizardData.width) {
      return unconstrainedParityLock;
    }
    return parityLockForMinParity(layoutParity(wizardData.layout, wizardData.width ?? 2));
  }

  return unconstrainedParityLock;
}

/**
 * Emits the parity lock for the given special/dedup category. Shared by the
 * metadata and dedup wizard steps so both react to the same set of inputs
 * (existing pool topology, wizard data layout + width) in the same way.
 */
export function parityLock$(
  pool$: Observable<Pool | null>,
  topology$: Observable<PoolManagerTopology>,
  vdevType: VDevType.Special | VDevType.Dedup,
): Observable<ParityLock> {
  return combineLatest([pool$, topology$]).pipe(
    map(([pool, topology]) => resolveParityLock(
      pool?.topology[vdevType],
      pool?.topology[VDevType.Data],
      { layout: topology[VDevType.Data].layout, width: topology[VDevType.Data].width },
    )),
    distinctUntilChanged((a, b) => (
      a.minMirrorWidth === b.minMirrorWidth
      && a.allowedLayouts.length === b.allowedLayouts.length
      && a.allowedLayouts.every((layout, i) => layout === b.allowedLayouts[i])
    )),
  );
}

export function isDraidLayout(layout: CreateVdevLayout | TopologyItemType | null | undefined): boolean {
  if (layout === TopologyItemType.Draid) {
    return true;
  }
  return draidCreateLayouts.includes(layout as CreateVdevLayout);
}

export function parseDraidVdevName(
  vdevName: string,
): { layout: CreateVdevLayout; dataDisks: number; spareDisks: number } {
  const regex = /draid(\d+):(\d+)d:(\d+)c:(\d+)s-(\d+)/;
  const match = regex.exec(vdevName);

  if (!match) {
    throw new Error('Invalid dRAID vdev name');
  }

  const [, parityLevelNumber, dataDisks, , spareDisk] = match;
  let parityLevel: CreateVdevLayout;
  if (parityLevelNumber === '2') {
    parityLevel = CreateVdevLayout.Draid2;
  } else if (parityLevelNumber === '3') {
    parityLevel = CreateVdevLayout.Draid3;
  } else {
    parityLevel = CreateVdevLayout.Draid1;
  }

  return {
    layout: parityLevel,
    dataDisks: Number(dataDisks),
    spareDisks: Number(spareDisk),
  };
}
