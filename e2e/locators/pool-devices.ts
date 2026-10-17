/**
 * A pool's VDEVs page and its ZFS Info card.
 *
 * "Add VDEV" opens the creation wizard with the pool's name fixed and every step
 * after General optional, so its controls are `poolWizardLocators` in
 * `locators/storage.ts`.
 *
 * The page is `/storage/<id>/vdevs`, reached from "View VDEVs" on the pool's
 * VDEVs card on the Storage dashboard. It is a tree: one group per kind of vdev
 * (`Data VDEVs`, `Spare`, …), the vdevs under it, and the disks under those.
 *
 * Every vdev and disk is keyed by its ZFS `guid`, not by its name, so a test
 * reads the guid from `pool.query` first. Guids are all digits, which no
 * normalizer changes. A group is keyed by its `VDevType`: `data`, `spare`, ….
 */
import { kebabTestSegment } from './test-id';

export const vdevsPageLocators = {
  /**
   * "View VDEVs" on the pool's VDEVs card, `[testId]="[poolState().name, 'manage-vdevs']"`.
   * Keyed by pool like the pool's other buttons on the dashboard (Disconnect,
   * View Datasets), so a dashboard with several pools has one per pool.
   */
  entry: (pool: string): string => `[data-test="button-${kebabTestSegment(pool)}-manage-vdevs"]`,

  /** "Add VDEV" in the page header. It opens the wizard on this pool. */
  addVdev: '[data-test="button-add-vdev"]',

  /** A group of the tree. Present only when the pool has that kind of vdev. */
  group: (type: 'data' | 'spare'): string => `[data-test="vdev-group-${type}"]`,

  /**
   * A vdev or a disk. Clicking it selects it, which opens its details beside the
   * tree and expands it. A mirror starts collapsed, so this is also how its disks
   * are reached.
   */
  node: (guid: string): string => `[data-test="vdev-${guid}"]`,
  /** The device name, `sdb`, or the vdev's type for a vdev. */
  nodeName: (guid: string): string => `[data-test="text-vdev-${guid}-name"]`,
  /** ZFS's own status, as `pool.query` reports it: `ONLINE`, `OFFLINE`, `AVAIL`, …. */
  nodeStatus: (guid: string): string => `[data-test="text-vdev-${guid}-status"]`,

  /** The name of whatever is selected, above its details. */
  detailsTitle: '[data-test="text-vdev-details-title"]',
} as const;

/**
 * The ZFS Info card for the selected disk.
 *
 * Offline and Online live in the card's header menu, and at most one of them is
 * offered: Offline while the disk is not offline, Online while it is not online.
 * Both raise webui's shared confirm (see `locators/dialogs.ts`) with its tick box.
 */
export const zfsInfoLocators = {
  /** The header menu's trigger, `[headerMenuTriggerTestId]="'button-zfs-actions'"`. */
  menu: '[data-test="button-zfs-actions"]',
  /** Menu items, `button-<testId>`. Pinned by `zfs-info-card.component.spec.ts`. */
  offline: '[data-test="button-offline"]',
  online: '[data-test="button-online"]',
} as const;
