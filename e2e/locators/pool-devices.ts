/**
 * A pool's VDEVs page, its ZFS Info card, and the wizard that adds devices to a
 * pool.
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

/**
 * The pool wizard opened from "Add VDEV". It is the creation wizard with the
 * pool's name fixed, and every step after General is optional.
 *
 * Only the steps this suite crosses are here. Each step's controls are keyed by
 * its vdev type, so the Spare step's are the Data step's (`locators/storage.ts`)
 * with `spare` in place of `data`.
 */
export const addVdevsLocators = {
  nextGeneral: '[data-test="button-next-general"]',
  nextData: '[data-test="button-next-data"]',
  nextLog: '[data-test="button-next-log"]',

  /**
   * Spare has no layout control: a spare is always a single disk. It has no
   * vdev count either, which is fixed at one.
   */
  spareDiskSize: '[data-test="select-size-and-type-spare"]',
  /** A prefix match, for the reason given on `poolWizardLocators.diskSizeOptions`. */
  spareDiskSizeOptions: '[data-test^="option-size-and-type-spare-"]',
  spareWidth: '[data-test="select-width-spare"]',
  spareWidthOption: (disks: number): string => `[data-test="option-width-spare-${kebabTestSegment(disks)}"]`,
  spareSaveAndReview: '[data-test="button-save-and-go-to-review-spare"]',

  /** The Review step's summary of the spares being added. */
  reviewSpare: '[data-test="text-review-spare"]',
  /** "Update Pool". The same button the creation wizard labels "Create Pool". */
  updatePool: '[data-test="button-create-pool"]',
} as const;
