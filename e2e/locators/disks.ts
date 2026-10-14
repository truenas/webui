/**
 * The Disks page under Storage, its edit form and its wipe dialog.
 *
 * The page is reached from the "Disks" button in the Storage dashboard's header.
 * It is not in the sidebar.
 *
 * Every disk is a row tagged `disk-<name>`, built by `toUniqueRowTag`, which runs
 * lodash's `kebabCase` over it. A name with a letter/digit boundary therefore
 * splits (`nvme0n1` becomes `disk-nvme-0-n-1`), so the tag goes through
 * `legacyKebabTestSegment`. The row's Edit and Wipe buttons are keyed on the name
 * alone, through webui's `normalizeTestIdString`, which is the same lodash call.
 *
 * Only Name, Serial, Disk Size and Pool are columns by default. The rest are
 * hidden, and the expanded row prints each hidden one under the id its cell would
 * carry, `text-<title>-<row tag>-row-text`. So `cell('Description', …)` reads the
 * same value whether a saved column preference shows it in the table or not.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/** The column titles a test reads. Each is the first segment of the cell's id. */
export type DiskColumn
  = | 'Name'
  | 'Serial'
  | 'Disk Size'
  | 'Pool'
  | 'Description'
  | 'HDD Standby'
  | 'Adv. Power Management';

/** `disk-<name>`, as `toUniqueRowTag` writes it. */
function rowTag(disk: string): string {
  return legacyKebabTestSegment(`disk-${disk}`);
}

export const diskListLocators = {
  /**
   * "Disks" in the Storage dashboard's header. Host-pinned to `link-disks`
   * because it navigates.
   */
  entry: '[data-test="link-disks"]',

  /** `ix-basic-search`, which filters on name, pool, serial and size. */
  search: '[data-test="input-search"]',

  row: (disk: string): string => `[data-test="row-${rowTag(disk)}"]`,
  cell: (column: DiskColumn, disk: string): string => (
    `[data-test="text-${kebabTestSegment(column)}-${rowTag(disk)}-row-text"]`
  ),

  /** In the expanded row. `[testId]="[testIdTag(disk), 'edit']"`. */
  edit: (disk: string): string => `[data-test="button-${legacyKebabTestSegment(disk)}-edit"]`,
  /** In the expanded row, and only for a disk in no imported pool. */
  wipe: (disk: string): string => `[data-test="button-${legacyKebabTestSegment(disk)}-wipe"]`,
} as const;

/** HDD Standby, in minutes, or `ALWAYS ON`. Middleware's values, and the select's option keys. */
export type DiskStandby = 'ALWAYS ON' | '5' | '10' | '20' | '30' | '60' | '120' | '180' | '240' | '300' | '330';

/** Advanced Power Management levels as middleware stores them. */
export type DiskPowerLevel = 'DISABLED' | '1' | '64' | '127' | '128' | '192' | '254';

/**
 * What the Advanced Power Management select shows for each level. Its options are
 * keyed on these labels, not on the values: the form pins
 * `advPowerManagementOptionTestId` to keep the ids the legacy select had.
 */
const powerLevelLabels: Record<DiskPowerLevel, string> = {
  DISABLED: 'Disabled',
  1: 'Level 1 - Minimum power usage with Standby (spindown)',
  64: 'Level 64 - Intermediate power usage with Standby',
  127: 'Level 127 - Maximum power usage with Standby',
  128: 'Level 128 - Minimum power usage without Standby (no spindown)',
  192: 'Level 192 - Intermediate power usage without Standby',
  254: 'Level 254 - Maximum performance, maximum power usage',
};

/** The Edit Disk side panel. Every id comes from the control name. */
export const diskFormLocators = {
  /** Read-only. Holding the disk's name is what says the panel loaded that disk. */
  name: '[data-test="input-name"]',
  description: '[data-test="input-description"]',

  hddStandby: '[data-test="select-hddstandby"]',
  /** Keyed on the value, which the select prefers over the label when it is a primitive. */
  hddStandbyOption: (standby: DiskStandby): string => (
    `[data-test="option-hddstandby-${kebabTestSegment(standby)}"]`
  ),
  advPowerManagement: '[data-test="select-advpowermgmt"]',
  advPowerManagementOption: (level: DiskPowerLevel): string => (
    `[data-test="option-advpowermgmt-${kebabTestSegment(powerLevelLabels[level])}"]`
  ),

  save: '[data-test="button-save"]',
} as const;

/**
 * The Wipe Disk dialog, its own confirm, and what follows.
 *
 * Wipe raises webui's shared confirm (see `locators/dialogs.ts`), then a job
 * dialog, then a general dialog saying the disk was wiped. The wipe dialog closes
 * itself when it opens that last one.
 */
export const diskWipeLocators = {
  /** `<tn-dialog-shell testId="disk-wipe">`. */
  title: '[data-test="dialog-title-disk-wipe"]',
  /** Shown only when the disk carries an exported pool. It names the pool. */
  exportedPoolWarning: '[data-test="text-exported-pool-warning"]',
  /**
   * The dialog's own Wipe. Its Method select opens on Quick and is left there:
   * the other two write the whole disk.
   */
  submit: '[data-test="button-wipe"]',
} as const;
