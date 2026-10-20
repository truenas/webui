/**
 * Stories: an admin clears a user or group quota from its edit form, lists the principals with
 * no quota and filters them out again, removes the quotas a deleted user or group left behind,
 * and is refused a quota for a name that does not exist.
 *
 * `dataset-quotas.e2e.ts` covers add, edit with new values and the row's Delete. These are the
 * page's other paths, and each runs once per kind, as that spec does. Every change is asserted
 * on the page and through `pool.dataset.get_quota`.
 *
 * Quotas live on a dataset of the spec's own, so deleting the dataset is the teardown for all of
 * them. The principals are removed separately, including the one the invalid-quota story deletes
 * mid-test, which a failed run can leave behind.
 */
import { ensureGroupAbsent, ensureGroupPresent, findGroup } from '../fixtures/groups';
import {
  findQuota, findQuotaById, listQuotas, setQuota, type QuotaKind,
} from '../fixtures/quotas';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent, findUser } from '../fixtures/users';
import { selectDataset } from '../flows/encryption';
import {
  fillQuotas, openAddQuotaForm, openEditQuotaForm, openQuotasFromCard, openQuotasPage,
} from '../flows/quotas';
import { datasetCapacityLocators } from '../locators/dataset-capacity';
import { confirmDialogLocators } from '../locators/dialogs';
import { quotaLocators } from '../locators/quotas';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const mib = 1024 * 1024;

/** Under the shared pool, and not `dataset-quotas.e2e.ts`'s. Every quota here is set on it. */
const datasetLeaf = 'e2e_quotas_more';

/** What each story provisions for a principal before the UI acts. */
const provisioned = { bytes: 512 * mib, objects: 500 };

/** Saving the edit form or removing quotas waits on middleware, and the panel closes after it. */
const saveTimeoutMs = 90_000;

interface Principals {
  /** As the page and its dialogs spell the kind. */
  label: 'User' | 'Group';
  /** The user or group the UI acts on. */
  target: string;
  /** Given a quota of its own where a story acts beside it. Nothing here may change that quota. */
  bystander: string;
  /** Given a quota and then deleted, so its quota is left on an id that maps to no name. */
  gone: string;
  /** A name nothing on the appliance has. */
  nobody: string;
  ensurePresent: (api: E2eApiClient, name: string) => Promise<void>;
  ensureAbsent: (api: E2eApiClient, name: string) => Promise<void>;
  /** The uid or gid of `name`, which outlives it on the dataset's quotas. */
  idOf: (api: E2eApiClient, name: string) => Promise<number | undefined>;
}

/**
 * Made over the API, and sharing no prefix with `dataset-quotas.e2e.ts`'s. No group shares a name
 * with a user, because each user is created with a primary group of its own name.
 */
const principals: Record<QuotaKind, Principals> = {
  user: {
    label: 'User',
    target: 'e2e_qmore_user',
    bystander: 'e2e_qmore_user_bystander',
    gone: 'e2e_qmore_user_gone',
    nobody: 'e2e_qmore_user_nobody',
    ensurePresent: ensureUserPresent,
    ensureAbsent: ensureUserAbsent,
    idOf: async (api, name) => (await findUser(api, name))?.uid,
  },
  group: {
    label: 'Group',
    target: 'e2e_qmore_group',
    bystander: 'e2e_qmore_group_bystander',
    gone: 'e2e_qmore_group_gone',
    nobody: 'e2e_qmore_group_nobody',
    ensurePresent: ensureGroupPresent,
    ensureAbsent: ensureGroupAbsent,
    idOf: async (api, name) => (await findGroup(api, name))?.gid,
  },
};

for (const kind of ['user', 'group'] as const) {
  const {
    label, target, bystander, gone, nobody, ensurePresent, ensureAbsent, idOf,
  } = principals[kind];

  test.describe(`${kind} quotas, beyond add, edit and delete`, () => {
    test.beforeEach(async ({ api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      await ensureDatasetAbsent(api, dataset);
      // A failed run of the invalid-quota story can leave it, since that story deletes it mid-test.
      await ensureAbsent(api, gone);
      await ensureDatasetPresent(api, dataset);
      await ensurePresent(api, target);
      await ensurePresent(api, bystander);
    });

    test.afterEach(async ({ api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      if (leavingTestData(`the dataset "${dataset}" and the ${kind}s ${target}, ${bystander}, ${gone}`)) {
        return;
      }

      await runCleanupSteps([
        [`remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset)],
        [`remove the ${kind} "${target}"`, () => ensureAbsent(api, target)],
        [`remove the ${kind} "${bystander}"`, () => ensureAbsent(api, bystander)],
        [`remove the ${kind} "${gone}"`, () => ensureAbsent(api, gone)],
      ]);
    });

    test(`an admin clears both ${kind} quotas on the edit form, confirms, and the quota is removed`, async ({
      page, api, pool,
    }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      const { form } = quotaLocators;
      await setQuota(api, dataset, kind, target, provisioned);
      await setQuota(api, dataset, kind, bystander, provisioned);

      await selectDataset(page, dataset);
      await expect(page.locator(datasetCapacityLocators.card.quotas(kind))).toHaveText(`Quotas set for 2 ${kind}s`);
      await openQuotasFromCard(page, dataset, kind);

      await openEditQuotaForm(page, kind, target);
      await page.locator(form.dataQuota).fill('');
      await page.locator(form.objectQuota).fill('');
      await page.locator(form.save).click();

      // Clearing both is a deletion, so it asks first, and the box has to be ticked.
      await expect(page.locator(confirmDialogLocators.title)).toContainText(`Delete ${label} Quota`);
      await expect(page.locator(confirmDialogLocators.confirm)).toBeDisabled();
      await page.locator(confirmDialogLocators.cancel).click();

      // A cancelled confirm sends nothing and leaves the panel open.
      await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
      await expect(page.locator(form.save)).toBeVisible();
      expect(await findQuota(api, dataset, kind, target)).toMatchObject({
        quota: provisioned.bytes, obj_quota: provisioned.objects,
      });

      await page.locator(form.save).click();
      await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
      await page.locator(confirmDialogLocators.checkbox).click();
      await page.locator(confirmDialogLocators.confirm).click();

      await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
      await expect(page.locator(quotaLocators.list.row(kind, target))).toBeHidden();
      await expect(page.locator(quotaLocators.list.row(kind, bystander))).toBeVisible();

      // Clearing writes both quotas back to zero, which middleware may list or leave out.
      const removed = await findQuota(api, dataset, kind, target);
      expect({ quota: removed?.quota ?? 0, obj_quota: removed?.obj_quota ?? 0 }).toEqual({ quota: 0, obj_quota: 0 });
      expect(await findQuota(api, dataset, kind, bystander)).toMatchObject({
        quota: provisioned.bytes, obj_quota: provisioned.objects,
      });
    });

    test(`Show All lists ${kind}s with no quota, and switching it off filters them out again`, async ({
      page, api, pool,
    }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      const { list } = quotaLocators;
      await setQuota(api, dataset, kind, target, provisioned);

      // Middleware lists every id that owns something on the dataset, so a fresh one lists its
      // owner, root, with no quota. Whichever it lists is the row Show All has to bring in.
      const unquoted = (await listQuotas(api, dataset, kind))
        .find((quota) => quota.name && quota.name !== target && !quota.quota && !quota.obj_quota);
      if (!unquoted?.name) {
        throw new Error(`pool.dataset.get_quota lists no ${kind} without a quota on "${dataset}"`);
      }
      const other = unquoted.name;

      await openQuotasPage(page, dataset, kind);
      await expect(page.locator(list.row(kind, target))).toBeVisible();
      await expect(page.locator(list.row(kind, other))).toBeHidden();
      await expect(page.locator(list.showAllState(kind))).not.toBeChecked();

      await page.locator(list.showAll(kind)).click();
      await expect(page.locator(confirmDialogLocators.title)).toContainText(`Show All ${label}s`);
      await page.locator(confirmDialogLocators.cancel).click();
      await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
      await expect(page.locator(list.showAllState(kind))).not.toBeChecked();
      await expect(page.locator(list.row(kind, other))).toBeHidden();

      await page.locator(list.showAll(kind)).click();
      await expect(page.locator(confirmDialogLocators.title)).toContainText(`Show All ${label}s`);
      await page.locator(confirmDialogLocators.confirm).click();
      await expect(page.locator(list.row(kind, other))).toBeVisible();
      await expect(page.locator(list.row(kind, target))).toBeVisible();
      await expect(page.locator(list.showAllState(kind))).toBeChecked();

      await page.locator(list.showAll(kind)).click();
      await expect(page.locator(confirmDialogLocators.title)).toContainText(`Filter ${label}s`);
      await page.locator(confirmDialogLocators.confirm).click();
      await expect(page.locator(list.row(kind, other))).toBeHidden();
      await expect(page.locator(list.row(kind, target))).toBeVisible();
      await expect(page.locator(list.showAllState(kind))).not.toBeChecked();

      // Showing and filtering only read.
      expect(await findQuota(api, dataset, kind, target)).toMatchObject({
        quota: provisioned.bytes, obj_quota: provisioned.objects,
      });
    });

    test(`an admin removes the quotas left by a deleted ${kind}`, async ({ page, api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      const { list } = quotaLocators;
      await setQuota(api, dataset, kind, target, provisioned);
      await ensurePresent(api, gone);
      await setQuota(api, dataset, kind, gone, provisioned);
      const goneId = await idOf(api, gone);
      if (goneId === undefined) {
        throw new Error(`no id for the ${kind} "${gone}" just created`);
      }
      await ensureAbsent(api, gone);

      await openQuotasPage(page, dataset, kind);
      await expect(page.locator(list.unmappedRow(kind, goneId))).toBeVisible();
      await expect(page.locator(list.unmappedName(kind, goneId))).toHaveText('—');
      await expect(page.locator(list.row(kind, target))).toBeVisible();

      await page.locator(list.removeInvalid).click();
      await expect(page.locator(confirmDialogLocators.title)).toContainText('Remove Invalid Quotas');
      await expect(page.locator(confirmDialogLocators.confirm)).toBeDisabled();
      await page.locator(confirmDialogLocators.checkbox).click();
      await page.locator(confirmDialogLocators.confirm).click();

      await expect(page.locator(list.unmappedRow(kind, goneId))).toBeHidden({ timeout: saveTimeoutMs });
      // Fails while `checkInvalidQuotas()` keeps the ids it last saw when middleware answers with none.
      await expect(page.locator(list.removeInvalid)).toBeHidden();
      await expect(page.locator(list.row(kind, target))).toBeVisible();

      const removed = await findQuotaById(api, dataset, kind, goneId);
      expect({ quota: removed?.quota ?? 0, obj_quota: removed?.obj_quota ?? 0 }).toEqual({ quota: 0, obj_quota: 0 });
      expect(await findQuota(api, dataset, kind, target)).toMatchObject({
        quota: provisioned.bytes, obj_quota: provisioned.objects,
      });
    });

    test(`the add form refuses a ${kind} that does not exist`, async ({ page, api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      const { form } = quotaLocators;

      await openQuotasPage(page, dataset, kind);
      await openAddQuotaForm(page, kind, nobody);
      await fillQuotas(page, { dataQuota: '1 GiB', objectQuota: 1000 });

      // Save stays enabled while the existence check is pending, so the error is waited on first.
      await expect(page.locator(form.principalsField(kind))).toContainText(`${label} "${nobody}" does not exist`);
      await expect(page.locator(form.save)).toBeDisabled();

      // Enter in a field submits the form, which an invalid form must refuse.
      await page.locator(form.objectQuota).press('Enter');
      await expect(page.locator(form.save)).toBeVisible();

      const set = (await listQuotas(api, dataset, kind)).filter((quota) => quota.quota || quota.obj_quota);
      expect(set).toEqual([]);
    });
  });
}
