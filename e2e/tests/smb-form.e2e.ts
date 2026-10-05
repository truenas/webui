/**
 * Story: what the SMB share form accepts, what it refuses, and what the
 * appliance is left holding afterwards.
 *
 * `purpose` selects a preset, and `presetEnabledFields` decides from it which
 * options exist at all, so the same panel is a different form per purpose.
 * Saves are asserted through `sharing.smb.query`, which also carries back what
 * the form never shows: the `purpose` it stored and the `options` it derived.
 * Every save declines the offer to start SMB, because service state is global.
 */
import {
  ensureSmbServiceStopped, ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare,
} from '../fixtures/smb';
import { ensureDatasetAbsent, ensureDatasetPresent, datasetMountPath } from '../fixtures/storage';
import {
  choosePurpose, formSettleTimeoutMs, openAddShareForm, saveShareForm, showAdvancedOptions,
} from '../flows/smb';
import { smbLocators } from '../locators/smb';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const newShare = 'e2e_form_share';
const externalShare = 'e2e_form_external';

/** Provisioned over the API purely so the form has a name to collide with. */
const existingShare = 'e2e_form_taken';

const allShares = [newShare, externalShare, existingShare];

/** The dataset every local share here points at. */
const datasetName = 'e2e_form_smb_ds';

/**
 * Purpose labels as the select renders them. Options are keyed by label rather
 * than by the stored value, so these are the strings the locator needs — see
 * `locators/smb.ts`.
 */
const purpose = {
  default: 'Default Share',
  timeMachine: 'Time Machine Share',
  external: 'External Share',
} as const;

test.beforeEach(async ({ api, pool }) => {
  for (const share of allShares) {
    await ensureSmbShareAbsent(api, share);
  }
  await ensureDatasetPresent(api, `${pool}/${datasetName}`);

  // Established, not assumed. Every save here answers the *start* offer, and
  // that offer only exists while the service is stopped — running, the form
  // raises the restart dialog instead (`isRestartRequired` is true for any new
  // share) and these tests would wait out a button that never renders. An
  // appliance an admin left SMB running on, or an interrupted run of
  // `smb-service.e2e.ts`, is all it takes.
  await ensureSmbServiceStopped(api);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the e2e_form_* shares and dataset "${pool}/${datasetName}"`)) {
    return;
  }

  await runCleanupSteps([
    ...allShares.map((share): [string, () => Promise<void>] => (
      [`remove share ${share}`, () => ensureSmbShareAbsent(api, share)]
    )),
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, `${pool}/${datasetName}`)],
  ]);
});

test('an admin publishes a share, and the appliance really has one', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);

  await openAddShareForm(page);
  await page.locator(smbLocators.form.path).fill(path);
  await page.locator(smbLocators.form.name).fill(newShare);
  await saveShareForm(page);

  await expect(page.locator(smbLocators.card.row(newShare))).toBeVisible({ timeout: formSettleTimeoutMs });

  const saved = await findSmbShare(api, newShare);
  expect(saved).toBeDefined();
  expect(saved).toMatchObject({
    name: newShare,
    path,
    enabled: true,
    // Never chosen on screen. The form opens on Default and submits it, so a
    // share that came back on some other preset would mean the control and the
    // payload had drifted apart.
    purpose: 'DEFAULT_SHARE',
  });
});

test('the purpose a share is given decides which options it has', async ({ page, pool }) => {
  const form = smbLocators.form;

  await openAddShareForm(page);
  await page.locator(form.path).fill(datasetMountPath(`${pool}/${datasetName}`));
  await page.locator(form.name).fill(newShare);
  await showAdvancedOptions(page);

  // Default Share: Apple name mangling is offered, Time Machine's own options
  // are not.
  await expect(page.locator(form.aaplNameMangling)).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(form.autoSnapshot)).toBeHidden();
  await expect(page.locator(form.timeMachineQuota)).toBeHidden();

  await choosePurpose(page, purpose.timeMachine);

  // And the swap runs both ways round. A form that only ever *added* fields
  // would satisfy half of this, which is why the disappearance is asserted too.
  await expect(page.locator(form.autoSnapshot)).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(form.timeMachineQuota)).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(form.aaplNameMangling)).toBeHidden();

  // The control that should not move: hosts-allow is enabled for both purposes,
  // so it is what distinguishes "the preset changed the form" from "the form
  // re-rendered and lost everything".
  await expect(page.locator(form.hostsAllow)).toBeVisible({ timeout: formSettleTimeoutMs });

  await choosePurpose(page, purpose.default);
  await expect(page.locator(form.aaplNameMangling)).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(form.autoSnapshot)).toBeHidden();
});

test('an external share points at another server instead of a path', async ({ page, api }) => {
  const form = smbLocators.form;

  await openAddShareForm(page);

  // The local path control is not disabled for this purpose — it is gone, and
  // a remote-path list stands where it was.
  await expect(page.locator(form.path)).toBeVisible();
  await choosePurpose(page, purpose.external);
  await expect(page.locator(form.path)).toBeHidden();
  await expect(page.locator(form.remotePath)).toBeVisible({ timeout: formSettleTimeoutMs });

  await page.locator(form.name).fill(externalShare);
  await page.locator(form.remotePath).fill('192.0.2.10\\backups');
  await page.keyboard.press('Enter');

  await saveShareForm(page);

  // The odd part, and the reason this is worth a test: the appliance stores the
  // literal sentinel `EXTERNAL` as the path, with the real destination tucked
  // into the options block. Nothing on screen says so.
  const saved = await findSmbShare(api, externalShare);
  expect(saved).toMatchObject({ name: externalShare, path: 'EXTERNAL', purpose: 'EXTERNAL_SHARE' });
  expect((saved?.options as { remote_path?: string[] })?.remote_path).toEqual(['192.0.2.10\\backups']);
});

test('the form will not publish a share name that is already taken', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);
  await ensureSmbSharePresent(api, { name: existingShare, path });

  await openAddShareForm(page);
  await page.locator(smbLocators.form.path).fill(path);

  // A free name first, and Save proven live on it — the form opens with an
  // empty required name, so asserting the refusal straight away would pass
  // without the validator having run at all.
  await page.locator(smbLocators.form.name).fill(newShare);
  await expect(page.locator(smbLocators.form.save)).toBeEnabled();

  // This refusal is not a local list lookup: `SmbValidationService` calls
  // `sharing.smb.share_precheck` and reads the *error text* back, so what is
  // being tested is a round trip to middleware and the parsing of its answer.
  //
  // The message is the verdict. Save alone is not: it is also held down while
  // the check is still on its way, so "disabled" would be true of a validator
  // that never refused anything.
  await page.locator(smbLocators.form.name).fill(existingShare);
  await page.locator(smbLocators.form.name).blur();
  await expect(page.locator(smbLocators.form.nameField))
    .toContainText('Share with this name already exists', { timeout: formSettleTimeoutMs });
  await expect(page.locator(smbLocators.form.save)).toBeDisabled();
});

test('the form will not publish a share name with invalid characters', async ({ page, pool }) => {
  await openAddShareForm(page);
  await page.locator(smbLocators.form.path).fill(datasetMountPath(`${pool}/${datasetName}`));

  await page.locator(smbLocators.form.name).fill(newShare);
  await expect(page.locator(smbLocators.form.save)).toBeEnabled();

  // The validator's other branch. Same round trip, different message parsed out
  // of it — and a share name is passed to Samba, so the characters it rejects
  // are a real constraint rather than a UI preference.
  await page.locator(smbLocators.form.name).fill('bad/name');
  await page.locator(smbLocators.form.name).blur();
  await expect(page.locator(smbLocators.form.nameField))
    .toContainText('Share name contains the following invalid characters', { timeout: formSettleTimeoutMs });
  await expect(page.locator(smbLocators.form.save)).toBeDisabled();
});
