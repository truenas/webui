/**
 * Stories: the NFS service, from the three places the Shares dashboard reaches it.
 *
 * Saving a share while NFS is stopped offers to start it; the card header
 * starts and stops it outright; and each row has a switch of its own that
 * turns one share off without touching the service. All of it is global state,
 * so the service goes back to stopped whatever a test did.
 */
import {
  ensureNfsServiceStopped, ensureNfsShareAbsent, ensureNfsSharePresent, findNfsShare, nfsServiceName,
} from '../fixtures/nfs';
import { queryService } from '../fixtures/services';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { goToDatasets, goToShares } from '../flows/navigation';
import {
  fillNfsSharePath, openAddNfsShareForm, saveNfsShareFormAndStartService, toggleNfsShareEnabled,
} from '../flows/nfs';
import { formSettleTimeoutMs } from '../flows/smb';
import { nfsLocators } from '../locators/nfs';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Exported over the API, for the switches to act on. */
const toggledDataset = 'e2e_service_nfs_toggle';
/** Exported through the form, by the test that accepts the start offer. */
const formDataset = 'e2e_service_nfs_form';

const allDatasets = [toggledDataset, formDataset];

/** How long the service may take to change state — a job, not a call. */
const serviceChangeTimeoutMs = 90_000;

/**
 * Preconditions are *established* here, not asserted in the tests.
 *
 * Stopped, and not starting at boot: every test below begins from a stopped
 * service, and two of them assert what a start did to the boot flag.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const dataset of allDatasets) {
    await ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${dataset}`));
    await ensureDatasetPresent(api, `${pool}/${dataset}`);
  }
  await ensureNfsSharePresent(api, { path: datasetMountPath(`${pool}/${toggledDataset}`) });

  await ensureNfsServiceStopped(api);
});

/** The service first, then what it served, then the storage under that. */
test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the NFS shares on, and datasets ${allDatasets.join(' and ')} under "${pool}", and NFS as the test left it`)) {
    return;
  }

  await runCleanupSteps([
    ['stop the NFS service', () => ensureNfsServiceStopped(api)],
    ...allDatasets.flatMap((dataset): [string, () => Promise<void>][] => [
      [`remove the share on ${dataset}`, () => ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${dataset}`))],
      [`remove dataset ${dataset}`, () => ensureDatasetAbsent(api, `${pool}/${dataset}`)],
    ]),
  ]);
});

test('accepting the offer after a save starts the service', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${formDataset}`);

  await openAddNfsShareForm(page);
  await fillNfsSharePath(page, path);
  await saveNfsShareFormAndStartService(page);

  // A share on a stopped service is configuration that exports nothing, so
  // "the share was saved" is only half of what the admin was promised.
  expect(await findNfsShare(api, path)).toBeDefined();
  await expect
    .poll(async () => (await queryService(api, nfsServiceName))?.state, { timeout: serviceChangeTimeoutMs })
    .toBe('RUNNING');

  // The dialog's "start automatically" toggle is on as it opens, and the flow
  // leaves it alone — so the start is also a start at every boot. That is the
  // difference between this and the card's switch, which the last test pins
  // from the other side.
  await expect.poll(async () => (await queryService(api, nfsServiceName))?.enable).toBe(true);

  await expect(page.locator(nfsLocators.card.serviceStatus))
    .toHaveText('Running', { timeout: formSettleTimeoutMs });
});

test('switching a share off from the list reaches the appliance', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${toggledDataset}`);
  expect((await findNfsShare(api, path))?.enabled).toBe(true);

  await goToShares(page);
  await toggleNfsShareEnabled(page, { path });

  // A switch is the easiest control in the app to leave purely cosmetic — it
  // moves on click whether or not anything was written. The appliance is the
  // only place that can say otherwise.
  await expect.poll(async () => (await findNfsShare(api, path))?.enabled).toBe(false);

  // Left and come back to, rather than clicking the same switch twice.
  // `onChangeEnabledState` computes the new value from the row it was handed
  // (`!row.enabled`), so a second click against a row the card has not reloaded
  // writes the value that is already there. Leaving the page destroys the card,
  // so the row that comes back is one it has rebuilt.
  await goToDatasets(page);
  await goToShares(page);
  await toggleNfsShareEnabled(page, { path });
  await expect.poll(async () => (await findNfsShare(api, path))?.enabled).toBe(true);

  // A share's own switch is not the service's: it was stopped, and still is.
  expect((await queryService(api, nfsServiceName))?.state).toBe('STOPPED');
});

test('the switch on the card starts the service and stops it again', async ({ page, api }) => {
  await goToShares(page);
  await expect(page.locator(nfsLocators.card.serviceStatus))
    .toHaveText('Stopped', { timeout: formSettleTimeoutMs });

  await page.locator(nfsLocators.card.serviceToggle).click();

  await expect
    .poll(async () => (await queryService(api, nfsServiceName))?.state, { timeout: serviceChangeTimeoutMs })
    .toBe('RUNNING');
  // Waited for before the second click, and not only as an assertion: the
  // switch decides between start and stop from the state the card holds, so
  // clicking it again before the card has heard about the start asks for another.
  await expect(page.locator(nfsLocators.card.serviceStatus)).toHaveText('Running');

  // The switch is on and off, not enabled at boot. `service.update` is a
  // different control, and a start from here must not turn into one.
  expect((await queryService(api, nfsServiceName))?.enable).toBe(false);

  await page.locator(nfsLocators.card.serviceToggle).click();

  await expect
    .poll(async () => (await queryService(api, nfsServiceName))?.state, { timeout: serviceChangeTimeoutMs })
    .toBe('STOPPED');
  await expect(page.locator(nfsLocators.card.serviceStatus)).toHaveText('Stopped');
});
