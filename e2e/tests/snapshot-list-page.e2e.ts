/**
 * Stories: the Snapshots page's own controls — Add in its header takes a snapshot, by a name or by a periodic
 * snapshot task's naming schema, and Show extra columns adds Used, Date created and Referenced, with the
 * snapshot's real values, and takes them away again.
 *
 * Reached by a dataset's "View Snapshots", so it lists that dataset's alone. Its Add, unlike the card's Take Snapshot
 * (`snapshot-create.e2e.ts`), chooses no dataset. Schemas come from periodic snapshot tasks, so one is seeded over
 * the API; Show extra columns is an account preference, so it is put back off around every test.
 */
import { readTimezone } from '../fixtures/localization';
import {
  establishPreferenceBaseline, type PreferencesBlob, readPreference, restorePreferences,
} from '../fixtures/preferences';
import { ensureSnapshotTaskPresent, ensureSnapshotTasksAbsent, monthlySchedule } from '../fixtures/snapshot-tasks';
import {
  ensureSnapshotPresent, ensureSnapshotsAbsent, findSnapshot, listSnapshots, readSnapshotColumnValues,
} from '../fixtures/snapshots';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { openAddSnapshotForm, openSnapshotList, saveSnapshotForm } from '../flows/snapshots';
import { selectOption } from '../flows/storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { snapshotLocators } from '../locators/snapshots';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const datasetName = 'e2e_snap_page';

/** Typed into the form by the name test; seeded over the API for the columns test. */
const snapshotName = 'e2e_snap_page_add';

/**
 * The seeded task's schema. Its snapshots are named when they are taken, in the appliance's local time, so the
 * test knows the shape of the name and not the name.
 */
const namingSchema = 'e2e-snap-page-%Y-%m-%d_%H-%M';
const namedBySchema = /^e2e-snap-page-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/;

/**
 * A ceiling on a new snapshot reaching the open list. A live event usually brings it in seconds; one taken through
 * `pool.snapshot.create` may send none, and then the list's own re-read every minute does.
 */
const listRefreshCeilingMs = 90_000;

/** The first render of the extra columns reads `creation`, `used` and `referenced` for every snapshot. */
const extraColumnsTimeoutMs = 60_000;

/** The account preferences each test starts from and teardown writes back: extra columns off. */
let preferences: PreferencesBlob;

/** `ixFileSize`: base 2, to a hundredth of the largest unit the value reads as at least one of. */
function asFileSize(bytes: number): string {
  const prefixes = ['', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi'];
  let steps = 0;
  while (bytes / 1024 ** steps >= 1024 && steps < prefixes.length - 1) {
    steps++;
  }
  const formatted = Math.round(((bytes / 1024 ** steps) + Number.EPSILON) * 100) / 100;

  return `${formatted} ${prefixes[steps] ?? ''}B`;
}

/** `ix-date` at the default `yyyy-MM-dd HH:mm:ss`, which shows the appliance's wall clock, not the browser's. */
function asCreatedCell(unixSeconds: number, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(unixSeconds * 1000)).map(({ type, value }) => [type, value]),
  );

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

/** The task before its dataset, which it points at; the snapshots before the dataset they belong to. */
async function removeEverything(api: E2eApiClient, dataset: string): Promise<void> {
  await ensureSnapshotTasksAbsent(api, dataset);
  await ensureSnapshotsAbsent(api, dataset);
  await ensureDatasetAbsent(api, dataset);
}

test.beforeEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  await removeEverything(api, dataset);
  await ensureDatasetPresent(api, dataset);

  preferences = {
    ...await establishPreferenceBaseline(api),
    timeFormat: 'HH:mm:ss',
    showSnapshotExtraColumns: false,
  };
  await restorePreferences(api, preferences);
});

test.afterEach(async ({ api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  if (leavingTestData(`dataset "${dataset}", its snapshots and snapshot task, and the extra columns preference`)) {
    return;
  }

  await runCleanupSteps([
    ['turn the extra columns off', () => restorePreferences(api, preferences)],
    [`remove dataset ${datasetName}, its snapshots and task`, () => removeEverything(api, dataset)],
  ]);
});

test('Add on the Snapshots page takes a snapshot, and the appliance really has one', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;

  await openSnapshotList(page, dataset);
  await openAddSnapshotForm(page, dataset);

  await page.locator(snapshotLocators.form.name).fill(snapshotName);
  await saveSnapshotForm(page);

  expect(await findSnapshot(api, dataset, snapshotName)).toMatchObject({
    dataset, snapshot_name: snapshotName,
  });
  await expect(page.locator(snapshotLocators.list.row(dataset, snapshotName)))
    .toBeVisible({ timeout: listRefreshCeilingMs });
});

test('with a periodic snapshot task present, Add takes a snapshot named by its schema', async ({ page, api, pool }) => {
  const dataset = `${pool}/${datasetName}`;
  const { form } = snapshotLocators;

  await ensureSnapshotTaskPresent(api, { dataset, namingSchema, schedule: monthlySchedule });

  await openSnapshotList(page, dataset);
  await openAddSnapshotForm(page, dataset);

  // A name and a schema together are refused, so the generated name goes first.
  await page.locator(form.name).fill('');
  await selectOption(page, form.namingSchema, form.namingSchemaOption(namingSchema));
  await expect(page.locator(form.namingSchema)).toContainText(namingSchema);
  await saveSnapshotForm(page);

  // Exactly one, and named by the schema: a form that sent the empty name, or the schema itself as the name,
  // would leave a snapshot that fails the pattern.
  const snapshots = await listSnapshots(api, dataset);
  expect(snapshots.map((snapshot) => snapshot.snapshot_name)).toEqual([expect.stringMatching(namedBySchema)]);

  const [taken] = snapshots;
  await expect(page.locator(snapshotLocators.list.row(dataset, taken?.snapshot_name ?? '')))
    .toBeVisible({ timeout: listRefreshCeilingMs });
});

test('Show extra columns adds Used, Date created and Referenced with the snapshot\'s values, and hiding takes them away', async ({
  page, api, pool,
}) => {
  const dataset = `${pool}/${datasetName}`;
  const { list } = snapshotLocators;
  const extraCells = [
    list.used(dataset, snapshotName), list.created(dataset, snapshotName), list.referenced(dataset, snapshotName),
  ];

  await ensureSnapshotPresent(api, dataset, snapshotName);
  const values = await readSnapshotColumnValues(api, dataset, snapshotName);
  const timezone = await readTimezone(api);

  await openSnapshotList(page, dataset);
  await expect(page.locator(list.row(dataset, snapshotName))).toBeVisible({ timeout: extraColumnsTimeoutMs });
  for (const cell of extraCells) {
    await expect(page.locator(cell)).toBeHidden();
  }

  await page.locator(list.showExtraColumns).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  // A snapshot of a dataset nothing has written to uses nothing and references the dataset's few KiB, so Used and
  // Referenced differ, and a cell reading the other's property fails here.
  await expect(page.locator(list.used(dataset, snapshotName)))
    .toHaveText(asFileSize(values.used), { timeout: extraColumnsTimeoutMs });
  await expect(page.locator(list.referenced(dataset, snapshotName))).toHaveText(asFileSize(values.referenced));
  await expect(page.locator(list.created(dataset, snapshotName))).toHaveText(asCreatedCell(values.creation, timezone));
  await expect.poll(() => readPreference(api, 'showSnapshotExtraColumns')).toBe(true);

  await page.locator(list.showExtraColumns).click({ timeout: extraColumnsTimeoutMs });
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  for (const cell of extraCells) {
    await expect(page.locator(cell)).toBeHidden({ timeout: extraColumnsTimeoutMs });
  }
  await expect(page.locator(list.row(dataset, snapshotName))).toBeVisible();
  await expect.poll(() => readPreference(api, 'showSnapshotExtraColumns')).toBe(false);
});
