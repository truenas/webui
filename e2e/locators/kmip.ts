/**
 * The KMIP page under Credentials (`/credentials/kmip`).
 *
 * One card: the key status, the two key actions, and a form whose controls fall
 * back to their `formControlName` or carry the same name as `testId`, so the
 * field ids read like the API's own keys. The status readouts are tagged
 * `tnTestIdType="text"` in the template; each is rendered only while it applies.
 */
import { kebabTestSegment } from './test-id';

export const kmipLocators = {
  status: {
    /** Rendered while `kmip.kmip_sync_pending` is true. */
    pendingSync: '[data-test="text-kmip-pending-sync"]',
    /** Rendered while `kmip.config` has `enabled: false`. */
    disabled: '[data-test="text-kmip-disabled"]',
    /** Rendered while KMIP is enabled and nothing is pending. */
    synced: '[data-test="text-kmip-synced"]',
  },

  /** Both are disabled unless a sync is pending. */
  syncKeys: '[data-test="button-sync-keys"]',
  clearSyncKeys: '[data-test="button-clear-sync-keys"]',

  form: {
    server: '[data-test="input-server"]',
    port: '[data-test="input-port"]',
    /** Every `certificate.query` row by name, with an empty choice. */
    certificate: '[data-test="select-certificate"]',
    certificateOption: (name: string): string => `[data-test="option-certificate-${kebabTestSegment(name)}"]`,
    /** Rendered only with the `SED` entitlement. */
    manageSedDisks: '[data-test="checkbox-manage-sed-disks"]',
    manageZfsKeys: '[data-test="checkbox-manage-zfs-keys"]',
    enabled: '[data-test="checkbox-enabled"]',
    changeServer: '[data-test="checkbox-change-server"]',
    validate: '[data-test="checkbox-validate"]',
    forceClear: '[data-test="checkbox-force-clear"]',
    save: '[data-test="button-save"]',
  },
} as const;
