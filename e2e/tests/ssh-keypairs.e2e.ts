/**
 * Stories: an admin generates an SSH keypair and deletes one, from the SSH
 * Keypairs card on Credentials > Backup Credentials, and the appliance holds
 * what they did.
 *
 * Each is asserted twice, the way the other card specs do it: the card's row
 * says the screen believed it, `keychaincredential.query` says the appliance did
 * it — and carries what the card does not show at all, the keys themselves.
 *
 * The delete runs beside a second keypair that must come through untouched: the
 * row's actions sit in a kebab menu, so an action belongs to whichever row's
 * menu was opened, and a row-targeting bug deletes the wrong keypair without
 * failing anything else.
 */
import {
  ensureSshKeypairAbsent, ensureSshKeypairPresent, findSshKeypair, keypairKeys,
} from '../fixtures/ssh-keypairs';
import {
  deleteSshKeypair, generateKeypair, openAddSshKeypairForm, saveSshKeypairForm,
} from '../flows/ssh-keypairs';
import { sshKeypairLocators } from '../locators/ssh-keypairs';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const generatedKeypair = 'e2e-keypair-generated';

/** Provisioned over the API so there is something to delete. */
const targetKeypair = 'e2e-keypair-target';

/** The keypair that must survive whatever is done to the target. */
const bystanderKeypair = 'e2e-keypair-bystander';

const allKeypairs = [generatedKeypair, targetKeypair, bystanderKeypair];

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const name of allKeypairs) {
    await ensureSshKeypairAbsent(api, name);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the SSH keypairs ${allKeypairs.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allKeypairs.map((name): [string, () => Promise<void>] => [
    `remove the SSH keypair "${name}"`, () => ensureSshKeypairAbsent(api, name),
  ]));
});

test('an admin generates an SSH keypair, and the appliance stores that pair', async ({ page, api }) => {
  await openAddSshKeypairForm(page);
  await page.locator(sshKeypairLocators.form.name).fill(generatedKeypair);
  const shown = await generateKeypair(page);
  await saveSshKeypairForm(page);

  await expect(page.locator(sshKeypairLocators.card.name(generatedKeypair))).toHaveText(generatedKeypair);

  const saved = await findSshKeypair(api, generatedKeypair);
  expect(saved).toMatchObject({ name: generatedKeypair, type: 'SSH_KEY_PAIR' });

  // The pair Generate filled in is the pair that was stored, not merely some
  // pair. Trimmed, so a trailing newline either side cannot decide it. The
  // private key is compared as a boolean so a failure never prints it.
  const stored = keypairKeys(saved);
  expect(stored.publicKey?.trim()).toBe(shown.publicKey.trim());
  expect(
    stored.privateKey?.trim() === shown.privateKey.trim(),
    'the stored private key is not the one the form generated',
  ).toBe(true);
});

test('deleting a keypair from the card removes the keypair that was picked', async ({ page, api }) => {
  await ensureSshKeypairPresent(api, targetKeypair);
  await ensureSshKeypairPresent(api, bystanderKeypair);

  await deleteSshKeypair(page, targetKeypair);

  // Polled rather than read once: the card reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findSshKeypair(api, targetKeypair)).toBeUndefined();

  // The whole point of the second keypair: the card looks right either way.
  await expect(page.locator(sshKeypairLocators.card.row(bystanderKeypair))).toBeVisible();
  expect(await findSshKeypair(api, bystanderKeypair)).toBeDefined();
});
