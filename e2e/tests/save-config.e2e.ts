/**
 * Stories: on System > Advanced Settings, an admin downloads the system
 * configuration from Manage Configuration > Download File, with and without
 * Export Password Secret Seed.
 *
 * Each test checks the file the browser receives: its name, which the dialog
 * builds from the short hostname, the version and a timestamp, and its format.
 * With the seed it is a tar archive holding the database and `pwenc_secret`;
 * without it, the database alone. Then `core.get_jobs` shows the `config.save`
 * job the dialog started, with the `secretseed` it sent. `core.download` starts
 * that job under its own method name, with the dialog's options as its first
 * argument — read from middleware's source, not yet from a run.
 *
 * Nothing is created and no setting changes, so there is no teardown. The file
 * stays in Playwright's output directory: `core.download` serves it once.
 *
 * Not covered: Upload File and Reset to Defaults, which both reboot the
 * appliance, and the Update page's use of the same dialog.
 */
import { readFile } from 'node:fs/promises';
import { findConfigSaveRuns, lastConfigSaveRunId } from '../fixtures/config-save';
import { readSystemIdentity } from '../fixtures/system-info';
import { openSaveConfigDialog, saveConfig } from '../flows/manage-configuration';
import { saveConfigDialogLocators } from '../locators/manage-configuration';
import type { E2eApiClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

/** The UI waits for the job before it fetches the file, so the job is normally done already. */
const jobReadTimeoutMs = 30_000;

/** `<yyyyMMddHHmmss>` and the extension, after `<hostname>-<version>-`. */
const tarSuffix = /^\d{14}\.tar$/;
const dbSuffix = /^\d{14}\.db$/;

const tarBlockBytes = 512;

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

/** A NUL-terminated field of a tar header. */
function tarString(field: Buffer): string {
  const end = field.indexOf(0);
  return field.subarray(0, end === -1 ? field.length : end).toString('utf8');
}

/**
 * The names of the members of a ustar archive, in order. Python's `tarfile`
 * writes one 512-byte header per member, then its data padded to the block,
 * and two empty blocks at the end.
 */
function tarMemberNames(archive: Buffer): string[] {
  const names: string[] = [];
  let offset = 0;
  while (offset + tarBlockBytes <= archive.length) {
    const header = archive.subarray(offset, offset + tarBlockBytes);
    if (header.every((byte) => byte === 0)) {
      break;
    }

    const size = parseInt(tarString(header.subarray(124, 136)).trim(), 8);
    // `x` and `g` are PAX extended headers, which describe a member rather than being one.
    const type = tarString(header.subarray(156, 157));
    if (type !== 'x' && type !== 'g') {
      names.push(tarString(header.subarray(0, 100)));
    }
    offset += tarBlockBytes + Math.ceil(size / tarBlockBytes) * tarBlockBytes;
  }
  return names;
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
  expect(tarMemberNames(archive)).toEqual(expect.arrayContaining(['freenas-v1.db', 'pwenc_secret']));

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
