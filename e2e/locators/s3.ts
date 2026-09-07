/**
 * S3 bucket and access key locators.
 *
 * See `storage.ts` for the two derivations most of these rest on: a control with
 * no explicit `testId` takes its bound control name (`<tn-checkbox
 * formControlName="object_lock">` is `checkbox-object-lock`), and every segment
 * goes through the library's `kebabTestSegment`.
 *
 * Two things here are not library controls and normalize differently, through
 * lodash `kebabCase` (`legacyKebabTestSegment`) rather than the library's own:
 *
 * - `ix-user-picker` (bucket owner, access key user) is a Material autocomplete
 *   behind webui's legacy `[ixTest]`, so its options are
 *   `option-<control>-<label>` with the label split at letter/digit boundaries.
 * - The access key list's row tag goes through `toUniqueRowTag`, which
 *   pre-normalizes the same way — while the dashboard card's tag does not. Both
 *   ids below were confirmed by mounting the components and reading the
 *   attributes back, because the difference is invisible in the templates.
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
    owner: '[data-test="input-owner"]',
    /** An option of the owner autocomplete, keyed by the username it shows. */
    ownerOption: (username: string) => `[data-test="option-owner-${legacyKebabTestSegment(username)}"]`,
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
  },

  /**
   * "Start" on the "Start S3 Service" dialog the app raises after the first
   * bucket is saved while the service is stopped — the same
   * `start-service-dialog` SMB uses, hence the same id as `smbLocators.startService`.
   */
  startService: '[data-test="button-enable-service"]',

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
    user: '[data-test="input-username"]',
    userOption: (username: string) => `[data-test="option-username-${legacyKebabTestSegment(username)}"]`,
    /**
     * Unchecked by default: a new key asks for an expiry date up front, and the
     * date input below is rendered only while this stays unchecked.
     */
    nonExpiring: '[data-test="checkbox-non-expiring"]',
    /** `<tn-date-input [testId]="'expires-at'">`, prefixed by its element type. */
    expiresAt: '[data-test="date-input-expires-at"]',
    save: '[data-test="button-save"]',
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
} as const;
