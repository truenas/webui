/**
 * Dataset encryption: the Encryption Options of the dataset form, the Encryption card on the
 * details panel, the Edit Encryption Options and Lock dialogs it opens, and the Unlock page with the
 * summary dialogs after it.
 */
import { kebabTestSegment } from './test-id';

/**
 * Encryption Options on the Add Dataset form. Rendered only in advanced mode, and only when adding.
 * Every id here comes from the control-name fallback.
 */
export const encryptionFormLocators = {
  /** "Inherit (non-encrypted)", ticked by default. Clearing it reveals the rest. */
  inherit: '[data-test="checkbox-inherit-encryption"]',
  /** "Encryption". Ticked by default, so clearing Inherit alone already asks for an encrypted dataset. */
  encryption: '[data-test="checkbox-encryption"]',
  /** "Encryption Type", `Key` or `Passphrase`. Not rendered under a parent that has a passphrase. */
  type: '[data-test="select-encryption-type"]',
  typeOption: (label: string) => `[data-test="option-encryption-type-${kebabTestSegment(label)}"]`,
  /** Rendered only while the type is Passphrase. */
  passphrase: '[data-test="input-passphrase"]',
  confirmPassphrase: '[data-test="input-confirm-passphrase"]',
} as const;

/**
 * The Encryption card, for whichever dataset the tree has selected. The details panel renders it
 * only for an encrypted dataset.
 */
export const encryptionCardLocators = {
  /** `Unencrypted`, `Locked`, `Locked by parent` or `Unlocked`. */
  state: '[data-test="text-encryption-current-state"]',
  /** `Passphrase` or `Key`. */
  type: '[data-test="text-encryption-type"]',
  /** "Inherits Encryption From", a link reading `/<encryption root>`. Rendered only off a root. */
  encryptionRoot: '[data-test="link-go-to-encryption-root"]',
  /**
   * `<tn-button [testId]="'lock'">`. Offered on an unlocked encryption root, and disabled unless it
   * has a passphrase.
   */
  lock: '[data-test="button-lock"]',
  /** `<tn-button [testId]="'unlock'">`, a link to the Unlock page. Offered on a locked encryption root. */
  unlock: '[data-test="button-unlock"]',
  /**
   * `<tn-button [testId]="'edit'">`, which opens Edit Encryption Options. Offered on any unlocked
   * encrypted dataset. Its id is a generic `button-edit`, so it is reached through the card.
   */
  edit: '[data-test="card-encryption"] [data-test="button-edit"]',
} as const;

/**
 * The Edit Encryption Options dialog, `<tn-dialog-shell testId="encryption-options">`. Its controls
 * share their ids with the dataset form's Encryption Options, which is never on screen with it.
 */
export const encryptionOptionsLocators = {
  title: '[data-test="dialog-title-encryption-options"]',
  /** "Inherit encryption properties from parent". Offered only when the parent is encrypted. */
  inherit: '[data-test="checkbox-inherit-encryption"]',
  /** Disabled under a passphrase parent, or above a child that is a key-encrypted root. */
  type: '[data-test="select-encryption-type"]',
  typeOption: encryptionFormLocators.typeOption,
  /** Rendered only while the type is Key. */
  generateKey: '[data-test="checkbox-generate-key"]',
  /** Rendered only while the type is Passphrase. */
  passphrase: '[data-test="input-passphrase"]',
  confirmPassphrase: '[data-test="input-confirm-passphrase"]',
  /** Save stays disabled until this is ticked. */
  confirm: '[data-test="checkbox-confirm"]',
  save: '[data-test="actions-encryption-options"] [data-test="button-save"]',
} as const;

/** The Lock Dataset dialog, `<tn-dialog-shell testId="lock-dataset">`. */
export const lockDialogLocators = {
  title: '[data-test="dialog-title-lock-dataset"]',
  /**
   * The dialog's own Lock. It emits `button-lock` like the card's, which stays on the page behind
   * the dialog, so it is reached through the dialog's action row.
   */
  submit: '[data-test="actions-lock-dataset"] [data-test="button-lock"]',
} as const;

/**
 * The Unlock page at `/datasets/<id>/unlock`. It opens on an encryption summary job and lists the
 * dataset only once that has finished.
 */
export const unlockLocators = {
  /**
   * The passphrase of the one dataset on the page. The form lists one entry per locked dataset under
   * the one being unlocked, and every entry's input is `input-passphrase`.
   */
  passphrase: '[data-test="input-passphrase"]',
  /** The page's own Unlock. It checks the passphrase first and opens the summary dialog. */
  submit: '[data-test="button-unlock"]',
} as const;

/**
 * The dialog that follows Unlock, `<tn-dialog-shell testId="unlock-summary">`. It opens twice: once
 * to say what can be unlocked, with Continue, and once to say what was, with only Close.
 */
export const unlockSummaryLocators = {
  title: '[data-test="dialog-title-unlock-summary"]',
  /** A dataset in the summary's unlocked list, by its full name. */
  unlocked: (dataset: string) => `[data-test="text-unlock-summary-unlocked-${kebabTestSegment(dataset)}"]`,
  continue: '[data-test="button-continue"]',
  close: '[data-test="button-close"]',
} as const;

/**
 * webui's job progress dialog. Its minimize button also emits `button-close`, so a flow waits for
 * this title to go before it presses the summary's Close.
 */
export const jobDialogLocators = {
  title: '[data-test="dialog-title-job-progress"]',
} as const;
