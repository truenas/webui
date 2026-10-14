/**
 * Stories: an admin sets, changes and removes a user quota and a group quota on a dataset, and the
 * appliance holds what they did.
 *
 * The two pages are one component routed twice, so each story runs once per kind. Every change is
 * asserted on the page and through `pool.dataset.get_quota`. The API check is the stronger one: the
 * data quota is typed as `1 GiB` and has to reach middleware as a byte count.
 *
 * Changing and removing each act beside a bystander with a quota of its own, which must come
 * through untouched. Both are reached from a row's own buttons, so a row bug would act on the wrong
 * principal and still look right on screen.
 *
 * Quotas live on a dataset of the spec's own, so deleting the dataset is the teardown for all of
 * them.
 */
import { ensureGroupAbsent, ensureGroupPresent } from '../fixtures/groups';
import { findQuota, setQuota, type QuotaKind } from '../fixtures/quotas';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import {
  fillQuotas, openAddQuotaForm, openEditQuotaForm, openQuotasPage, saveQuotaForm,
} from '../flows/quotas';
import { confirmDialogLocators } from '../locators/dialogs';
import { quotaLocators } from '../locators/quotas';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const mib = 1024 * 1024;
const gib = 1024 * mib;

/** Under the shared pool. Every quota here is set on it. */
const datasetLeaf = 'e2e_quotas';

/** What the change and remove stories provision for both principals before the UI acts. */
const provisioned = { bytes: 512 * mib, objects: 500 };

interface Principals {
  /** The user or group the UI acts on. */
  target: string;
  /** Given a quota of its own where a story acts beside it. Nothing here may change that quota. */
  bystander: string;
  ensurePresent: (api: E2eApiClient, name: string) => Promise<void>;
  ensureAbsent: (api: E2eApiClient, name: string) => Promise<void>;
}

/**
 * Both made over the API. Neither group shares a name with a user, because each user is created
 * with a primary group of its own name.
 */
const principals: Record<QuotaKind, Principals> = {
  user: {
    target: 'e2e_quota_user',
    bystander: 'e2e_quota_user_bystander',
    ensurePresent: ensureUserPresent,
    ensureAbsent: ensureUserAbsent,
  },
  group: {
    target: 'e2e_quota_group',
    bystander: 'e2e_quota_group_bystander',
    ensurePresent: ensureGroupPresent,
    ensureAbsent: ensureGroupAbsent,
  },
};

for (const kind of ['user', 'group'] as const) {
  const {
    target, bystander, ensurePresent, ensureAbsent,
  } = principals[kind];

  test.describe(`${kind} quotas`, () => {
    test.beforeEach(async ({ api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      await ensureDatasetAbsent(api, dataset);
      await ensureDatasetPresent(api, dataset);
      await ensurePresent(api, target);
      await ensurePresent(api, bystander);
    });

    test.afterEach(async ({ api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      if (leavingTestData(`the dataset "${dataset}" and the ${kind}s ${target}, ${bystander}`)) {
        return;
      }

      await runCleanupSteps([
        [`remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset)],
        [`remove the ${kind} "${target}"`, () => ensureAbsent(api, target)],
        [`remove the ${kind} "${bystander}"`, () => ensureAbsent(api, bystander)],
      ]);
    });

    test(`an admin sets a ${kind} quota, and the appliance holds it`, async ({ page, api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;

      await openQuotasPage(page, dataset, kind);
      await openAddQuotaForm(page, kind, target);
      await fillQuotas(page, { dataQuota: '1 GiB', objectQuota: 1000 });
      await saveQuotaForm(page);

      await expect(page.locator(quotaLocators.list.objectQuota(kind, target))).toHaveText('1000');
      expect(await findQuota(api, dataset, kind, target)).toMatchObject({ quota: gib, obj_quota: 1000 });
    });

    test(`an admin changes the ${kind} quota that was picked`, async ({ page, api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      await setQuota(api, dataset, kind, target, provisioned);
      await setQuota(api, dataset, kind, bystander, provisioned);

      await openQuotasPage(page, dataset, kind);
      await openEditQuotaForm(page, kind, target);
      await fillQuotas(page, { dataQuota: '2 GiB', objectQuota: 2000 });
      await saveQuotaForm(page);

      await expect(page.locator(quotaLocators.list.objectQuota(kind, target))).toHaveText('2000');
      expect(await findQuota(api, dataset, kind, target)).toMatchObject({ quota: 2 * gib, obj_quota: 2000 });
      expect(await findQuota(api, dataset, kind, bystander)).toMatchObject({
        quota: provisioned.bytes, obj_quota: provisioned.objects,
      });
    });

    test(`an admin removes the ${kind} quota that was picked`, async ({ page, api, pool }) => {
      const dataset = `${pool}/${datasetLeaf}`;
      await setQuota(api, dataset, kind, target, provisioned);
      await setQuota(api, dataset, kind, bystander, provisioned);

      await openQuotasPage(page, dataset, kind);
      // Seen first, so that its going away below is the deletion and not a list still loading.
      await expect(page.locator(quotaLocators.list.row(kind, target))).toBeVisible();

      await page.locator(quotaLocators.list.delete(kind, target)).click();
      await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
      await page.locator(confirmDialogLocators.confirm).click();

      // The list reloads only after middleware has answered, and shows only quotas that are set.
      await expect(page.locator(quotaLocators.list.row(kind, target))).toBeHidden();
      await expect(page.locator(quotaLocators.list.row(kind, bystander))).toBeVisible();

      // Removing writes both quotas back to zero, which middleware may list or leave out.
      const removed = await findQuota(api, dataset, kind, target);
      expect({ quota: removed?.quota ?? 0, obj_quota: removed?.obj_quota ?? 0 }).toEqual({ quota: 0, obj_quota: 0 });
      expect(await findQuota(api, dataset, kind, bystander)).toMatchObject({
        quota: provisioned.bytes, obj_quota: provisioned.objects,
      });
    });
  });
}
