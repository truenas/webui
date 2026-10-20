/**
 * The Virtual Machines page, the Create Virtual Machine wizard, the Edit VM form, the delete, clone
 * and stop dialogs, and a VM's Devices page with its device form and delete dialog.
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
 * What tells one row of a VM's Devices list from another: `vm-device-<dtype>-<order>`, through
 * lodash like the VM rows, so a NIC at order 1002 is `vm-device-nic-1002`.
 */
const deviceRowTag = (dtype: string, order: number): string => legacyKebabTestSegment(`vm-device-${dtype}-${order}`);

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
    /**
     * The checkbox inside the Running switch, which is checked while the VM runs.
     * `ix-table-toggle-cell` composes `['Running', row tag, 'row-toggle']`, and `tn-slide-toggle` puts
     * its `toggle-` type in front. Never clicked here; the detail panel's buttons are what a test drives.
     */
    running: (name: string): string => (
      `[data-test="toggle-running-${kebabTestSegment(rowTag(name))}-row-toggle"] input[type="checkbox"]`
    ),
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
    clone: (id: number): string => `[data-test="button-clone-${id}"]`,
    /** Opens the VM's Devices page, `/vm/<id>/devices`. */
    devices: (id: number): string => `[data-test="button-devices-${id}"]`,

    /** Shown only while the VM is stopped. */
    start: (id: number): string => `[data-test="button-start-${id}"]`,
    /** Shown only while the VM runs, like the three below. Opens the Stop dialog. */
    stop: (id: number): string => `[data-test="button-stop-${id}"]`,
    /** Runs the `vm.restart` job with no dialog. */
    restart: (id: number): string => `[data-test="button-restart-${id}"]`,
    /** A hard reset, which asks for confirmation first. */
    reset: (id: number): string => `[data-test="button-reset-${id}"]`,
    /** `['power_off', id]`; the library normalizer turns the underscore into a dash. No dialog. */
    powerOff: (id: number): string => `[data-test="button-power-off-${id}"]`,
    /**
     * `['open_display', id]`. Shown only while the VM runs and `vm.query` says `display_available`.
     * Opens the SPICE web client in a new tab, or a dialog saying how to connect.
     */
    display: (id: number): string => `[data-test="button-open-display-${id}"]`,
  },

  /** `<tn-dialog-shell testId="stop-vm">`, raised by the row's Stop. */
  stopDialog: {
    title: '[data-test="dialog-title-stop-vm"]',
    /** "Force Stop After Timeout". Unticked by default. */
    forceAfterTimeout: '[data-test="checkbox-force-after-timeout"]',
    stop: '[data-test="button-stop-vm"]',
  },

  /** A VM's Devices page (`ix-device-list`). */
  devices: {
    /** `<tn-button [testId]="'add-device'">` in the page header. Opens the device form. */
    add: '[data-test="button-add-device"]',
    /** Every row of the list, whatever its type and order. */
    rows: '[data-test^="row-vm-device-"]',
    /** The `<tr>`, from `[rowTestId]`. */
    row: (dtype: string, order: number): string => `[data-test="row-${deviceRowTag(dtype, order)}"]`,
    /** Every row of one device type, whatever its order. */
    rowsOfType: (dtype: string): string => `[data-test^="row-${legacyKebabTestSegment('vm-device-' + dtype)}-"]`,
    /** The row's actions menu trigger. Every row has one with this same id, so reach it through the row. */
    actions: '[data-test="button-device-actions"]',
    /** The menu items, `[testId]="[device.id, 'edit']"` and so on, keyed by the device's id. */
    edit: (id: number): string => `[data-test="button-${id}-edit"]`,
    delete: (id: number): string => `[data-test="button-${id}-delete"]`,
  },

  /** The Add Device and Edit Device form in the side panel (`ix-device-form`). */
  deviceForm: {
    /** Only on Add. An explicit `[testId]`, because it binds a standalone `[formControl]`. */
    deviceType: '[data-test="select-device-type"]',
    deviceTypeOption: (label: string): string => `[data-test="option-device-type-${kebabTestSegment(label)}"]`,
    /** The NIC's Adapter Type, which falls back to its `formControlName`, `type`. */
    nicType: '[data-test="select-type"]',
    /** Options are labelled `Intel e82585 (e1000)` and `VirtIO`. */
    nicTypeOption: (label: string): string => `[data-test="option-type-${kebabTestSegment(label)}"]`,
    mac: '[data-test="input-mac"]',
    generateMac: '[data-test="button-generate"]',
    nicAttach: '[data-test="select-nic-attach"]',
    /** The appliance's own interfaces, so a prefix that matches only this select's options. */
    nicAttachOptions: '[data-test^="option-nic-attach-"]',

    /**
     * A display's Display Type. Its control is named `type` like the NIC's Adapter Type, and only
     * one of the two renders at a time. Only on Add, and it offers only the types the VM lacks.
     */
    displayType: '[data-test="select-type"]',
    /** Options are labelled `SPICE` and `VNC`. */
    displayTypeOption: (label: 'SPICE' | 'VNC'): string => `[data-test="option-type-${kebabTestSegment(label)}"]`,
    /** Whichever of those two the open Display Type select offers. */
    displayTypeOptions: '[data-test^="option-type-"]',
    /** Options come from `vm.device.bind_choices`, labelled with the address itself. */
    bind: '[data-test="select-bind"]',
    bindOption: (address: string): string => `[data-test="option-bind-${kebabTestSegment(address)}"]`,
    /** An explicit `[testId]`, which also names the visibility toggle beside it. */
    password: '[data-test="input-password"]',
    /** Options come from `vm.resolution_choices`, labelled like `1280x720`. */
    resolution: '[data-test="select-resolution"]',
    resolutionOption: (label: string): string => `[data-test="option-resolution-${kebabTestSegment(label)}"]`,

    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
    closePanel: '[data-test="button-close-side-panel"]',
  },

  /** `<tn-dialog-shell testId="device-delete">`. */
  deleteDeviceDialog: {
    title: '[data-test="dialog-title-device-delete"]',
    /** "Delete zvol device". Only a disk offers it. */
    zvol: '[data-test="checkbox-zvol"]',
    /** Appears once Delete zvol device is ticked. Wants the zvol's last path segment, not its full name. */
    zvolConfirm: '[data-test="input-zvol-confirm"]',
    delete: '[data-test="button-delete-device"]',
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
    /**
     * The display's password, at most 8 characters. An explicit `[testId]="'vnc_password'"`. Its
     * Bind beside it defaults to `0.0.0.0`, which is what every journey here keeps.
     */
    vncPassword: '[data-test="input-vnc-password"]',

    /** Step 2, CPU And Memory. A size input, which reads `1 GiB`. */
    memory: '[data-test="input-memory"]',

    /** Step 3, Disks. "Create new disk image" is selected by default. */
    datastore: '[data-test="select-datastore"]',
    /** Options come from `pool.filesystem_choices`, labelled with the full dataset name. */
    datastoreOption: (dataset: string): string => `[data-test="option-datastore-${kebabTestSegment(dataset)}"]`,
    volsize: '[data-test="input-volsize"]',
    /** "Use existing disk image", from `[testId]="['newOrExisting', option.value]"`. */
    existingDisk: '[data-test="radio-button-new-or-existing-existing"]',
    /** "Select Existing Zvol". Shown in place of Zvol Location and Size once Existing is picked. */
    hddPath: '[data-test="select-hdd-path"]',
    /**
     * Options come from `vm.device.disk_choices`, which keys each zvol by its `/dev/zvol/…` path
     * and labels it with its full name (`pool/…/zvol`), so the id is built from the name.
     */
    hddPathOption: (zvol: string): string => `[data-test="option-hdd-path-${kebabTestSegment(zvol)}"]`,

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

  /** `<tn-dialog-shell testId="clone-vm">`, raised by Clone in a row's detail panel. */
  cloneDialog: {
    title: '[data-test="dialog-title-clone-vm"]',
    /** "Enter a Name (optional)". Left empty, middleware names the clone itself. */
    name: '[data-test="input-name"]',
    /** The dialog's own Clone. The row's is keyed by VM id, so the two never share an id. */
    clone: '[data-test="button-clone"]',
  },
} as const;
