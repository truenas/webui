/**
 * The Cloud Credentials card on Credentials > Backup Credentials, and its form. Row ids come from `uniqueRowTag`,
 * `cloud-cred-<name>`, with no pre-normalizing, so use {@link kebabTestSegment} throughout. The name is in the tag,
 * so renaming a credential renames every id on the row; look it up again under the new name. `mode="inline"`
 * makes Edit and Delete row icon buttons, so their ids have no `more-action`.
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

    /** The S3 provider's own fields, rendered once Amazon S3 is the provider. */
    s3: {
      accessKeyId: '[data-test="input-access-key-id"]',
      secretAccessKey: '[data-test="input-secret-access-key"]',
      /**
       * Endpoint URL is an inline editable under Advanced Options. Its trigger's id is built from
       * the value it shows (`editable.component.ts`), and an empty one shows nothing, so the
       * trigger is reached through the editable's own id, `editable-endpoint-url`. The view inside
       * it is an empty `<div>` until an endpoint is set, which Playwright cannot click.
       */
      endpointTrigger: '[data-test="editable-endpoint-url"] [data-test="button-edit"]',
      /** The input the editable renders once opened. */
      endpoint: '[data-test="input-endpoint"]',
    },

    /** `<tn-button [testId]="'verify-credential'">`, disabled while the form is invalid or busy. */
    verify: '[data-test="button-verify-credential"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
