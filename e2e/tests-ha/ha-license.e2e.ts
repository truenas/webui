/**
 * Story: an admin licenses a fresh pair of controllers for HA, from the
 * Support card on System > General Settings, and both controllers take it.
 *
 * The first link of the HA suite's chain (`playwright.config.ts`): every
 * journey after it needs the license. Its project records nothing — no
 * trace, screenshot or video — because this test pastes the license into a
 * textarea, and CI publishes all three.
 *
 * Nothing is torn down, here or anywhere in the HA suite: each journey sets
 * up what the next builds on, and the pair is gone with the runner.
 */
import {
  expectsEula, isEulaAccepted, readFailover, readHaLicense, requireHa,
} from '../fixtures/ha';
import { acceptEula, uploadLicense } from '../flows/ha';
import { haStatusLocators } from '../locators/ha';
import { expect, test } from '../support/fixtures';

/** The license reaches the other controller over the heartbeat, in seconds, usually. */
const peerLicenseTimeoutMs = 2 * 60_000;

test('an admin licenses the pair for HA, and both controllers take it', async ({ page, api, config }) => {
  const ha = requireHa(config);

  expect(await readFailover(api), 'a fresh pair, unlicensed').toMatchObject({ licensed: false, node: 'A' });

  // A pair of HA VMs is TrueNAS hardware to the UI, so the first sign-in meets
  // the EULA before there is any license — and the upload brings it back.
  if (await expectsEula(api)) {
    await acceptEula(page);
  }

  await uploadLicense(page, readHaLicense(ha.licenseFile));

  // The reload signs back in to a licensed system: the license lands before it.
  await expect.poll(async () => (await readFailover(api)).licensed).toBe(true);
  if (await expectsEula(api)) {
    await acceptEula(page);
    expect(await isEulaAccepted(api)).toBe(true);
  }

  // The topbar's HA icon appears only once the app sees an HA license. It
  // reads disabled: there is no VIP, pool, or failover yet.
  await expect(page.locator(haStatusLocators.indicatorDisabled)).toBeVisible();

  // Node A pushes the license to B over the heartbeat. Until B has it, A
  // reports NO_LICENSE among the reasons HA is off.
  await expect.poll(async () => (await readFailover(api)).reasons, {
    timeout: peerLicenseTimeoutMs,
  }).not.toContain('NO_LICENSE');
});
