/**
 * A pool's VDEVs page, its ZFS Info and Disk Info cards, and the Replace Disk,
 * Extend and RAIDZ Extend dialogs.
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
 * The ZFS Info card for the selected disk or vdev.
 *
 * Detach, Offline and Online live in the card's header menu. Offline and Online
 * are never both offered: Offline while the disk is not offline, Online while it
 * is not online. Detach is offered on a disk in a mirror. All three raise webui's
 * shared confirm (see `locators/dialogs.ts`) with its tick box.
 */
export const zfsInfoLocators = {
  /**
   * Extend, the card's primary action, `testId: 'extend'` on a `TnCardAction`.
   * On a mirror or on a disk that is a data vdev of its own it opens the Extend
   * dialog, and on a RAIDZ vdev the RAIDZ Extend dialog. Each dialog's own submit
   * emits the same id: see `extendDialogLocators` and `raidzExtendDialogLocators`.
   */
  extend: '[data-test="button-extend"]',
  /** The header menu's trigger, `[headerMenuTriggerTestId]="'button-zfs-actions'"`. */
  menu: '[data-test="button-zfs-actions"]',
  /** Menu items, `button-<testId>`. Pinned by `zfs-info-card.component.spec.ts`. */
  detach: '[data-test="button-detach"]',
  offline: '[data-test="button-offline"]',
  online: '[data-test="button-online"]',
} as const;

/** The Extend dialog (`extend-dialog.component.html`), raised from Extend on the ZFS Info card. */
export const extendDialogLocators = {
  /** `<tn-dialog-shell testId="extend">`. What to wait on. */
  title: '[data-test="dialog-title-extend"]',

  /**
   * "New Disk", an `ix-unused-disk-select` with `testId="new-disk"`, which is a
   * library `tn-autocomplete`: the input is `autocomplete-new-disk` and its rows
   * are `option-new-disk-<label>`. A label is the device name and its size,
   * `sdd (10 GiB)`, so a row is matched on the device name and the size is left
   * to the prefix.
   */
  newDisk: '[data-test="autocomplete-new-disk"]',
  newDiskOption: (devname: string): string => `[data-test^="option-new-disk-${kebabTestSegment(devname)}-"]`,

  /**
   * The dialog's own "Extend". It emits `button-extend` like the card's, which
   * stays on the page behind the dialog, so it is reached through the dialog's
   * action row.
   */
  submit: '[data-test="actions-extend"] [data-test="button-extend"]',
} as const;

/**
 * The RAIDZ Extend dialog (`raidz-extend-dialog.component.html`), raised from
 * Extend on the ZFS Info card of a RAIDZ vdev.
 */
export const raidzExtendDialogLocators = {
  /** `<tn-dialog-shell testId="raidz-extend">`. What to wait on. */
  title: '[data-test="dialog-title-raidz-extend"]',

  /**
   * "New Disk", an `ix-unused-disk-select` with `testId="new-disk"`, which is a
   * library `tn-autocomplete`: the input is `autocomplete-new-disk` and its rows
   * are `option-new-disk-<label>`. A label is the device name and its size,
   * `sdd (10 GiB)`, so a row is matched on the device name and the size is left
   * to the prefix.
   */
  newDisk: '[data-test="autocomplete-new-disk"]',
  newDiskOption: (devname: string): string => `[data-test^="option-new-disk-${kebabTestSegment(devname)}-"]`,

  /**
   * The dialog's own "Extend". It emits `button-extend` like the card's, which
   * stays on the page behind the dialog, so it is reached through the dialog's
   * action row.
   */
  submit: '[data-test="actions-raidz-extend"] [data-test="button-extend"]',
} as const;

/**
 * The Disk Info card for the selected disk, beside the ZFS Info card.
 *
 * Replace is the card's primary action, `testId: 'replace'` on a `TnCardAction`,
 * which the card renders as a `tn-button`. Offered to `POOL_WRITE` whether or not
 * the disk is online.
 */
export const diskInfoLocators = {
  replace: '[data-test="button-replace"]',
} as const;

/** The Replace Disk dialog (`replace-disk-dialog.component.html`), raised from the Disk Info card. */
export const replaceDiskLocators = {
  /** `<tn-dialog-shell testId="replace-disk">`. What to wait on. */
  title: '[data-test="dialog-title-replace-disk"]',

  /**
   * "Member Disk", an `ix-unused-disk-select` with `testId="replacement"`, which
   * is a library `tn-autocomplete`: the input is `autocomplete-replacement` and its
   * rows are `option-replacement-<label>`. A label is the device name and its size,
   * `sdd (10 GiB)`, so a row is matched on the device name and the size is left to
   * the prefix.
   */
  replacement: '[data-test="autocomplete-replacement"]',
  replacementOption: (devname: string): string => (
    `[data-test^="option-replacement-${kebabTestSegment(devname)}-"]`
  ),

  /** Both ticked when the dialog opens. */
  preserveSettings: '[data-test="checkbox-preserve-settings"]',
  preserveDescription: '[data-test="checkbox-preserve-description"]',
  /** Unticked when the dialog opens. */
  force: '[data-test="checkbox-force"]',

  /**
   * The dialog's own "Replace Disk". It emits `button-replace` like the card's,
   * which stays on the page behind the dialog, so it is reached through the
   * dialog's action row.
   */
  submit: '[data-test="actions-replace-disk"] [data-test="button-replace"]',
} as const;
