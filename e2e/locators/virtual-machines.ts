/**
 * The Virtual Machines page, the Create Virtual Machine wizard, the Edit VM form and the delete
 * dialog.
 *
 * Derived from the templates rather than read off a running appliance; see `signin.ts` for the
 * type-prefixing that produces these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * What tells one row of the list from another: `virtual-machine-<name>`.
 *
 * `memoizedRowTag` runs the whole tag through lodash, so a name with a letter/digit boundary is
 * split there (`e2e` becomes `e-2-e`). The row and its cells all start from this same tag.
 */
const rowTag = (name: string): string => legacyKebabTestSegment(`virtual-machine-${name}`);

/**
 * Every step of the wizard ends in the same two buttons, `[testId]="'next'"` and
 * `[testId]="'back'"`, so six of each are in the panel at once. A step's own field is what tells
 * them apart; see `goToNextWizardStep`.
 */
const wizardNext = '[data-test="button-next"]';

export const virtualMachinesLocators = {
  /** `<tn-button [testId]="'add-vm'">` in the page header. Opens the wizard. */
  add: '[data-test="button-add-vm"]',

  row: {
    /** The `<tr>`, from `[rowTestId]`. */
    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,
    /**
     * The Name cell. Clicking it expands the row, as clicking anywhere in the row would, and it is
     * clicked rather than the row itself because the row also holds the Running toggle.
     */
    name: (name: string): string => `[data-test="text-name-${kebabTestSegment(rowTag(name))}-row-text"]`,
  },

  /**
   * The actions in a row's detail panel, revealed by expanding the row.
   *
   * `<tn-button [testId]="['edit', vm().id]">` and friends, so these are keyed by the VM's id rather
   * than its name.
   */
  rowAction: {
    edit: (id: number): string => `[data-test="button-edit-${id}"]`,
    delete: (id: number): string => `[data-test="button-delete-${id}"]`,
  },

  wizard: {
    next: wizardNext,

    /** Step 1, Operating System. Every control here falls back to its `formControlName`. */
    os: '[data-test="select-os"]',
    osOption: (label: string): string => `[data-test="option-os-${kebabTestSegment(label)}"]`,
    name: '[data-test="input-name"]',
    description: '[data-test="input-description"]',
    /** "Start on Boot". Ticked by default. */
    autostart: '[data-test="checkbox-autostart"]',
    /** "Enable Display (VNC)". Ticked by default, and asks for a password while it is. */
    enableVnc: '[data-test="checkbox-enable-vnc"]',

    /** Step 2, CPU And Memory. A size input, which reads `1 GiB`. */
    memory: '[data-test="input-memory"]',

    /** Step 3, Disks. "Create new disk image" is selected by default. */
    datastore: '[data-test="select-datastore"]',
    /** Options come from `pool.filesystem_choices`, labelled with the full dataset name. */
    datastoreOption: (dataset: string): string => `[data-test="option-datastore-${kebabTestSegment(dataset)}"]`,
    volsize: '[data-test="input-volsize"]',

    /** Step 4, Network Interface. */
    nicAttach: '[data-test="select-nic-attach"]',
    /**
     * Its options are the appliance's own interfaces, which differ per appliance, so this is a
     * prefix that matches only this select's options.
     */
    nicAttachOptions: '[data-test^="option-nic-attach-"]',

    /** Step 5, Installation Media. Nothing on it is required. */
    uploadImage: '[data-test="button-upload-image-file"]',

    /** Step 6, GPU. Nothing on it is required either. */
    hideFromMsr: '[data-test="checkbox-hide-from-msr"]',

    /** Step 7, Confirm Options. */
    save: '[data-test="button-save"]',
  },

  /** The Edit VM form in the side panel. Every control falls back to its `formControlName`. */
  editForm: {
    name: '[data-test="input-name"]',
    description: '[data-test="input-description"]',
    shutdownTimeout: '[data-test="input-shutdown-timeout"]',
    /** A size input, like the wizard's. */
    memory: '[data-test="input-memory"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  /** `<tn-dialog-shell testId="delete-vm">`. */
  deleteDialog: {
    title: '[data-test="dialog-title-delete-vm"]',
    /** The VM's name has to be typed here before Delete enables. */
    confirmName: '[data-test="input-confirm-name"]',
    delete: '[data-test="button-delete"]',
  },
} as const;
