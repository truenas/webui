/**
 * Stories: the NFS share form's advanced Access section — who a client's
 * requests are mapped to, and which security flavours the export accepts.
 *
 * None of it is on the card, so every save is asserted through
 * `sharing.nfs.query`. Maproot and mapall get a test each because middleware
 * refuses a share that sets both users. Security exists only while the NFS
 * service offers NFSv4, so the protocols are part of each test's precondition,
 * and teardown writes back whatever the service offered before this file ran.
 */
import {
  ensureNfsServiceStopped, ensureNfsShareAbsent, findNfsShare, nfsServiceName, readNfsProtocols, setNfsProtocols,
  type NfsProtocols,
} from '../fixtures/nfs';
import { queryService } from '../fixtures/services';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  enableNfsProtocolFromCard, fillNfsSharePath, openAddNfsShareForm, pickNfsMappingPrincipal, pickNfsSecurity,
  saveNfsShareForm, showNfsAdvancedOptions,
} from '../flows/nfs';
import { formSettleTimeoutMs } from '../flows/smb';
import { nfsLocators } from '../locators/nfs';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The dataset every share here exports. Shared through the form, never over the API. */
const datasetName = 'e2e_access_nfs_ds';

/**
 * Built-in accounts, so nothing has to be created for a share to name them.
 * Middleware looks each one up before it saves, and refuses a name it cannot find.
 */
const maproot = { user: 'root', group: 'wheel' } as const;
const mapall = { user: 'nobody', group: 'nogroup' } as const;

/** What the service offered before this file ran, and therefore what `afterEach` writes back. */
let foundProtocols: NfsProtocols | undefined;

test.beforeAll(async ({ api }) => {
  foundProtocols = await readNfsProtocols(api);
});

test.beforeEach(async ({ api, pool }) => {
  await ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${datasetName}`));
  await ensureDatasetPresent(api, `${pool}/${datasetName}`);

  // Every save here answers the start offer, which only exists while the
  // service is stopped — see `nfs-form.e2e.ts`.
  await ensureNfsServiceStopped(api);
});

/** The share before the protocols: a share with a Kerberos flavour is what needs NFSv4. */
test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the NFS share on, and dataset "${pool}/${datasetName}", and the NFS protocols`)) {
    return;
  }

  await runCleanupSteps([
    ['stop the NFS service', () => ensureNfsServiceStopped(api)],
    ['remove the share', () => ensureNfsShareAbsent(api, datasetMountPath(`${pool}/${datasetName}`))],
    ['restore the NFS protocols', async () => {
      // Guarded: if `beforeAll` threw, there is nothing known to write back.
      if (foundProtocols !== undefined) {
        await setNfsProtocols(api, foundProtocols);
      }
    }],
    [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, `${pool}/${datasetName}`)],
  ]);
});

test('a share saved with a maproot user and group has them on the appliance', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);

  await openAddNfsShareForm(page);
  await fillNfsSharePath(page, path);
  await showNfsAdvancedOptions(page);

  await pickNfsMappingPrincipal(page, {
    field: nfsLocators.form.maprootUser,
    options: nfsLocators.form.maprootUserOptions,
    option: nfsLocators.form.maprootUserOption(maproot.user),
    name: maproot.user,
  });
  await pickNfsMappingPrincipal(page, {
    field: nfsLocators.form.maprootGroup,
    options: nfsLocators.form.maprootGroupOptions,
    option: nfsLocators.form.maprootGroupOption(maproot.group),
    name: maproot.group,
  });
  await saveNfsShareForm(page);

  const saved = await findNfsShare(api, path);
  expect(saved).toMatchObject({ path, maproot_user: maproot.user, maproot_group: maproot.group });

  // Mapall is asserted unset as well: the four fields sit side by side and are
  // named alike, so a form that filed the pair under the other mapping would
  // still save — and would map every client's user, not only root. Unset rather
  // than `''`, because the form sends an empty string and middleware may keep null.
  expect(saved?.mapall_user).toBeFalsy();
  expect(saved?.mapall_group).toBeFalsy();
});

test('a share saved with a mapall user and group has those on the appliance', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);

  await openAddNfsShareForm(page);
  await fillNfsSharePath(page, path);
  await showNfsAdvancedOptions(page);

  await pickNfsMappingPrincipal(page, {
    field: nfsLocators.form.mapallUser,
    options: nfsLocators.form.mapallUserOptions,
    option: nfsLocators.form.mapallUserOption(mapall.user),
    name: mapall.user,
  });
  await pickNfsMappingPrincipal(page, {
    field: nfsLocators.form.mapallGroup,
    options: nfsLocators.form.mapallGroupOptions,
    option: nfsLocators.form.mapallGroupOption(mapall.group),
    name: mapall.group,
  });
  await saveNfsShareForm(page);

  const saved = await findNfsShare(api, path);
  expect(saved).toMatchObject({ path, mapall_user: mapall.user, mapall_group: mapall.group });

  // The mirror image of the maproot test's check, for the same reason.
  expect(saved?.maproot_user).toBeFalsy();
  expect(saved?.maproot_group).toBeFalsy();
});

test('with NFSv4 off, the share form has no Security select', async ({ page, api, pool }) => {
  await setNfsProtocols(api, ['NFSV3']);

  await openAddNfsShareForm(page);
  await fillNfsSharePath(page, datasetMountPath(`${pool}/${datasetName}`));
  await showNfsAdvancedOptions(page);

  // The rest of the Access section is there, so the section rendered and only
  // Security is missing. The next test is the counterpart: the same locator,
  // on the same form, once NFSv4 is on.
  await expect(page.locator(nfsLocators.form.mapallGroup)).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(nfsLocators.form.security)).toBeHidden();
});

test('turning NFSv4 on brings Security to the share form, and its flavours are saved', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${datasetName}`);
  await setNfsProtocols(api, ['NFSV3']);

  const service = await queryService(api, nfsServiceName);
  if (!service) {
    throw new Error('service.query returned no NFS row, so the card menu that opens its settings cannot be named.');
  }

  // Through the service settings, as an admin would: the share form offers
  // nothing that turns NFSv4 on, and says nothing about why Security is absent.
  await enableNfsProtocolFromCard(page, service.id, 'NFSV4');

  // Added to NFSv3, not swapped for it: the option is a toggle in a multiple select.
  await expect.poll(async () => [...await readNfsProtocols(api)].sort((a, b) => a.localeCompare(b)))
    .toEqual(['NFSV3', 'NFSV4']);

  await openAddNfsShareForm(page);
  await fillNfsSharePath(page, path);
  await showNfsAdvancedOptions(page);
  await expect(page.locator(nfsLocators.form.security)).toBeVisible({ timeout: formSettleTimeoutMs });

  // Two flavours, one of them Kerberos: middleware refuses a non-SYS flavour
  // unless NFSv4 is on, so KRB5 is only saved because the service change took.
  await pickNfsSecurity(page, ['SYS', 'KRB5']);
  await saveNfsShareForm(page);

  const saved = await findNfsShare(api, path);
  expect([...saved?.security ?? []].sort((a, b) => a.localeCompare(b))).toEqual(['KRB5', 'SYS']);
});
