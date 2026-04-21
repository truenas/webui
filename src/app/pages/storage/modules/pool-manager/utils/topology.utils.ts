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
function existingVdevLayout(items: VDevItem[] | undefined): CreateVdevLayout | null {
  const layout = resolveTopologyLayout(items);
  return layout !== null ? nonDraidEquivalent(layout) : null;
}

/**
 * Resolves the layout that a special or dedup vdev must be locked to.
 * These vdevs' failure destroys the whole pool, so their redundancy must match
 * the data vdev's. Preference order:
 *   1. Existing special/dedup layout (already in the pool).
 *   2. Existing data layout (pool already has data vdevs).
 *   3. Wizard-selected data layout (new pool being created).
 * Returns null when none are set (e.g. user jumps to this step before picking
 * a data layout); callers should allow the full non-dRAID list in that case.
 */
export function resolveParityLockedLayout(
  existingCategory: VDevItem[] | undefined,
  existingData: VDevItem[] | undefined,
  wizardDataLayout: CreateVdevLayout | null | undefined,
): CreateVdevLayout | null {
  const categoryLayout = existingVdevLayout(existingCategory);
  if (categoryLayout !== null) {
    return categoryLayout;
  }
  const dataLayout = existingVdevLayout(existingData);
  if (dataLayout !== null) {
    return dataLayout;
  }
  return wizardDataLayout ? nonDraidEquivalent(wizardDataLayout) : null;
}

export interface ParityLayoutLockState {
  lockedLayout: CreateVdevLayout | null;
  currentLayout: CreateVdevLayout | null;
}

/**
 * Emits the lock state for the given special/dedup category: the layout the
 * category must match (or null when no lock applies), plus the layout the
 * store currently holds for that category so callers can detect and clear
 * stale selections in a single subscription. Shared by the metadata and
 * dedup wizard steps so both react to the same set of inputs in the same way.
 */
export function lockedParityLayout$(
  pool$: Observable<Pool | null>,
  topology$: Observable<PoolManagerTopology>,
  vdevType: VDevType.Special | VDevType.Dedup,
): Observable<ParityLayoutLockState> {
  return combineLatest([pool$, topology$]).pipe(
    map(([pool, topology]): ParityLayoutLockState => ({
      lockedLayout: resolveParityLockedLayout(
        pool?.topology[vdevType],
        pool?.topology[VDevType.Data],
        topology[VDevType.Data]?.layout,
      ),
      currentLayout: topology[vdevType]?.layout ?? null,
    })),
    distinctUntilChanged((a, b) => (
      a.lockedLayout === b.lockedLayout && a.currentLayout === b.currentLayout
    )),
  );
}

/**
 * Order follows CreateVdevLayout declaration order, which also drives the
 * ordering of options in the layout dropdown. Reordering enum members will
 * change the visible option order.
 */
export const nonDraidLayouts: readonly CreateVdevLayout[] = Object.values(CreateVdevLayout)
  .filter((layout) => !draidCreateLayouts.includes(layout));

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
