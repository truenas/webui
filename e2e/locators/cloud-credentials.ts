/**
 * The Cloud Credentials card on Credentials > Backup Credentials, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `cloud-cred-<name>`, a plain concatenation with no pre-normalizing — so the
 * row, its cells and its action buttons all go through the library's normalizer,
 * and {@link kebabTestSegment} is the one to use throughout.
 *
 * The name is in the tag, so **an edit that renames a credential renames every
 * id on the row**. A spec that renames one looks the row up again under the new
 * name.
 *
 * The card asks for `mode="inline"`, so Edit and Delete are icon buttons on the
 * row rather than items in a kebab menu, and their ids have no `more-action`.
 */
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`cloud-cred-${name}`);
}

export const cloudCredentialLocators = {
  card: {
    /** `<tn-button [testId]="['add-cloud-credential']">` in the card footer. */
    add: '[data-test="button-add-cloud-credential"]',

    /**
     * The card's pager, `<ix-table-pager-show-more [testId]="['cloud-credentials']">`.
     * View All renders only while there are more credentials than the card lists,
     * and Collapse only once it was pressed.
     */
    viewAll: '[data-test="button-cloud-credentials-show-more"]',
    collapse: '[data-test="button-cloud-credentials-show-less"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,

    /** The provider's title as `cloudsync.providers` gives it — `SFTP` — not its type. */
    provider: (name: string): string => `[data-test="text-provider-${rowTag(name)}-row-text"]`,

    /** The row's own Edit button — the row tag, the icon, library and all, then `row-action`. */
    edit: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-pencil-row-action"]`,

    /** The row's own Delete button. Same shape as {@link edit}. */
    delete: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-delete-row-action"]`,
  },

  form: {
    /** `<tn-select formControlName="type" testId="type">`. Storj until something else is picked. */
    provider: '[data-test="select-type"]',
    /** Each option is labelled with the provider's title, so SFTP is `option-type-sftp`. */
    providerOption: (title: string): string => `[data-test="option-type-${kebabTestSegment(title)}"]`,
    /** Overwritten with a default whenever the provider changes, until it is typed in. */
    name: '[data-test="input-name"]',

    /** The SFTP provider's own fields, rendered once SFTP is the provider. */
    sftp: {
      host: '[data-test="input-host"]',
      user: '[data-test="input-user"]',
      privateKey: '[data-test="select-private-key"]',
      /** Labelled with the keypair's name; `Generate New` is the first option. */
      privateKeyOption: (keypairName: string): string => (
        `[data-test="option-private-key-${kebabTestSegment(keypairName)}"]`
      ),
    },

    /** `<tn-button [testId]="'verify-credential'">`, disabled while the form is invalid or busy. */
    verify: '[data-test="button-verify-credential"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
