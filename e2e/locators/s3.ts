/**
 * S3 bucket and access key locators.
 *
 * See `storage.ts` for the two derivations most of these rest on: a control with
 * no explicit `testId` takes its bound control name (`<tn-checkbox
 * formControlName="object_lock">` is `checkbox-object-lock`), and every segment
 * goes through the library's `kebabTestSegment`.
 *
 * A `tn-select` option is `option-<base>-<label>` — keyed by the text on
 * screen, not the value behind it, unless the select declares an
 * `optionTestIdKey` (none of these do). So `S3Access.ReadOnly`, whose value is
 * `READONLY`, is reached as `option-access-read-only` from its label "Read
 * Only". The option locators below therefore take the label.
 *
 * Two things here normalize through lodash `kebabCase` (`legacyKebabTestSegment`)
 * rather than the library's own:
 *
 * - The grants list's principal picker is still `ix-combobox`, a Material
 *   autocomplete behind webui's legacy `[ixTest]`, so its options are
 *   `option-xid-<label>` with the label split at letter/digit boundaries.
 * - The access key list's row tag goes through `toUniqueRowTag`, which
 *   pre-normalizes the same way — while the dashboard card's tag does not. Both
 *   ids below were confirmed by mounting the components and reading the
 *   attributes back, because the difference is invisible in the templates.
 *
 * The bucket owner and access key user fields are `ix-user-combobox`, which
 * renders a library `tn-autocomplete`: the input is `autocomplete-<control>`
 * and its rows `option-<control>-<label>` through the library normalizer, plus
 * an `option-<control>-add-new` create row. (Until webui#13982 these were an
 * `ix-user-picker` emitting `input-<control>` through the legacy path.)
 *
 * `ix-explorer` (parent dataset) renders a `tn-file-picker`, whose typable
 * inner `<input>` takes the control name — the same shape as the SMB path.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

export const s3BucketLocators = {
  /**
   * "Add" in the Object Storage (S3) Buckets card on the Shares dashboard —
   * `testId="s3-bucket-add"` in `s3-card.component.html`. The standalone list
   * at `/sharing/s3` has its own `add-s3-bucket`; the sidebar lands on the
   * dashboard, so the card's button is the one a user clicks.
   */
  addFromDashboard: '[data-test="button-s3-bucket-add"]',

  form: {
    name: '[data-test="input-name"]',
    /** Typable; a dataset name such as `tank/parent`, not a `/mnt` path. */
    parentDataset: '[data-test="input-parent-dataset"]',
    owner: '[data-test="autocomplete-owner"]',
    /** A row of the owner autocomplete, keyed by the username it shows. */
    ownerOption: (username: string) => `[data-test="option-owner-${kebabTestSegment(username)}"]`,
    objectLock: '[data-test="checkbox-object-lock"]',
    /**
     * Rendered only while object lock is checked, so it doubles as a readback
     * that the box went the intended way. Defaults to Compliance.
     */
    defaultRetentionMode: '[data-test="select-object-lock-default-mode"]',
    /** Rendered only while a default retention mode is selected. */
    defaultRetentionDays: '[data-test="input-object-lock-default-days"]',
    /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
    save: '[data-test="button-save"]',
    /** The Advanced/Basic toggle the side panel renders from the form's `footerActions`. */
    advancedOptions: '[data-test="button-toggle-advanced-options"]',

    /** Advanced-mode selects, all by label (`s3.enum.ts`): "S3" or "Multiprotocol". */
    permissionsModel: '[data-test="select-permissions-model"]',
    permissionsModelOption: (label: string) => (
      `[data-test="option-permissions-model-${kebabTestSegment(label)}"]`
    ),
    /**
     * Shows the chosen ownership as text; a Multiprotocol bucket folds it to
     * "Object Writer" and disables the select (`syncObjectOwnership`).
     */
    objectOwnership: '[data-test="select-object-ownership"]',
    /** "Off", "Enabled" or "Suspended". */
    versioning: '[data-test="select-versioning"]',
    versioningOption: (label: string) => `[data-test="option-versioning-${kebabTestSegment(label)}"]`,
    /**
     * `tn-chip-input testId="snapshot-versions"`: the typable field is
     * `chip-input-<testId>`; Enter commits the typed text as a chip
     * (`allowCustomValue`). Rendered only while versioning is not Off.
     */
    snapshotVersions: '[data-test="chip-input-snapshot-versions"]',
    snapshotVersionsMax: '[data-test="input-snapshot-versions-max"]',
    /** "Composite (S3 standard)" or "Minted (opaque token)". */
    multipartEtag: '[data-test="select-multipart-etag"]',
    multipartEtagOption: (label: string) => `[data-test="option-multipart-etag-${kebabTestSegment(label)}"]`,

    /**
     * The Grants list, rendered only in advanced mode. `tn-form-list` names its
     * Add control `['add-item', label]`; each row's controls fall back to their
     * control names, so with more than one row a selector matches every row —
     * flows scope to the row they just added with `.last()`.
     */
    grants: {
      add: '[data-test="button-add-item-grants"]',
      principalType: '[data-test="select-principal-type"]',
      /** By label: "User", "Group" or "Everyone". */
      principalTypeOption: (label: string) => (
        `[data-test="option-principal-type-${kebabTestSegment(label)}"]`
      ),
      /** `tn-autocomplete` with `testId="xid"`, like the owner picker; options are keyed by label. */
      principal: '[data-test="autocomplete-xid"]',
      principalOption: (label: string) => `[data-test="option-xid-${kebabTestSegment(label)}"]`,
      access: '[data-test="select-access"]',
      /** By label: "Read Only", "Write Only", "Read / Write" or "Deny" (`s3AccessLabels`). */
      accessOption: (label: string) => `[data-test="option-access-${kebabTestSegment(label)}"]`,
    },
  },

  /**
   * Per-row controls in the dashboard card, all keyed on the card's row tag
   * (`convertStringToId('card-s3-bucket-' + name)`, no digit splitting).
   *
   * The toggle cell composes `[title, tag, 'row-toggle']`; the actions cell
   * names its menu trigger `[tag, 'more-action']` and each item
   * `[tag, 'more-action', iconName, 'row-action']`, where `iconName` is the
   * `tnIconMarker` output — `mdi-pencil`, not `pencil`.
   */
  dashboardRow: {
    enabledToggle: (bucket: string) => (
      `[data-test="toggle-enabled-card-s3-bucket-${kebabTestSegment(bucket)}-row-toggle"]`
    ),
    menu: (bucket: string) => `[data-test="button-card-s3-bucket-${kebabTestSegment(bucket)}-more-action"]`,
    edit: (bucket: string) => (
      `[data-test="button-card-s3-bucket-${kebabTestSegment(bucket)}-more-action-mdi-pencil-row-action"]`
    ),
    delete: (bucket: string) => (
      `[data-test="button-card-s3-bucket-${kebabTestSegment(bucket)}-more-action-mdi-delete-row-action"]`
    ),
  },

  /**
   * "Start" on the "Start S3 Service" dialog the app raises after the first
   * bucket is saved while the service is stopped — the same
   * `start-service-dialog` SMB uses, hence the same id as `smbLocators.startService`.
   */
  startService: '[data-test="button-enable-service"]',
  /** Its sibling "No", `testId="do-not-start"` in the same dialog. */
  doNotStartService: '[data-test="button-do-not-start"]',

  /**
   * The Name cell of a bucket's row in the dashboard card.
   *
   * `[tnTestId]="['Name', uniqueRowTag(row), 'row-text']"` with
   * `tnTestIdType="text"`, where the card's `uniqueRowTag` is
   * `convertStringToId('card-s3-bucket-' + name)` — no legacy pre-normalization,
   * so `e2e-s3-bucket` stays as typed. (The standalone bucket list uses
   * `toUniqueRowTag` and would split the digits; this locator is for the card.)
   */
  dashboardRowName: (bucket: string) => (
    `[data-test="text-name-card-s3-bucket-${kebabTestSegment(bucket)}-row-text"]`
  ),
} as const;

export const s3AccessKeyLocators = {
  /** `[testId]="'add-s3-access-key'"` in s3-access-key-list.component.html. */
  add: '[data-test="button-add-s3-access-key"]',

  form: {
    name: '[data-test="input-name"]',
    user: '[data-test="autocomplete-username"]',
    userOption: (username: string) => `[data-test="option-username-${kebabTestSegment(username)}"]`,
    /**
     * Unchecked by default: a new key asks for an expiry date up front, and the
     * date input below is rendered only while this stays unchecked.
     */
    nonExpiring: '[data-test="checkbox-non-expiring"]',
    /** `<tn-date-input [testId]="'expires-at'">`, prefixed by its element type. */
    expiresAt: '[data-test="date-input-expires-at"]',
    /**
     * The three typable segments inside it — month, day, year — each its own
     * `<input>`. The library gives them classes, not ids, so they are reached
     * by class within the dated control's own id.
     */
    expiresAtMonth: '[data-test="date-input-expires-at"] input.tn-date-segment-month',
    expiresAtDay: '[data-test="date-input-expires-at"] input.tn-date-segment-day',
    expiresAtYear: '[data-test="date-input-expires-at"] input.tn-date-segment-year',
    /** Off by default; middleware refuses it for an account without SHARING_S3_WRITE. */
    manageBuckets: '[data-test="checkbox-manage-buckets"]',
    save: '[data-test="button-save"]',
    closePanel: '[data-test="button-close-side-panel"]',
  },

  /**
   * The credentials dialog shown once, right after a key is created. Its
   * inputs are read-only `tn-input`s with explicit ids.
   */
  credentialsDialog: {
    accessKeyId: '[data-test="input-access-key-id"]',
    secretAccessKey: '[data-test="input-secret-access-key"]',
    close: '[data-test="button-close"]',
  },

  /**
   * Name cell of a key's row. `uniqueRowTag` is `toUniqueRowTag('s3-access-key-'
   * + name)`, which lodash-kebabs the whole tag: `s-3-access-key-e-2-e-s-3-key`.
   */
  rowName: (name: string) => {
    const rowTag = legacyKebabTestSegment(`s3-access-key-${name}`);
    return `[data-test="text-name-${rowTag}-row-text"]`;
  },
  /** The "Expires On" cell of a key's row: a relative date, or "Never". */
  rowExpiry: (name: string) => {
    const rowTag = legacyKebabTestSegment(`s3-access-key-${name}`);
    return `[data-test="text-expires-on-${rowTag}-row-text"]`;
  },

  /** The row's action menu and its items — same composition as the bucket card, on the legacy tag. */
  row: {
    menu: (name: string) => {
      const rowTag = legacyKebabTestSegment(`s3-access-key-${name}`);
      return `[data-test="button-${rowTag}-more-action"]`;
    },
    rotate: (name: string) => {
      const rowTag = legacyKebabTestSegment(`s3-access-key-${name}`);
      return `[data-test="button-${rowTag}-more-action-mdi-refresh-row-action"]`;
    },
    delete: (name: string) => {
      const rowTag = legacyKebabTestSegment(`s3-access-key-${name}`);
      return `[data-test="button-${rowTag}-more-action-mdi-delete-row-action"]`;
    },
  },
} as const;

/**
 * The S3 service configuration form, reached from the dashboard card's header
 * menu. The form itself is `service-s3.component.html`, hosted in the side
 * panel like the bucket form.
 */
export const s3ServiceLocators = {
  /**
   * The card header's menu trigger, `button-<service.id>-actions-menu` from
   * `ServiceActionsMenuService.cardHeaderMenuTriggerTestId` — keyed on the
   * service's numeric id, which the test reads over the API.
   */
  cardMenuTrigger: (serviceId: number) => `[data-test="button-${serviceId}-actions-menu"]`,
  /**
   * "Config Service" in that menu. `menuItemTestId` runs `['button', 's3',
   * 'actions-menu', 'Config Service']` through the legacy normalizer, which
   * splits the digit: `s-3`. The service was `truenas_s3` until middleware
   * #19674; the fixture's `s3ServiceName` is the one place the name lives.
   */
  configService: `[data-test="button-${legacyKebabTestSegment('s3')}-actions-menu-config-service"]`,
  /**
   * The card header's on/off switch: `tn-slide-toggle` with
   * `serviceControlTestId`, which runs `service-<service.service>` through the
   * legacy normalizer — so `toggle-service-s-3`, the digit split like the
   * menu item's. Flipping it calls `service.control` straight away; no dialog.
   */
  cardServiceToggle: `[data-test="toggle-service-${legacyKebabTestSegment('s3')}"]`,

  form: {
    /** `tn-form-list` names its Add control `['add-item', label]`; the label is "Listen Addresses". */
    addListener: '[data-test="button-add-item-listen-addresses"]',
    listenerAddress: '[data-test="select-address"]',
    /**
     * Options are `s3.bindip_choices` with the address as both value and label,
     * so the label rule and the value coincide; `0.0.0.0` normalizes to `0-0-0-0`.
     */
    listenerAddressOption: (address: string) => (
      `[data-test="option-address-${kebabTestSegment(address)}"]`
    ),
    listenerPort: '[data-test="input-port"]',
    listenerTls: '[data-test="checkbox-tls"]',
    servers: '[data-test="input-servers"]',
    region: '[data-test="input-region"]',
    logLevel: '[data-test="select-log-level"]',
    /** By label: "Error", "Warning", "Notice", "Info" or "Debug" (`s3LogLevelLabels`). */
    logLevelOption: (label: string) => `[data-test="option-log-level-${kebabTestSegment(label)}"]`,
    /** `ix-explorer` over dataset names, typable like the bucket form's parent dataset. */
    managedRootDataset: '[data-test="input-managed-root-dataset"]',
    save: '[data-test="button-save"]',
  },
} as const;
