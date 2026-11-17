/**
 * Story: an admin stops, starts and deletes several installed apps from the bulk bar, and deletes several
 * container images from Manage Container Images. Stop/Start All Selected clear the selection and show their
 * snackbar before any job ends, so tests wait on row states and every job dialog closing, never the snackbar.
 * Apps are BusyBox custom apps `e2e-bulk-a`, `e2e-bulk-b` and bystander `e2e-bulk-keep` on the shared `e2e_apps`
 * pool. Teardown deletes apps with images kept, since the others may share one; BusyBox goes after the last test.
 * Update All Selected is `apps-bulk-update.e2e.ts`.
 */
import type { Page } from '@playwright/test';
import {
  appInstallTimeoutMs,
  ensureAppAbsent,
  findAppStartJobIds,
  readAppState,
  seedCustomApp,
} from '../fixtures/apps';
import { ensureImageAbsent, ensureImagePresent, findImageId } from '../fixtures/container-images';
import { openAppsBulkMenu } from '../flows/apps';
import { confirmBatchImageDelete, goToContainerImages, openBatchImageDelete } from '../flows/container-images';
import { goToApps } from '../flows/navigation';
import { selectRow } from '../flows/table';
import {
  appDeleteDialogLocators, installedAppLocators, installedAppRowTag, installedAppsBulkLocators,
} from '../locators/apps';
import {
  containerImageRowTag, containerImagesLocators, deleteImageDialogLocators,
} from '../locators/container-images';
import { jobDialogLocators } from '../locators/encryption';
import type { E2eApiClient } from '../support/api/client';
import { type CleanupStep, leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { slowCallTimeoutMs } from '../support/timeouts';

/** Acted on. They sort before the bystander, and in this order. */
const appA = 'e2e-bulk-a';
const appB = 'e2e-bulk-b';
/** Running throughout, and never ticked unless a test says so. */
const bystander = 'e2e-bulk-keep';
const apps = [appA, appB, bystander];

/** What every app runs, and the image a running app holds in use. */
const sharedImage = 'ghcr.io/containerd/busybox:1.36';
/** Pulled per test, used by nothing, and different images from `sharedImage`. */
const extraImageA = 'ghcr.io/containerd/busybox:1.28';
const extraImageB = 'ghcr.io/containerd/alpine:3.14.0';
const extraImages = [extraImageA, extraImageB];

const compose = [
  'services:',
  '  e2e:',
  `    image: ${sharedImage}`,
  '    pull_policy: never',
  '    command: sleep infinity',
  '',
].join('\n');

/**
 * Apps on a pool the suite did not make is somebody's. Moving Apps off it onto the shared pool would
 * stop their apps, so `appsPool.ensure` leaves it and the spec does not run there. On the CI
 * appliance Apps has no pool.
 */
let appsOnSomebodyElsesPool = false;

/** Deletes the three apps, keeping their images, which another of them may still run. */
function deleteAppsSteps(api: E2eApiClient): CleanupStep[] {
  return apps.map((name) => [`delete app "${name}"`, () => ensureAppAbsent(api, name, { keepImages: true })]);
}

function deleteImagesSteps(api: E2eApiClient, repoTags: string[]): CleanupStep[] {
  return repoTags.map((repoTag) => [`delete image "${repoTag}"`, () => ensureImageAbsent(api, repoTag)]);
}

async function seedApps(api: E2eApiClient): Promise<void> {
  for (const name of apps) {
    await seedCustomApp(api, name, compose);
  }
}

/** The image's id, which must be there: its row and its line in the dialog are keyed by it. */
async function requireImageId(api: E2eApiClient, repoTag: string): Promise<string> {
  const id = await findImageId(api, repoTag);
  if (id === undefined) {
    throw new Error(`image "${repoTag}" is not on the appliance after its pull`);
  }
  return id;
}

/** Waits until every job progress dialog the bulk action stacked up has closed. */
async function expectJobDialogsClosed(page: Page): Promise<void> {
  await expect(page.locator(jobDialogLocators.title)).toHaveCount(0, { timeout: appInstallTimeoutMs });
}

test.beforeAll(async ({ api, appsPool }) => {
  appsOnSomebodyElsesPool = !(await appsPool.ensure());
  if (appsOnSomebodyElsesPool) {
    return;
  }

  // What a run of this spec left on the shared pool, if its cleanup failed.
  await runCleanupSteps([
    ...deleteAppsSteps(api),
    ...deleteImagesSteps(api, [...extraImages, sharedImage]),
  ]);
  await ensureImagePresent(api, sharedImage);
});

test.beforeEach(async ({ api }) => {
  // Apps on another pool is a developer's own setup, which moving Apps onto `e2e_apps` would stop.
  test.skip(appsOnSomebodyElsesPool, 'Apps already use a pool the suite did not create.');

  await runCleanupSteps([...deleteAppsSteps(api), ...deleteImagesSteps(api, extraImages)]);
});

test.afterEach(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`apps ${apps.join(', ')} and images ${extraImages.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([...deleteAppsSteps(api), ...deleteImagesSteps(api, extraImages)]);
});

test.afterAll(async ({ api }) => {
  if (appsOnSomebodyElsesPool || leavingTestData(`apps ${apps.join(', ')} and image "${sharedImage}"`)) {
    return;
  }

  await runCleanupSteps([
    ...deleteAppsSteps(api),
    ...deleteImagesSteps(api, [...extraImages, sharedImage]),
  ]);
});

test('an admin stops two apps and starts them again from the bulk actions, and the third is untouched', async ({
  page,
  api,
}) => {
  await seedApps(api);

  await goToApps(page);
  for (const name of apps) {
    await expect(page.locator(installedAppLocators(name).state)).toHaveText('Running', { timeout: appInstallTimeoutMs });
  }
  // The starting state the ticks have to change.
  await expect(page.locator(installedAppsBulkLocators.menu)).toBeHidden();

  await selectRow(page, installedAppRowTag(appA));
  await selectRow(page, installedAppRowTag(appB));
  await expect(page.locator(installedAppsBulkLocators.selectedCount)).toHaveText('2');

  await openAppsBulkMenu(page);
  // Both ticked apps run, so there is nothing to start.
  await expect(page.locator(installedAppsBulkLocators.startSelected)).toBeDisabled();
  await page.locator(installedAppsBulkLocators.stopSelected).click();

  await expect(page.locator(installedAppLocators(appA).state)).toHaveText('Stopped', { timeout: appInstallTimeoutMs });
  await expect(page.locator(installedAppLocators(appB).state)).toHaveText('Stopped', { timeout: appInstallTimeoutMs });
  await expectJobDialogsClosed(page);
  await expect(page.locator(installedAppLocators(bystander).state)).toHaveText('Running');
  await expect(page.locator(installedAppsBulkLocators.menu)).toBeHidden();
  expect(await readAppState(api, appA)).toBe('STOPPED');
  expect(await readAppState(api, appB)).toBe('STOPPED');
  expect(await readAppState(api, bystander)).toBe('RUNNING');

  // Start All Selected starts only the stopped apps in the selection, so the bystander, ticked and
  // running, must gain no `app.start` job of its own.
  const bystanderStartsBefore = await findAppStartJobIds(api, bystander);
  const startsBefore = [...await findAppStartJobIds(api, appA), ...await findAppStartJobIds(api, appB)];

  for (const name of apps) {
    await selectRow(page, installedAppRowTag(name));
  }
  await expect(page.locator(installedAppsBulkLocators.selectedCount)).toHaveText('3');
  await openAppsBulkMenu(page);
  await expect(page.locator(installedAppsBulkLocators.startSelected)).toBeEnabled();
  await page.locator(installedAppsBulkLocators.startSelected).click();

  for (const name of apps) {
    await expect(page.locator(installedAppLocators(name).state)).toHaveText('Running', { timeout: appInstallTimeoutMs });
  }
  await expectJobDialogsClosed(page);
  await expect.poll(
    () => readAppState(api, appA),
    { message: `app "${appA}" should run again`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
  await expect.poll(
    () => readAppState(api, appB),
    { message: `app "${appB}" should run again`, timeout: appInstallTimeoutMs },
  ).toBe('RUNNING');
  // The two stopped apps did get a start of their own, so the bystander's empty answer below means
  // something.
  const startsAfter = [...await findAppStartJobIds(api, appA), ...await findAppStartJobIds(api, appB)];
  expect(startsAfter.filter((id) => !startsBefore.includes(id))).toHaveLength(2);
  expect(await findAppStartJobIds(api, bystander)).toEqual(bystanderStartsBefore);
});

test('an admin deletes two apps at once, and the bystander stays', async ({ page, api }) => {
  await seedApps(api);

  await goToApps(page);
  for (const name of apps) {
    await expect(page.locator(installedAppLocators(name).state)).toHaveText('Running', { timeout: appInstallTimeoutMs });
  }

  // Ticked in the opposite order to the table's, which is the order the dialog names them in.
  await selectRow(page, installedAppRowTag(appB));
  await selectRow(page, installedAppRowTag(appA));
  await openAppsBulkMenu(page);
  await page.locator(installedAppsBulkLocators.deleteSelected).click();

  const bothNames = `${appA}, ${appB}`;
  const deleteButton = page.locator(appDeleteDialogLocators.delete);
  await expect(page.locator(appDeleteDialogLocators.title)).toHaveText(`Delete application ${bothNames}`);
  await page.locator(appDeleteDialogLocators.confirmName).fill(appA);
  await expect(deleteButton).toBeDisabled();
  await page.locator(appDeleteDialogLocators.confirmName).fill(bothNames);
  await expect(deleteButton).toBeEnabled();
  await expect(page.locator(appDeleteDialogLocators.removeVolumes)).toBeHidden();
  // The bystander runs the same image, so it stays.
  await page.locator(appDeleteDialogLocators.removeImages).uncheck();
  await expect(page.locator(appDeleteDialogLocators.removeImages)).not.toBeChecked();
  await deleteButton.click();

  await expect(page.locator(appDeleteDialogLocators.title)).toBeHidden();
  await expectJobDialogsClosed(page);
  await expect(page.locator(installedAppLocators(appA).row)).toBeHidden({ timeout: appInstallTimeoutMs });
  await expect(page.locator(installedAppLocators(appB).row)).toBeHidden({ timeout: appInstallTimeoutMs });
  await expect(page.locator(installedAppLocators(bystander).state)).toHaveText('Running');
  await expect(page.locator(installedAppsBulkLocators.menu)).toBeHidden();

  expect(await readAppState(api, appA)).toBe('ABSENT');
  expect(await readAppState(api, appB)).toBe('ABSENT');
  expect(await readAppState(api, bystander)).toBe('RUNNING');
  expect(await findImageId(api, sharedImage)).toBeDefined();
});

test('an admin deletes two unused container images at once, and the image in use stays', async ({ page, api }) => {
  await seedCustomApp(api, bystander, compose);
  for (const repoTag of extraImages) {
    await ensureImagePresent(api, repoTag);
  }
  const idA = await requireImageId(api, extraImageA);
  const idB = await requireImageId(api, extraImageB);
  const ids = [idA, idB];
  const sharedId = await requireImageId(api, sharedImage);

  await goToApps(page);
  await goToContainerImages(page);
  for (const id of [...ids, sharedId]) {
    await expect(page.locator(containerImagesLocators.image(id).tags)).toBeVisible();
  }

  for (const id of ids) {
    await selectRow(page, containerImageRowTag(id));
  }
  await openBatchImageDelete(page);

  await expect(page.locator(deleteImageDialogLocators.message)).toContainText('2 docker images will be deleted');
  await expect(page.locator(deleteImageDialogLocators.item(idA))).toHaveText(extraImageA);
  await expect(page.locator(deleteImageDialogLocators.item(idB))).toHaveText(extraImageB);
  await expect(page.locator(deleteImageDialogLocators.force)).not.toBeChecked();
  await confirmBatchImageDelete(page);

  // More than one image, so the dialog stays and reports.
  await expect(page.locator(deleteImageDialogLocators.deletedCount)).toHaveText(
    /^\s*2 docker images (has|have) been deleted\.\s*$/,
  );
  await expect(page.locator(deleteImageDialogLocators.failedCount)).toBeHidden();
  await page.locator(deleteImageDialogLocators.close).click();
  await expect(page.locator(deleteImageDialogLocators.title)).toBeHidden();

  for (const id of ids) {
    await expect(page.locator(containerImagesLocators.image(id).tags)).toBeHidden({ timeout: slowCallTimeoutMs });
  }
  await expect(page.locator(containerImagesLocators.image(sharedId).tags)).toBeVisible();

  expect(await findImageId(api, extraImageA)).toBeUndefined();
  expect(await findImageId(api, extraImageB)).toBeUndefined();
  expect(await findImageId(api, sharedImage)).toBe(sharedId);
  expect(await readAppState(api, bystander)).toBe('RUNNING');
});

test('the batch delete refuses the image a running app uses, and deletes the rest', async ({ page, api }) => {
  await seedCustomApp(api, bystander, compose);
  const extraImage = extraImageA;
  await ensureImagePresent(api, extraImage);
  const extraId = await requireImageId(api, extraImage);
  const sharedId = await requireImageId(api, sharedImage);

  await goToApps(page);
  await goToContainerImages(page);
  await expect(page.locator(containerImagesLocators.image(extraId).tags)).toBeVisible();

  await selectRow(page, containerImageRowTag(extraId));
  await selectRow(page, containerImageRowTag(sharedId));
  await openBatchImageDelete(page);
  await expect(page.locator(deleteImageDialogLocators.force)).not.toBeChecked();
  await confirmBatchImageDelete(page);

  await expect(page.locator(deleteImageDialogLocators.failedCount)).toHaveText(
    /^\s*Warning: 1 of 2 docker images could not be deleted\.\s*$/,
  );
  await expect(page.locator(deleteImageDialogLocators.deletedCount)).toHaveText(
    /^\s*1 docker image has been deleted\.\s*$/,
  );
  await page.locator(deleteImageDialogLocators.close).click();
  await expect(page.locator(deleteImageDialogLocators.title)).toBeHidden();

  await expect(page.locator(containerImagesLocators.image(extraId).tags)).toBeHidden({ timeout: slowCallTimeoutMs });
  await expect(page.locator(containerImagesLocators.image(sharedId).tags)).toBeVisible();

  expect(await findImageId(api, extraImage)).toBeUndefined();
  expect(await findImageId(api, sharedImage)).toBe(sharedId);
  expect(await readAppState(api, bystander)).toBe('RUNNING');
});
