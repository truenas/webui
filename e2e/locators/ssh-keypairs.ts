/**
 * The SSH Keypairs card on Credentials > Backup Credentials, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `ssh-keypair-<name>`, a plain concatenation with no pre-normalizing — so the
 * row, its Name cell and its action menu all go through the library's
 * normalizer, and {@link kebabTestSegment} is the one to use throughout.
 */
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`ssh-keypair-${name}`);
}

export const sshKeypairLocators = {
  card: {
    /** `<tn-button [testId]="['add-ssh-keypair']">` in the card footer. */
    add: '[data-test="button-add-ssh-keypair"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,

    /**
     * The row's action menu trigger. The row has three actions (Download, Edit,
     * Delete) and the card does not ask for `mode="inline"`, so they sit in a kebab menu.
     */
    rowMenu: (name: string): string => `[data-test="button-${rowTag(name)}-more-action"]`,

    /** Delete, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuDelete: (name: string): string => (
      `[data-test="button-${rowTag(name)}-more-action-mdi-delete-row-action"]`
    ),
  },

  form: {
    name: '[data-test="input-name"]',
    /** `<tn-button [testId]="'generate-keypair'">`, which asks middleware for a fresh pair. */
    generate: '[data-test="button-generate-keypair"]',
    /**
     * Both keys are multiline `tn-input`s, which render a `<textarea>` typed
     * `textarea` — see `locators/api-keys.ts`.
     */
    privateKey: '[data-test="textarea-private-key"]',
    publicKey: '[data-test="textarea-public-key"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
