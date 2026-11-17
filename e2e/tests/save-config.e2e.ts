/**
 * Stories: an admin downloads the system configuration from Advanced Settings' Manage Configuration, with and
 * without Export Password Secret Seed. Each test checks the file's name (short hostname, version, timestamp) and
 * format (a tar with the database and `pwenc_secret`, or the database alone), then the `config.save` job with its
 * `secretseed` in `core.get_jobs` (that `core.download` starts it under that name is from middleware's source, not
 * yet a run). Nothing changes, so no teardown; the file stays in Playwright's output, as it's served only once.
 */
import { readFile } from 'node:fs/promises';
import { findConfigSaveRuns, lastConfigSaveRunId } from '../fixtures/config-save';
import { readSystemIdentity } from '../fixtures/system-info';
import { openSaveConfigDialog, saveConfig } from '../flows/manage-configuration';
import { saveConfigDialogLocators } from '../locators/manage-configuration';
import type { E2eApiClient } from '../support/api/client';
import { tarMembers } from '../support/archive';
import { expect, test } from '../support/fixtures';

/** The UI waits for the job before it fetches the file, so the job is normally done already. */
const jobReadTimeoutMs = 30_000;

/** `<yyyyMMddHHmmss>` and the extension, after `<hostname>-<version>-`. */
const tarSuffix = /^\d{14}\.tar$/;
const dbSuffix = /^\d{14}\.db$/;

/** The first 16 bytes of every SQLite 3 database. */
const sqliteMagic = Buffer.from('SQLite format 3\0', 'latin1');

/** What the file name starts with: the hostname up to its first dot, then the version. */
async function expectedFilePrefix(api: E2eApiClient): Promise<string> {
  const { hostname, version } = await readSystemIdentity(api);
  const shortHostname = hostname.replace(/\..*/, '');
  return `${shortHostname}-${version}-`;
}

/** The `config.save` jobs after `since`, as the assertion compares them. */
async function newConfigSaveRuns(
  api: E2eApiClient,
  since: number,
): Promise<{ state: string; secretseed: boolean | null }[]> {
  return (await findConfigSaveRuns(api))
    .filter(({ id }) => id > since)
    .map(({ state, secretseed }) => ({ state, secretseed }));
}

test('an admin downloads the configuration with the secret seed, and gets a tar archive', async ({ page, api }) => {
  const prefix = await expectedFilePrefix(api);
  const since = await lastConfigSaveRunId(api);

  await openSaveConfigDialog(page);
  await expect(page.locator(saveConfigDialogLocators.exportSeed)).toBeChecked();
  const download = await saveConfig(page);

  const fileName = download.suggestedFilename();
  expect(fileName.startsWith(prefix), `"${fileName}" should start with "${prefix}"`).toBe(true);
  expect(fileName.slice(prefix.length)).toMatch(tarSuffix);

  const archive = await readFile(await download.path());
  expect(archive.length).toBeGreaterThan(0);
  expect(archive.subarray(257, 262).toString('latin1')).toBe('ustar');
  expect(tarMembers(archive).map(({ name }) => name)).toEqual(expect.arrayContaining(['freenas-v1.db', 'pwenc_secret']));

  await expect
    .poll(() => newConfigSaveRuns(api, since), {
      message: 'One new config.save job should have run, with the seed.',
      timeout: jobReadTimeoutMs,
    })
    .toEqual([{ state: 'SUCCESS', secretseed: true }]);
});

test('an admin downloads the configuration without the seed, and gets the database alone', async ({ page, api }) => {
  const prefix = await expectedFilePrefix(api);
  const since = await lastConfigSaveRunId(api);

  await openSaveConfigDialog(page);
  const exportSeed = page.locator(saveConfigDialogLocators.exportSeed);
  await exportSeed.setChecked(false);
  await expect(exportSeed).not.toBeChecked();
  const download = await saveConfig(page);

  const fileName = download.suggestedFilename();
  expect(fileName.startsWith(prefix), `"${fileName}" should start with "${prefix}"`).toBe(true);
  expect(fileName.slice(prefix.length)).toMatch(dbSuffix);

  const database = await readFile(await download.path());
  expect(database.length).toBeGreaterThan(sqliteMagic.length);
  expect(database.subarray(0, sqliteMagic.length).equals(sqliteMagic)).toBe(true);

  await expect
    .poll(() => newConfigSaveRuns(api, since), {
      message: 'One new config.save job should have run, without the seed.',
      timeout: jobReadTimeoutMs,
    })
    .toEqual([{ state: 'SUCCESS', secretseed: false }]);
});
