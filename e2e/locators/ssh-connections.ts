/**
 * The SSH Connections card on Credentials > Backup Credentials, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `ssh-con-<name>`, a plain concatenation with no pre-normalizing, so the row,
 * its Name cell and its actions all go through the library's normalizer — the
 * same shape as `locators/ssh-keypairs.ts`.
 *
 * A `tn-select` option is `option-<base>-<label>`, keyed by the text on screen
 * (see `locators/s3.ts`), so the option locators below take the label.
 */
import { kebabTestSegment } from './test-id';

/** The Setup Method labels, as `ssh-connection-form.component.ts` offers them. */
export const sshConnectionSetupMethodLabels = {
  manual: 'Manual',
  semiAutomatic: 'Semi-automatic (TrueNAS only)',
} as const;

/** The Private Key option a new connection offers ahead of the existing keypairs. */
export const generateNewKeyLabel = 'Generate New';

function rowTag(name: string): string {
  return kebabTestSegment(`ssh-con-${name}`);
}

export const sshConnectionLocators = {
  card: {
    /** `<tn-button [testId]="['add-ssh-connection']">` in the card footer. */
    add: '[data-test="button-add-ssh-connection"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,

    /**
     * The row's own Edit and Delete. The card asks for `mode="inline"`, so they
     * sit on the row rather than in a kebab menu: the row tag, the icon with its
     * library, then `row-action`.
     */
    edit: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-pencil-row-action"]`,
    delete: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-delete-row-action"]`,
  },

  form: {
    name: '[data-test="input-connection-name"]',

    /** Rendered only on a new connection; an edit is always Manual. */
    setupMethod: '[data-test="select-setup-method"]',
    setupMethodOption: (label: string): string => `[data-test="option-setup-method-${kebabTestSegment(label)}"]`,

    /** Manual only. */
    host: '[data-test="input-host"]',
    port: '[data-test="input-port"]',

    /** Semi-automatic only. */
    url: '[data-test="input-url"]',
    adminUsername: '[data-test="input-admin-username"]',
    adminPassword: '[data-test="input-password"]',

    username: '[data-test="input-username"]',

    /** Options are the keypairs' names, after Generate New on a new connection. */
    privateKey: '[data-test="select-private-key"]',
    privateKeyOption: (label: string): string => `[data-test="option-private-key-${kebabTestSegment(label)}"]`,

    /** A multiline `tn-input`, so it renders a `<textarea>` typed `textarea`. Manual only. */
    remoteHostKey: '[data-test="textarea-remote-host-key"]',

    /** Asks middleware to scan the host for its key and fills Remote Host Key with it. Manual only. */
    discoverRemoteHostKey: '[data-test="button-discover-remote-host-key"]',

    connectTimeout: '[data-test="input-connect-timeout"]',

    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
