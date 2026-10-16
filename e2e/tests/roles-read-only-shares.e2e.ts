/**
 * Story: a read-only administrator sees the shares on the Shares dashboard's
 * SMB, NFS and iSCSI cards, and finds every control that would change one
 * locked: Add or Wizard, the service switch, the row's Enabled switch, Delete
 * in the row menu, and Save on the edit form. Nothing is changed afterwards.
 *
 * One test with a step per card, so the account signs in once: every sign-in
 * spends from the unauthenticated rate limit (see `flows/roles.ts`).
 *
 * Edit carries no role on these cards, so its form opens. The form is made
 * dirty and valid before Save is checked, so that Save can only be held down by
 * the role; `expectLockedByRole` also asks for the role-missing wrapper.
 *
 * Services are never started or stopped here. The admin only has to see the
 * switch, whatever its position, and each one's state is read before and after.
 */
import type { Page } from '@playwright/test';
import {
  ensureIscsiShareAbsent, ensureIscsiTargetPresent, findIscsiTarget, iscsiServiceName,
} from '../fixtures/iscsi';
import {
  ensureNfsShareAbsent, ensureNfsSharePresent, findNfsShare, nfsServiceName,
} from '../fixtures/nfs';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import { queryService } from '../fixtures/services';
import {
  ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare, smbServiceName,
} from '../fixtures/smb';
import {
  datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent, ensureSmbDatasetPresent,
} from '../fixtures/storage';
import { goToShares } from '../flows/navigation';
import { openEditNfsShareForm } from '../flows/nfs';
import { expectLockedByRole, signInAsRoleAdmin } from '../flows/roles';
import { formSettleTimeoutMs, openEditShareForm } from '../flows/smb';
import { confirmDialogLocators } from '../locators/dialogs';
import { iscsiLocators } from '../locators/iscsi';
import { nfsLocators } from '../locators/nfs';
import { servicesLocators } from '../locators/services';
import { smbLocators } from '../locators/smb';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const account = roleAdmins.readOnly;

// `e2e_roles_` sorts these together, ahead of most other leftovers: each card
// shows four rows by name or path, so a share sorted further down could fall off.
const smbShare = 'e2e_roles_smb';
const smbComment = 'Seeded for the read-only admin';
const nfsLeaf = 'e2e_roles_nfs';
const nfsComment = 'Seeded for the read-only admin';
const iscsiTarget = 'e2e-roles-target';

/** The three cards' services. */
const services = [smbServiceName, nfsServiceName, iscsiServiceName];

async function readServiceStates(api: E2eApiClient): Promise<(string | undefined)[]> {
  return Promise.all(services.map(async (service) => (await queryService(api, service))?.state));
}

/** Opens a row menu, checks its Delete is there and disabled, and closes the menu again. */
async function expectRowDeleteLocked(page: Page, menu: string, deleteItem: string): Promise<void> {
  await page.locator(menu).click();
  await expect(page.locator(deleteItem)).toBeVisible();
  // A menu item is drawn by `tn-menu`, outside the role-missing wrapper, so
  // `disabled` is all there is to check (see `roleLocators.missing`).
  await expect(page.locator(deleteItem)).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator(deleteItem)).toBeHidden();
}

/** Closes the edit panel, answering the unsaved-changes question, so nothing is saved. */
async function discardEditPanel(page: Page, field: string): Promise<void> {
  await page.locator(servicesLocators.closePanel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(field)).toBeHidden();
}

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

  test.beforeEach(async ({ api, pool }) => {
    const smbDataset = `${pool}/${smbShare}`;
    const nfsDataset = `${pool}/${nfsLeaf}`;

    await ensureRoleAdminAbsent(api, account);
    await ensureSmbShareAbsent(api, smbShare);
    await ensureNfsShareAbsent(api, datasetMountPath(nfsDataset));
    await ensureIscsiShareAbsent(api, iscsiTarget);

    await ensureSmbDatasetPresent(api, smbDataset);
    await ensureSmbSharePresent(api, { name: smbShare, path: datasetMountPath(smbDataset), comment: smbComment });
    await ensureDatasetPresent(api, nfsDataset);
    await ensureNfsSharePresent(api, { path: datasetMountPath(nfsDataset), comment: nfsComment });
    await ensureIscsiTargetPresent(api, iscsiTarget);
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api, pool }) => {
    const smbDataset = `${pool}/${smbShare}`;
    const nfsDataset = `${pool}/${nfsLeaf}`;
    if (leavingTestData(`user "${account.username}", its shares and datasets`)) {
      return;
    }

    // Shares before the datasets they point at, so nothing is left exporting a missing path.
    await runCleanupSteps([
      [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
      [`remove SMB share ${smbShare}`, () => ensureSmbShareAbsent(api, smbShare)],
      [`remove NFS share on ${nfsDataset}`, () => ensureNfsShareAbsent(api, datasetMountPath(nfsDataset))],
      [`remove iSCSI target ${iscsiTarget}`, () => ensureIscsiShareAbsent(api, iscsiTarget)],
      [`remove dataset ${smbDataset}`, () => ensureDatasetAbsent(api, smbDataset)],
      [`remove dataset ${nfsDataset}`, () => ensureDatasetAbsent(api, nfsDataset)],
    ]);
  });

  test('the SMB, NFS and iSCSI cards lock every control that changes a share', async ({ page, api, pool }) => {
    const nfsPath = datasetMountPath(`${pool}/${nfsLeaf}`);
    const servicesBefore = await readServiceStates(api);

    await signInAsRoleAdmin(page, account);
    await goToShares(page);

    await test.step('the SMB card', async () => {
      const { card, form } = smbLocators;
      await expect(page.locator(card.row(smbShare))).toBeVisible({ timeout: formSettleTimeoutMs });
      await expect(page.locator(card.description(smbShare))).toHaveText(smbComment);

      await expectLockedByRole(page, smbLocators.addShare);
      await expectLockedByRole(page, card.serviceToggle);
      await expectLockedByRole(page, card.enabledToggle(smbShare));
      await expectRowDeleteLocked(page, card.rowMenu(smbShare), card.rowMenuDelete(smbShare));

      await openEditShareForm(page, smbShare);
      await page.locator(form.comment).fill('Changed by the read-only admin');
      await expectLockedByRole(page, form.save);
      await discardEditPanel(page, form.name);

      const share = await findSmbShare(api, smbShare);
      expect(share).toMatchObject({ comment: smbComment, enabled: true });
    });

    await test.step('the NFS card', async () => {
      const { card, form } = nfsLocators;
      await expect(page.locator(card.row(nfsPath, nfsComment))).toBeVisible({ timeout: formSettleTimeoutMs });

      await expectLockedByRole(page, nfsLocators.addShare);
      await expectLockedByRole(page, card.serviceToggle);
      await expectLockedByRole(page, card.enabledToggle(nfsPath, nfsComment));
      await expectRowDeleteLocked(page, card.rowMenu(nfsPath, nfsComment), card.rowMenuDelete(nfsPath, nfsComment));

      await openEditNfsShareForm(page, { path: nfsPath, description: nfsComment });
      await page.locator(form.comment).fill('Changed by the read-only admin');
      await expectLockedByRole(page, form.save);
      await discardEditPanel(page, form.path);

      const share = await findNfsShare(api, nfsPath);
      expect(share).toMatchObject({ comment: nfsComment, enabled: true });
    });

    await test.step('the iSCSI card and the Targets page', async () => {
      const { card, targets } = iscsiLocators;
      await expect(page.locator(card.row(iscsiTarget))).toBeVisible({ timeout: formSettleTimeoutMs });

      await expectLockedByRole(page, card.wizard);
      await expectRowDeleteLocked(page, card.rowMenu(iscsiTarget), card.rowMenuDelete(iscsiTarget));

      await page.locator(card.open).click();
      await expect(page.locator(targets.row(iscsiTarget))).toBeVisible({ timeout: formSettleTimeoutMs });
      await expectLockedByRole(page, targets.add);

      expect(await findIscsiTarget(api, iscsiTarget)).toBeDefined();
    });

    expect(await readServiceStates(api)).toEqual(servicesBefore);
  });
});
