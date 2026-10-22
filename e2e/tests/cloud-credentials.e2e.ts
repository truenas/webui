/**
 * Stories: an admin adds a cloud credential and checks it with Verify
 * Credential, edits one and deletes one, from the Cloud Credentials card on
 * Credentials > Backup Credentials, and the appliance holds what they did.
 *
 * Every credential is SFTP to `127.0.0.1` as root, signing in with a keypair
 * this spec authorizes for root — see `fixtures/loopback-ssh.ts` — so Verify
 * reaches a real remote with no outside service involved. The cloud sync specs
 * create their credential the same way, over the API; this is the spec where
 * the form is what makes it.
 *
 * Each save is asserted twice: the card's row says the screen believed it,
 * `cloudsync.credentials.query` says the appliance did it — and carries the
 * host, user and keypair, which the card does not show.
 *
 * Edit and delete each run beside a second credential that must come through
 * untouched. Every row carries its own Edit and Delete buttons, so an action
 * belongs to whichever row's button was clicked, and a row-targeting bug
 * changes the wrong credential without failing anything else.
 */
import {
  countCloudCredentials,
  ensureCloudCredentialAbsent,
  ensureLoopbackCloudCredentialPresent,
  findCloudCredential,
  findCloudCredentialById,
  sftpFields,
} from '../fixtures/cloud-credentials';
import {
  ensureLoopbackRootKeyAbsent, ensureLoopbackRootKeyPresent, type LoopbackRootKey,
} from '../fixtures/loopback-ssh';
import {
  cloudCredentialCardPageSize,
  deleteCloudCredential,
  fillLoopbackSftpCredential,
  openAddCloudCredentialForm,
  openEditCloudCredentialForm,
  saveCloudCredentialForm,
  verifyCloudCredential,
} from '../flows/cloud-credentials';
import { cloudCredentialLocators } from '../locators/cloud-credentials';
import { errorDialogLocators } from '../locators/dialogs';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { errorDialogClose } from '../support/constants';
import { expect, test } from '../support/fixtures';

test.use({ laneSpec: 'cloud-credentials' });

/** Verify's answer is the only signal the form gives for a valid credential — see `verifyCloudCredential`. */
test.use({ recordApiCalls: true });

/** The marker goes on the public key in root's `sshpubkey`, so teardown removes this key and only this key. */
const loopbackRootKey: LoopbackRootKey = {
  keypairName: 'e2e-cloudcred-loopback-key',
  marker: 'e2e-cloudcred-loopback',
};

/** Created through the form, never over the API — that is the thing under test. */
const createdCredential = 'e2e-cloudcred-created';

/** Filled into the form and verified, never saved. */
const unverifiedCredential = 'e2e-cloudcred-unverified';

/** Provisioned over the API so there is something to edit or delete. */
const targetCredential = 'e2e-cloudcred-target';

/** What the edit renames the target to. */
const renamedCredential = 'e2e-cloudcred-renamed';

/** The credential that must survive whatever is done to the target. */
const bystanderCredential = 'e2e-cloudcred-bystander';

const allCredentials = [
  createdCredential,
  unverifiedCredential,
  targetCredential,
  renamedCredential,
  bystanderCredential,
];

/** The loopback keypair's id, which every credential here signs in with. */
let keypairId: number;

/** Both credentials over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureLoopbackCloudCredentialPresent(api, targetCredential, keypairId);
  await ensureLoopbackCloudCredentialPresent(api, bystanderCredential, keypairId);
}

async function removeAllCredentials(api: E2eApiClient): Promise<void> {
  await runCleanupSteps(allCredentials.map((name): [string, () => Promise<void>] => [
    `remove the cloud credential "${name}"`, () => ensureCloudCredentialAbsent(api, name),
  ]));
}

test.beforeAll(async ({ api }) => {
  await removeAllCredentials(api);
  keypairId = (await ensureLoopbackRootKeyPresent(api, loopbackRootKey)).id;
});

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  await removeAllCredentials(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the cloud credentials ${allCredentials.join(', ')}`)) {
    return;
  }

  await removeAllCredentials(api);
});

/**
 * Credentials first: middleware refuses to delete a keypair a credential still
 * uses. Separate steps, so a credential that will not delete still has root's
 * key taken back out.
 */
test.afterAll(async ({ api }) => {
  if (leavingTestData(`the keypair "${loopbackRootKey.keypairName}" and root's key`)) {
    return;
  }

  await runCleanupSteps([
    ['remove every cloud credential this spec makes', () => removeAllCredentials(api)],
    ['remove root\'s loopback key, its keypair, and SSH if it was started', () => (
      ensureLoopbackRootKeyAbsent(api, loopbackRootKey)
    )],
  ]);
});

test('an admin adds an SFTP credential that passes Verify, and the appliance stores it as filled in', async ({
  page, api,
}) => {
  // The card reloads after the save with no signal the test can wait on, and
  // View All pressed in that window sizes the list by the old count, so instead
  // of expanding, this needs the new row to fit on the card. A fresh appliance
  // holds none; failing here says why rather than timing out on a hidden row.
  const existing = await countCloudCredentials(api);
  expect(
    existing < cloudCredentialCardPageSize,
    `the card lists ${cloudCredentialCardPageSize} credentials before View All, and the appliance holds ${existing}`,
  ).toBe(true);

  await openAddCloudCredentialForm(page);
  await fillLoopbackSftpCredential(page, {
    name: createdCredential,
    user: 'root',
    keypairName: loopbackRootKey.keypairName,
  });

  // A valid credential is reported only in a toast with no `data-test`. The
  // answer has arrived and the form has acted on it by now, and the refusal test
  // below shows the same wait does see the dialog when there is one.
  await verifyCloudCredential(page);
  await expect(page.locator(errorDialogLocators.title)).toHaveCount(0);

  await saveCloudCredentialForm(page);

  await expect(page.locator(cloudCredentialLocators.card.name(createdCredential))).toHaveText(createdCredential);
  await expect(page.locator(cloudCredentialLocators.card.provider(createdCredential))).toHaveText('SFTP');

  const saved = await findCloudCredential(api, createdCredential);
  expect(saved?.name).toBe(createdCredential);
  expect(sftpFields(saved)).toMatchObject({
    type: 'SFTP',
    host: '127.0.0.1',
    user: 'root',
    private_key: keypairId,
  });
});

test('Verify refuses an SFTP credential whose user cannot sign in, and nothing is saved', async ({ page, api }) => {
  await openAddCloudCredentialForm(page);
  await fillLoopbackSftpCredential(page, {
    name: unverifiedCredential,
    // No such account, so the key root authorized is offered to a user who has none.
    user: 'e2e-cloudcred-nobody',
    keypairName: loopbackRootKey.keypairName,
  });

  await verifyCloudCredential(page);
  await expect(page.locator(errorDialogLocators.title)).toBeVisible();
  await page.locator(errorDialogClose).click();
  await expect(page.locator(errorDialogLocators.title)).toBeHidden();

  // Verify only checks; the credential exists only once Save is pressed.
  expect(await findCloudCredential(api, unverifiedCredential)).toBeUndefined();
});

test('editing a credential from the card changes the credential that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);
  const before = await findCloudCredential(api, targetCredential);
  const editedUser = 'e2e-cloudcred-edited';

  await openEditCloudCredentialForm(page, targetCredential, 'root', await countCloudCredentials(api));
  await page.locator(cloudCredentialLocators.form.name).fill(renamedCredential);
  await page.locator(cloudCredentialLocators.form.sftp.user).fill(editedUser);
  await saveCloudCredentialForm(page);

  // The name is in the row tag, so the edited row answers only under its new ids.
  await expect(page.locator(cloudCredentialLocators.card.name(renamedCredential))).toHaveText(renamedCredential);
  await expect(page.locator(cloudCredentialLocators.card.row(targetCredential))).toBeHidden();

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the card looking the same. The user is in the provider sub-form, which
  // the panel renders apart from the name, so it is checked on its own.
  expect(before).toBeDefined();
  const after = await findCloudCredentialById(api, before?.id ?? -1);
  expect(after?.name).toBe(renamedCredential);
  expect(sftpFields(after)).toMatchObject({ host: '127.0.0.1', user: editedUser, private_key: keypairId });

  const bystander = await findCloudCredential(api, bystanderCredential);
  expect(sftpFields(bystander)).toMatchObject({ host: '127.0.0.1', user: 'root', private_key: keypairId });
});

test('deleting a credential from the card removes the credential that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteCloudCredential(page, targetCredential, await countCloudCredentials(api));

  // Polled rather than read once: a row can also be hidden while the table is
  // between loads, which proves nothing.
  await expect.poll(() => findCloudCredential(api, targetCredential)).toBeUndefined();

  // The whole point of the second credential: the card looks right either way.
  await expect(page.locator(cloudCredentialLocators.card.row(bystanderCredential))).toBeVisible();
  expect(await findCloudCredential(api, bystanderCredential)).toBeDefined();
});
