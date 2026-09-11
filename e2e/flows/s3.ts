/**
 * S3 bucket and access key creation, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToS3AccessKeys, goToShares } from './navigation';
import { confirmDestructiveAction, selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { s3AccessKeyLocators, s3BucketLocators, s3ServiceLocators } from '../locators/s3';

/** Saving a bucket creates its dataset and reconfigures the service; not instant. */
const saveTimeoutMs = 90_000;

/**
 * Picks an account in an `ix-user-combobox`.
 *
 * The field is an autocomplete over a middleware query, so the row is not in
 * the DOM until the typed text has been sent and answered. Typing the whole
 * username narrows the list to it (plus the field's own "Add New" row), and
 * clicking the row is what commits the value — the text alone does not.
 */
async function pickUser(page: Page, input: string, option: string, username: string): Promise<void> {
  await page.locator(input).fill(username);
  await page.locator(option).click();
}

export interface NewS3Bucket {
  name: string;
  /** Dataset name, `pool/parent`; the bucket gets `pool/parent/<name>`. */
  parentDataset: string;
  owner: string;
  /** Default retention period of the object lock rule, in days. */
  retentionDays: number;
}

export interface CreateBucketOptions {
  /**
   * The service is already running, so the app has nothing to offer after the
   * save and the panel closes straight to the list. The prompt's absence is
   * asserted, since a prompt over a running service would be the bug.
   */
  serviceRunning?: boolean;
}

/**
 * Creates a bucket with object lock from the Shares dashboard, and starts the
 * S3 service when the app offers to.
 *
 * Object lock is the basic-mode option the form leads with, because backup
 * targets are what S3 on a NAS is mostly for. Checking it is meant to do three
 * things at once — turn versioning on, default the retention mode to
 * Compliance, and ask for a retention period — and the API check in the test
 * is what confirms the first two, since neither is visible in basic mode.
 *
 * Starting the service matters for the same reason as SMB: a bucket on a
 * stopped service is configuration that serves nothing.
 */
export async function createS3BucketWithObjectLock(
  page: Page,
  bucket: NewS3Bucket,
  options: CreateBucketOptions = {},
): Promise<void> {
  await openBucketCreator(page);

  const form = s3BucketLocators.form;
  await page.locator(form.name).fill(bucket.name);

  // The picker commits typed text on `change`, which fires on blur — so blur
  // explicitly rather than relying on the next fill to steal focus.
  await page.locator(form.parentDataset).fill(bucket.parentDataset);
  await page.locator(form.parentDataset).blur();

  await pickUser(page, form.owner, form.ownerOption(bucket.owner), bucket.owner);

  // The retention controls only render once object lock is on, so their
  // appearance confirms the box went the intended way rather than blindly
  // toggling whatever state it was in.
  await page.locator(form.objectLock).click();
  await expect(page.locator(form.defaultRetentionMode)).toBeVisible();
  await expect(page.locator(form.defaultRetentionDays)).toBeVisible();
  await page.locator(form.defaultRetentionDays).fill(String(bucket.retentionDays));

  await page.locator(form.save).click();

  const startService = page.locator(s3BucketLocators.startService);
  if (options.serviceRunning) {
    await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
    await expect(startService).toBeHidden();
  } else {
    // Asserted rather than probed: the fixture stops the service beforehand, so
    // the prompt is part of the journey and its absence is a flow change worth
    // failing on.
    await expect(startService).toBeVisible({ timeout: saveTimeoutMs });
    await startService.click();
    await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
  }

  await expect(page.locator(s3BucketLocators.dashboardRowName(bucket.name))).toBeVisible({
    timeout: saveTimeoutMs,
  });
}

/**
 * Opens the bucket creator from the Shares dashboard card. The Name input
 * appearing is the signal the side panel has rendered the form.
 */
export async function openBucketCreator(page: Page): Promise<void> {
  await goToShares(page);
  await page.locator(s3BucketLocators.addFromDashboard).click();
  await expect(page.locator(s3BucketLocators.form.name)).toBeVisible();
}

/** What the Parent Dataset field of the open bucket creator holds. */
export async function readBucketParentDataset(page: Page): Promise<string> {
  return page.locator(s3BucketLocators.form.parentDataset).inputValue();
}

/**
 * Closes the open bucket panel without saving, answering "Yes" to the
 * unsaved-changes question when the form asks it.
 *
 * The question is raised only for a dirty form; a prefilled field is set
 * programmatically and leaves the form pristine, so whether it appears is the
 * form's business. It is looked for briefly rather than required.
 */
export async function closeBucketPanel(page: Page): Promise<void> {
  await page.locator(s3BucketLocators.form.closePanel).click();
  // `waitFor`, not `isVisible`: the latter ignores its timeout and answers at
  // once, which would miss a question raised a frame after the click.
  const discard = page.locator(confirmDialogLocators.confirm);
  const asked = await discard.waitFor({ state: 'visible', timeout: 2_000 }).then(() => true, () => false);
  if (asked) {
    await discard.click();
  }
  await expect(page.locator(s3BucketLocators.form.name)).toBeHidden();
}

export interface NewS3AccessKey {
  name: string;
  username: string;
  /**
   * Let clients signing with the key create and delete buckets. Middleware
   * accepts it only for an account holding SHARING_S3_WRITE.
   */
  manageBuckets?: boolean;
  /** When the key stops working. Omitted, the key is made non-expiring. */
  expiresOn?: Date;
}

/**
 * Types a date into `tn-date-input`, which is three segment inputs — month,
 * day, year — rather than one text field. Each segment is filled and read
 * back, so a segment that swallowed its digits would fail here rather than
 * leave the field required and the save refused for a reason unrelated to
 * the journey.
 */
async function fillDateInput(
  page: Page,
  segments: { month: string; day: string; year: string },
  date: Date,
): Promise<void> {
  const parts = {
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0'),
    year: String(date.getFullYear()),
  };
  for (const segment of ['month', 'day', 'year'] as const) {
    await page.locator(segments[segment]).fill(parts[segment]);
    await expect(page.locator(segments[segment])).toHaveValue(parts[segment]);
  }
  await page.locator(segments.year).blur();
}

/** What the credentials dialog showed, read back for the API cross-check. */
export interface ShownS3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Creates a non-expiring access key under Credentials and reads the credential
 * pair off the one-time dialog.
 *
 * Non-expiring is opt-in: the form asks for a date by default. Ticking the box
 * is checked by the date input disappearing, so a default that flips would
 * fail here rather than quietly producing a key with a date nobody chose.
 *
 * The secret is shown exactly once, which is why it is read here rather than
 * looked up afterwards — nothing on the appliance will show it again.
 */
export async function createS3AccessKey(page: Page, key: NewS3AccessKey): Promise<ShownS3Credentials> {
  await fillAccessKeyForm(page, key);
  await page.locator(s3AccessKeyLocators.form.save).click();

  const shown = await readCredentialsDialog(page);
  await expect(page.locator(s3AccessKeyLocators.rowName(key.name))).toBeVisible({ timeout: saveTimeoutMs });

  return shown;
}

/**
 * Tries to create a key middleware is expected to refuse, and returns once
 * the form shows the refusal: a field error, with the panel still open.
 *
 * The one case today is Manage Buckets on a key whose account lacks
 * SHARING_S3_WRITE. What the mocked unit spec cannot check is that the error
 * comes back and lands in the form rather than in a dialog over it.
 */
export async function attemptRefusedS3AccessKey(page: Page, key: NewS3AccessKey): Promise<void> {
  await fillAccessKeyForm(page, key);
  const form = s3AccessKeyLocators.form;
  await page.locator(form.save).click();

  // The library renders a field error as a `role="alert"` under the control,
  // with no test id of its own; the role is the contract. The role name is
  // what the assertion is about, so a refusal that came back as a dialog over
  // the form, or under a different field, would fail here.
  await expect(page.getByRole('alert').filter({ hasText: /SHARING_S3_WRITE/ })).toBeVisible({ timeout: saveTimeoutMs });
  await expect(page.locator(form.save)).toBeVisible();

  // Leave nothing over the next test's screen. The form is dirty, so the
  // unsaved-changes question is asserted rather than looked for.
  await page.locator(form.closePanel).click();
  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(form.name)).toBeHidden();
}

/**
 * Opens the access key form under Credentials and fills it in, up to Save.
 *
 * Non-expiring is opt-in: the form asks for a date by default. Ticking the box
 * is checked by the date input disappearing, so a default that flips would
 * fail here rather than quietly producing a key with a date nobody chose. An
 * expiry is typed segment by segment; see `fillDateInput`.
 */
async function fillAccessKeyForm(page: Page, key: NewS3AccessKey): Promise<void> {
  await goToS3AccessKeys(page);

  await page.locator(s3AccessKeyLocators.add).click();

  const form = s3AccessKeyLocators.form;
  await expect(page.locator(form.name)).toBeVisible();
  await page.locator(form.name).fill(key.name);

  await pickUser(page, form.user, form.userOption(key.username), key.username);

  if (key.manageBuckets) {
    await page.locator(form.manageBuckets).click();
  }

  await expect(page.locator(form.expiresAt)).toBeVisible();
  if (key.expiresOn) {
    await fillDateInput(
      page,
      { month: form.expiresAtMonth, day: form.expiresAtDay, year: form.expiresAtYear },
      key.expiresOn,
    );
  } else {
    await page.locator(form.nonExpiring).click();
    await expect(page.locator(form.expiresAt)).toBeHidden();
  }
}

/**
 * Reads the credential pair off the one-time dialog and closes it.
 *
 * Raised after a key is created and after its secret is rotated; the secret
 * appears nowhere else, so this is the only place a test can take it from.
 */
async function readCredentialsDialog(page: Page): Promise<ShownS3Credentials> {
  const dialog = s3AccessKeyLocators.credentialsDialog;
  await expect(page.locator(dialog.secretAccessKey)).toBeVisible({ timeout: saveTimeoutMs });

  const accessKeyId = await page.locator(dialog.accessKeyId).inputValue();
  const secretAccessKey = await page.locator(dialog.secretAccessKey).inputValue();

  await page.locator(dialog.close).click();
  await expect(page.locator(dialog.secretAccessKey)).toBeHidden();

  return { accessKeyId, secretAccessKey };
}

/** A grant added through the bucket form's Grants list; a new row is a User grant until changed. */
export interface NewS3Grant {
  principalType: 'USER' | 'GROUP';
  /** Username or group name, as the picker shows it. */
  principal: string;
  access: 'READONLY' | 'WRITEONLY' | 'READWRITE' | 'DENY';
}

/**
 * What the selects show for each value — `s3PrincipalTypeLabels`,
 * `s3AccessLabels` and `s3LogLevelLabels` in `app/enums/s3.enum.ts`. Option
 * ids are keyed by label, so the flows translate from the value the API
 * speaks to the text the picker shows.
 */
const principalTypeLabels = { USER: 'User', GROUP: 'Group' } as const;
const accessLabels = {
  READONLY: 'Read Only', WRITEONLY: 'Write Only', READWRITE: 'Read / Write', DENY: 'Deny',
} as const;
const logLevelLabels = {
  ERROR: 'Error', WARNING: 'Warning', NOTICE: 'Notice', INFO: 'Info', DEBUG: 'Debug',
} as const;

/**
 * Opens a bucket's editor from the dashboard card's row menu.
 *
 * The editor is the same side panel as creation; the Name input appearing is
 * the signal it has loaded the bucket.
 */
export async function openBucketEditor(page: Page, bucket: string): Promise<void> {
  await goToShares(page);
  await page.locator(s3BucketLocators.dashboardRow.menu(bucket)).click();
  await page.locator(s3BucketLocators.dashboardRow.edit(bucket)).click();
  await expect(page.locator(s3BucketLocators.form.name)).toBeVisible();
}

/**
 * Switches the open bucket editor to Advanced Options.
 *
 * The Grants list is only rendered there; its Add control appearing is what
 * confirms the toggle went the intended way rather than blindly flipping it.
 */
export async function showAdvancedBucketOptions(page: Page): Promise<void> {
  await page.locator(s3BucketLocators.form.advancedOptions).click();
  await expect(page.locator(s3BucketLocators.form.grants.add)).toBeVisible();
}

/**
 * Adds one grant to the open bucket editor, which must be in Advanced Options.
 *
 * Row controls fall back to their control names and so repeat per row — every
 * interaction here targets the last row, which is the one just added. That is
 * only true once the row exists: the list renders the new row a tick after
 * Add pushes it, and a `.last()` resolved in between lands on the previous
 * row (CI run 34267037987 did exactly that — switched the first grant to Group
 * and typed the group name into the new row's User field). So Add is followed
 * by waiting for the row count to grow.
 */
export async function addBucketGrant(page: Page, grant: NewS3Grant): Promise<void> {
  const { grants } = s3BucketLocators.form;
  const rows = page.locator(grants.principalType);

  const rowsBefore = await rows.count();
  await page.locator(grants.add).click();
  await expect(rows).toHaveCount(rowsBefore + 1);

  // A new row starts as a User grant. Choosing Group swaps the picker for a
  // different component (`@switch` on the principal type in the grants list),
  // and the swap lands a moment after the option click — text typed into the
  // picker in between goes into the old one, which is then destroyed (CI runs
  // 34267037987 and 34268513306 showed exactly that: an empty Group field and
  // no option to click). So the old picker is held and the flow waits for it
  // to leave the DOM before typing. For a User grant there is no swap to wait
  // for, and waiting would time out — hence the branch.
  if (grant.principalType !== 'USER') {
    const previousPicker = await page.locator(grants.principal).last().elementHandle();
    await rows.last().click();
    await page.locator(grants.principalTypeOption(principalTypeLabels[grant.principalType])).click();
    await previousPicker?.waitForElementState('hidden');
  }

  // The picker is an autocomplete over a middleware query: typing narrows it,
  // clicking the option commits the value.
  await page.locator(grants.principal).last().fill(grant.principal);
  await page.locator(grants.principalOption(grant.principal)).click();

  await page.locator(grants.access).last().click();
  await page.locator(grants.accessOption(accessLabels[grant.access])).click();
}

/**
 * What the advanced selects show for each value — `s3PermissionsModelLabels`,
 * `s3VersioningLabels` and `s3MultipartEtagLabels` in `app/enums/s3.enum.ts`.
 */
const permissionsModelLabels = { S3: 'S3', MULTIPROTOCOL: 'Multiprotocol' } as const;
const versioningLabels = { OFF: 'Off', ENABLED: 'Enabled', SUSPENDED: 'Suspended' } as const;
const multipartEtagLabels = { COMPOSITE: 'Composite (S3 standard)', MINTED: 'Minted (opaque token)' } as const;

/**
 * Picks the permissions model in the open bucket editor, which must be in
 * Advanced Options.
 */
export async function setBucketPermissionsModel(page: Page, model: 'S3' | 'MULTIPROTOCOL'): Promise<void> {
  const { form } = s3BucketLocators;
  await selectOption(page, form.permissionsModel, form.permissionsModelOption(permissionsModelLabels[model]));
}

/**
 * Asserts what the Object Ownership select shows, by label — "Object Writer"
 * once Multiprotocol has folded it.
 */
export async function expectObjectOwnershipShown(page: Page, label: string): Promise<void> {
  await expect(page.locator(s3BucketLocators.form.objectOwnership)).toContainText(label);
}

export interface S3VersioningOptions {
  /**
   * Snapshot name patterns, one chip each: letters, digits, `-`, `_`, `.`,
   * `:`, space, and `*` / `?` as the only wildcards (the form validates this).
   */
  snapshotVersions: readonly string[];
  snapshotVersionsMax: number;
  multipartEtag: 'COMPOSITE' | 'MINTED';
}

/**
 * Turns versioning on in the open bucket editor (Advanced Options) and fills
 * the options that appear with it, plus the ETag choice from "Other Options".
 *
 * The snapshot controls render only once versioning is not Off, so their
 * appearance confirms the select took. Each pattern is typed and committed
 * with Enter; the chip input accepts free text (`allowCustomValue`).
 */
export async function setBucketVersioningOptions(page: Page, options: S3VersioningOptions): Promise<void> {
  const { form } = s3BucketLocators;
  await selectOption(page, form.versioning, form.versioningOption(versioningLabels.ENABLED));
  await expect(page.locator(form.snapshotVersions)).toBeVisible();

  for (const pattern of options.snapshotVersions) {
    await page.locator(form.snapshotVersions).fill(pattern);
    await page.locator(form.snapshotVersions).press('Enter');
  }
  await page.locator(form.snapshotVersionsMax).fill(String(options.snapshotVersionsMax));

  await selectOption(page, form.multipartEtag, form.multipartEtagOption(multipartEtagLabels[options.multipartEtag]));
}

/**
 * Saves the open bucket editor, declining the "Start S3 Service" prompt.
 *
 * Saving an edit dispatches the same service check as creating, so with the
 * service stopped (the fixtures' precondition) the prompt follows the panel
 * closing. Declined rather than accepted: editing a bucket is not the journey
 * that starts the service, and the "No" is asserted so a flow change fails
 * here rather than leaving a dialog over the next step.
 */
export async function saveBucketEditor(page: Page): Promise<void> {
  await page.locator(s3BucketLocators.form.save).click();
  await expect(page.locator(s3BucketLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });

  const doNotStart = page.locator(s3BucketLocators.doNotStartService);
  await expect(doNotStart).toBeVisible({ timeout: saveTimeoutMs });
  await doNotStart.click();
  await expect(doNotStart).toBeHidden();
}

/**
 * Flips a bucket's Enabled toggle in the dashboard card.
 *
 * The toggle calls `sharing.s3.update` straight from the row; there is no
 * dialog. Whether it took is a question for the API, which the test asks.
 */
export async function toggleBucketEnabled(page: Page, bucket: string): Promise<void> {
  await goToShares(page);
  await page.locator(s3BucketLocators.dashboardRow.enabledToggle(bucket)).click();
}

/**
 * Deletes a bucket from the dashboard card's row menu.
 *
 * `confirmDelete` raises the standard confirm dialog with its tick box, so the
 * destructive-action helper applies. The row disappearing is the app's signal.
 */
export async function deleteBucketFromDashboard(page: Page, bucket: string): Promise<void> {
  await goToShares(page);
  await page.locator(s3BucketLocators.dashboardRow.menu(bucket)).click();
  await page.locator(s3BucketLocators.dashboardRow.delete(bucket)).click();
  await confirmDestructiveAction(page);
  await expect(page.locator(s3BucketLocators.dashboardRowName(bucket))).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Rotates an access key's secret from its row menu and reads the new pair off
 * the dialog. The confirmation is the standard dialog with a warn-coloured
 * button and the tick box, hence the destructive-action helper.
 */
export async function rotateS3AccessKey(page: Page, name: string): Promise<ShownS3Credentials> {
  await goToS3AccessKeys(page);
  await page.locator(s3AccessKeyLocators.row.menu(name)).click();
  await page.locator(s3AccessKeyLocators.row.rotate(name)).click();
  await confirmDestructiveAction(page);

  return readCredentialsDialog(page);
}

/** Deletes an access key from its row menu. */
export async function deleteS3AccessKey(page: Page, name: string): Promise<void> {
  await goToS3AccessKeys(page);
  await page.locator(s3AccessKeyLocators.row.menu(name)).click();
  await page.locator(s3AccessKeyLocators.row.delete(name)).click();
  await confirmDestructiveAction(page);
  await expect(page.locator(s3AccessKeyLocators.rowName(name))).toBeHidden({ timeout: saveTimeoutMs });
}

export interface S3ServiceSettings {
  /** A bind address from `s3.bindip_choices`. */
  address: string;
  port: number;
  tls: boolean;
  servers: number;
  region: string;
  logLevel: 'ERROR' | 'WARNING' | 'NOTICE' | 'INFO' | 'DEBUG';
}

/**
 * Configures the S3 service from the dashboard card's header menu: one
 * listener, the server count, the region and the log level.
 *
 * The certificate is left on "Use UI certificate" deliberately — that is the
 * default a TLS listener is meant to work with, and it is the choice that has
 * no picker option id of its own (its value is `null`).
 *
 * The form loads its configuration after opening, so the Servers input
 * appearing is what confirms it is ready to be driven. The listener row's
 * controls fall back to their control names and so would match every row; the
 * fixture clears the listeners beforehand, and this still scopes to the last
 * row — the one just added — so a leftover row breaks the assertion, not the
 * locator.
 */
export async function configureS3Service(page: Page, serviceId: number, settings: S3ServiceSettings): Promise<void> {
  await openS3ServiceConfig(page, serviceId);
  const form = s3ServiceLocators.form;

  // Same race as `addBucketGrant`: the row renders a tick after Add, so wait
  // for it to exist before `.last()` can mean the row just added.
  const listenerRows = page.locator(form.listenerAddress);
  const rowsBefore = await listenerRows.count();
  await page.locator(form.addListener).click();
  await expect(listenerRows).toHaveCount(rowsBefore + 1);
  await listenerRows.last().click();
  await page.locator(form.listenerAddressOption(settings.address)).click();
  await page.locator(form.listenerPort).last().fill(String(settings.port));
  if (settings.tls) {
    await page.locator(form.listenerTls).last().click();
  }

  await page.locator(form.servers).fill(String(settings.servers));
  await page.locator(form.region).fill(settings.region);
  await selectOption(page, form.logLevel, form.logLevelOption(logLevelLabels[settings.logLevel]));

  await page.locator(form.save).click();
  await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens the S3 service configuration from the dashboard card's header menu.
 * The form loads its configuration after opening, so the Servers input
 * appearing is what confirms it is ready to be driven.
 */
async function openS3ServiceConfig(page: Page, serviceId: number): Promise<void> {
  await goToShares(page);
  await page.locator(s3ServiceLocators.cardMenuTrigger(serviceId)).click();
  await page.locator(s3ServiceLocators.configService).click();
  await expect(page.locator(s3ServiceLocators.form.servers)).toBeVisible();
}

/**
 * Sets the service's managed root dataset — where buckets created through the
 * S3 protocol get their datasets — and saves.
 *
 * Typed as a dataset name (`tank/s3`), not a mount point: the explorer runs in
 * dataset-name space precisely so what is typed is what is stored. Blurred
 * explicitly, as for the bucket form's parent dataset: the picker commits on
 * `change`.
 */
export async function setS3ManagedRootDatasetFromCard(page: Page, serviceId: number, dataset: string): Promise<void> {
  await openS3ServiceConfig(page, serviceId);
  const form = s3ServiceLocators.form;

  await page.locator(form.managedRootDataset).fill(dataset);
  await page.locator(form.managedRootDataset).blur();

  await page.locator(form.save).click();
  await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Flips the S3 service's on/off switch in the dashboard card's header.
 *
 * The switch calls `service.control` straight away and reports through a
 * snackbar; whether the service actually changed state is a question for the
 * API, which the test asks.
 */
export async function toggleS3ServiceFromCard(page: Page): Promise<void> {
  await goToShares(page);
  await page.locator(s3ServiceLocators.cardServiceToggle).click();
}
