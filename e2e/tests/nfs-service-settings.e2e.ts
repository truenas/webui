/**
 * Stories: an admin saves the NFS service settings from the form its row on
 * System > Services opens, and the form refuses a port out of range.
 *
 * Enabled Protocols is covered by `nfs-access.e2e.ts` and left alone here. Bind
 * IP Addresses depends on the appliance's own addresses, RDMA on a NIC CI does
 * not have, and Add SPN on a directory service, so none of them is touched.
 *
 * The page has no readout of these settings, so each save is asserted through
 * `nfs.config`. Every field is read back, not only the ones a test edits: the
 * form sends all of them, so a save that changed one it was not asked to fails.
 *
 * The service stays stopped, so a save rewrites its configuration and restarts
 * nothing, and the settings go back to the baseline before and after every test.
 * See `fixtures/nfs.ts`.
 */
import {
  ensureNfsServiceStopped, nfsBaseline, readNfsSettings, setNfsSettings,
} from '../fixtures/nfs';
import { openServiceForm, openServiceFormOnceLoaded, saveServiceForm } from '../flows/services';
import { servicesLocators } from '../locators/services';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** `portRangeValidator()`'s refusal, as the app's `tn-form-field` error resolver words it. */
const portOutOfRangeMessage = 'The value is out of range. Enter a value between 1 and 65535.';

test.beforeEach(async ({ api }) => {
  await ensureNfsServiceStopped(api);
  await setNfsSettings(api, nfsBaseline);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the NFS service settings the test saved')) {
    return;
  }

  await runCleanupSteps([
    ['stop the NFS service', () => ensureNfsServiceStopped(api)],
    ['restore the NFS settings', () => setNfsSettings(api, nfsBaseline)],
  ]);
});

test('an admin sets a thread count, the three ports and both server-side toggles', async ({ page, api }) => {
  const form = servicesLocators.nfsForm;

  // Every field this test edits is empty or at its default on the baseline.
  await openServiceFormOnceLoaded(page, 'nfs');

  await page.locator(form.serversAuto).click();
  await page.locator(form.servers).fill('4');
  await page.locator(form.mountdPort).fill('618');
  await page.locator(form.rpcstatdPort).fill('619');
  await page.locator(form.rpclockdPort).fill('620');
  await page.locator(form.allowNonroot).click();
  await page.locator(form.userdManageGids).click();
  await saveServiceForm(page);

  expect(await readNfsSettings(api)).toEqual({
    ...nfsBaseline,
    servers: 4,
    managed_nfsd: false,
    mountd_port: 618,
    rpcstatd_port: 619,
    rpclockd_port: 620,
    allow_nonroot: true,
    userd_manage_gids: true,
  });
});

test('an admin sets the NFSv4 domain and Kerberos, then hands the thread count back', async ({ page, api }) => {
  const form = servicesLocators.nfsForm;

  // A manual count to start from, so ticking "Calculate number of threads
  // dynamically" below is a change. On the baseline it is already ticked.
  await setNfsSettings(api, { ...nfsBaseline, servers: 4 });

  await openServiceForm(page, 'nfs', form.servers, '4');
  await page.locator(form.v4Domain).fill('e2e.example');
  await page.locator(form.v4Krb).click();
  await saveServiceForm(page);

  expect(await readNfsSettings(api)).toEqual({
    ...nfsBaseline,
    servers: 4,
    managed_nfsd: false,
    v4_domain: 'e2e.example',
    v4_krb: true,
  });

  await openServiceForm(page, 'nfs', form.v4Domain, 'e2e.example');
  await page.locator(form.serversAuto).click();
  await expect(page.locator(form.servers)).toBeHidden();
  await saveServiceForm(page);

  // `handleSubmit` sends `servers: null` for a ticked box, which middleware
  // reports back as calculating the count itself.
  expect(await readNfsSettings(api)).toMatchObject({
    managed_nfsd: true,
    v4_domain: 'e2e.example',
    v4_krb: true,
  });
});

test('the NFS form refuses a mountd port out of range', async ({ page, api }) => {
  const form = servicesLocators.nfsForm;

  // A stored port, so the read-back at the end has a value to have kept.
  await setNfsSettings(api, { ...nfsBaseline, mountd_port: 618 });

  await openServiceForm(page, 'nfs', form.mountdPort, '618');
  // Not shown for the stored port, so a message afterwards is this refusal.
  await expect(page.locator(form.mountdPortField)).not.toContainText(portOutOfRangeMessage);

  await page.locator(form.mountdPort).fill('70000');
  await page.locator(form.mountdPort).blur();

  await expect(page.locator(form.mountdPortField)).toContainText(portOutOfRangeMessage);
  await expect(page.locator(servicesLocators.save)).toBeDisabled();
  expect((await readNfsSettings(api)).mountd_port).toBe(618);
});
