/**
 * Story: what the NFS share form accepts, what it refuses, and what the
 * appliance is left holding afterwards.
 *
 * An export is a path plus who may reach it, and most of the second half never
 * appears on the card: read-only, the networks and the hosts are only visible
 * by opening the share again. So saves are asserted through
 * `sharing.nfs.query`. Every save declines the offer to start NFS, because
 * service state is global.
 */
import { ensureNfsServiceStopped, ensureNfsShareAbsent, findNfsShare } from '../fixtures/nfs';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  addNfsHost, addNfsNetwork, fillNfsSharePath, openAddNfsShareForm, saveNfsShareForm, showNfsAdvancedOptions,
} from '../flows/nfs';
import { formSettleTimeoutMs } from '../flows/smb';
import { nfsLocators } from '../locators/nfs';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The dataset every share here exports. Shared through the form, never over the API. */
const datasetName = 'e2e_form_nfs_ds';

/**
 * Documentation ranges (RFC 5737), so nothing here can name a real client.
 *
 * Two of them, so the host sits outside the network: an allow-list that names
 * the same client twice is its own question, and not the one asked here. The
 * host is an address rather than a name because middleware resolves a hostname
 * before it will save one, and refuses a name it cannot look up.
 */
const network = { address: '192.0.2.0', prefixBits: 24, cidr: '192.0.2.0/24' } as const;
const host = '198.51.100.10';

test.beforeEach(async ({ api, pool }) => {
  await ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${datasetName}`));
  await ensureDatasetPresent(api, `${pool}/${datasetName}`);

  // Established, not assumed. Every save here answers the *start* offer, and
  // that offer only exists while the service is stopped — running, the panel
  // just closes and `saveNfsShareForm` would wait out a dialog that never
  // renders. An interrupted run of `nfs-service.e2e.ts` is all it takes.
  await ensureNfsServiceStopped(api);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the NFS share on, and dataset "${pool}/${datasetName}"`)) {
    return;
  }

  await runCleanupSteps([
    ['remove the share', () => ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${datasetName}`))],
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, `${pool}/${datasetName}`)],
  ]);
});

test('an admin exports a path, and the appliance really has the share', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);
  const description = 'Shared from the form';

  await openAddNfsShareForm(page);
  await fillNfsSharePath(page, path);
  await page.locator(nfsLocators.form.comment).fill(description);
  await saveNfsShareForm(page);

  await expect(page.locator(nfsLocators.card.row(path, description)))
    .toBeVisible({ timeout: formSettleTimeoutMs });

  const saved = await findNfsShare(api, path);
  expect(saved).toBeDefined();
  expect(saved).toMatchObject({
    path,
    comment: description,
    enabled: true,
    // Never touched on screen, and all of them widen or narrow who can reach
    // the export. A form that submitted anything but its untouched defaults
    // here would be restricting — or opening — a share nobody asked it to.
    ro: false,
    networks: [],
    hosts: [],
  });
});

test('an export can be made read-only and limited to a network and a host', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);

  await openAddNfsShareForm(page);
  await fillNfsSharePath(page, path);

  // Read Only lives in the Access section, which does not exist until the form
  // is in advanced mode.
  await expect(page.locator(nfsLocators.form.readOnly)).toBeHidden();
  await showNfsAdvancedOptions(page);
  await page.locator(nfsLocators.form.readOnly).click();

  // One entry in each list, on purpose. They are separate form arrays that
  // number their controls the same way, so a form that crossed them over would
  // still save — with the host filed as a network, or the reverse.
  await addNfsNetwork(page, { index: 0, ...network });
  await addNfsHost(page, { index: 0, host });
  await saveNfsShareForm(page);

  // None of this is on the card, so the appliance is the only witness. The
  // network is the interesting one: it is entered as two controls and stored as
  // one string, so `192.0.2.0` arriving without its `/24` would be a different
  // — and wide open — allow-list.
  const saved = await findNfsShare(api, path);
  expect(saved).toMatchObject({
    path, ro: true, networks: [network.cidr], hosts: [host],
  });
});

test('the form will not export a pool\'s root dataset', async ({ page, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);
  const save = page.locator(nfsLocators.form.save);

  await openAddNfsShareForm(page);

  // A child dataset first, and Save proven live on it — the form opens with an
  // empty required path, so asserting the refusal straight away would pass
  // without the validator having run at all.
  await fillNfsSharePath(page, path);
  await expect(save).toBeEnabled();
  await expect(page.locator(nfsLocators.form.pathErrors)).toBeHidden();

  await fillNfsSharePath(page, datasetMountPath(pool));
  await expect(page.locator(nfsLocators.form.pathErrors))
    .toContainText('Sharing root datasets is not recommended');
  await expect(save).toBeDisabled();

  // And it is a refusal of that path, not a form left stuck.
  await fillNfsSharePath(page, path);
  await expect(page.locator(nfsLocators.form.pathErrors)).toBeHidden();
  await expect(save).toBeEnabled();
});

test('the form will not save a network that is not an address', async ({ page, pool }) => {
  const save = page.locator(nfsLocators.form.save);
  const address = page.locator(nfsLocators.form.networkAddress(0));

  await openAddNfsShareForm(page);
  await fillNfsSharePath(page, datasetMountPath(`${pool}/${datasetName}`));
  await expect(save).toBeEnabled();

  // Adding a network makes the form incomplete by itself: the new entry is
  // required. So the valid one goes in first, and Save comes back.
  await addNfsNetwork(page, { index: 0, ...network });
  await expect(save).toBeEnabled();

  // What is refused goes into `/etc/exports`, where a malformed network is not
  // a typo but a share that fails to export. The message is shown once the
  // field has been left, hence the blur.
  await address.fill('not-an-address');
  await address.blur();
  await expect(page.locator(nfsLocators.form.networkField(0))).toContainText('Invalid IP address');
  await expect(save).toBeDisabled();

  await address.fill(network.address);
  await expect(page.locator(nfsLocators.form.networkField(0))).not.toContainText('Invalid IP address');
  await expect(save).toBeEnabled();
});
