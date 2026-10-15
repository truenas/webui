/**
 * The TrueCloud Backup Tasks card on Data Protection, its full list page, and
 * its add form.
 *
 * Only what an appliance without a Storj account shows: the empty states, the
 * way from the card to the list, and the form's required fields. A row needs a
 * task, and a task needs Storj — see `fixtures/cloud-backup.ts`.
 */
export const cloudBackupLocators = {
  card: {
    /** The card title, `tnTestIdType="link"` with `['cloud-backup-task', 'open']`. Opens the full list. */
    open: '[data-test="link-cloud-backup-task-open"]',
    /** `<tn-empty>`, rendered in place of the table once the card has loaded and found no task. */
    empty: '[data-test="text-cloud-backup-task-empty"]',
    /** `<tn-button [testId]="addTestId">` in the card footer, `cloud-backup-add`. Opens the form. */
    add: '[data-test="button-cloud-backup-add"]',
  },

  list: {
    /** `<tn-empty>` on the full list page, rendered in place of the table when there is no task. */
    empty: '[data-test="text-cloud-backup-list-empty"]',
    /** The page header's Add, `add-task`. */
    add: '[data-test="button-add-task"]',
  },

  form: {
    /**
     * A link in the banner that heads the form only while adding — on edit the
     * account already exists. What says the panel opened as Add.
     */
    createStorjAccount: '[data-test="link-create-storj-account"]',

    /** Name. The control is `description`, which is what the card lists a task by. */
    description: '[data-test="input-description"]',
    /** The field around {@link description}: its label and, once refused, the reason. */
    descriptionField: '[data-test="form-field-description"]',

    /** Keep Last, the number of snapshots to keep. */
    keepLast: '[data-test="input-keep-last"]',
    keepLastField: '[data-test="form-field-keep-last"]',

    /** The repository password. */
    password: '[data-test="input-password"]',
    passwordField: '[data-test="form-field-password"]',

    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
