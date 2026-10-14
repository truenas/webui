/**
 * A dataset's owner, group and Unix mode, over the API.
 *
 * Provisioning only, plus the read a test asserts against. Changing them is what
 * `tests/dataset-permissions.e2e.ts` drives through the UI, so nothing here may stand in for it.
 * There is no teardown of its own: the permissions live on the dataset's mountpoint, and the spec
 * deletes the dataset.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Who owns a path and what its permission bits are. */
export interface Ownership {
  user: string;
  group: string;
  /** The permission bits alone, as the three octal digits the editor shows: `755`. */
  mode: string;
}

/**
 * The owner, group and permission bits of `path`.
 *
 * `filesystem.stat` reports the whole `st_mode`, file type included. Only the low nine bits are
 * permissions, so the rest is masked off before the digits are compared.
 */
export async function readOwnership(client: E2eApiClient, path: string): Promise<Ownership> {
  const stat = await firstValueFrom(
    client.api.call('filesystem.stat', [path]).pipe(timeout(readTimeoutMs)),
  );

  return {
    user: stat.user ?? String(stat.uid),
    group: stat.group ?? String(stat.gid),
    mode: (stat.mode & 0o777).toString(8).padStart(3, '0'),
  };
}

/**
 * Sets the owner, group and mode of `path`, as a precondition.
 *
 * `stripacl` as well, so the path is left with a trivial ACL whatever the dataset was created with.
 * The Permissions card offers the Unix editor only for a trivial one, and sends anything else to
 * the ACL editor instead.
 */
export async function setOwnership(client: E2eApiClient, path: string, ownership: Ownership): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('filesystem.setperm', [{
      path,
      mode: ownership.mode,
      user: ownership.user,
      group: ownership.group,
      options: { stripacl: true },
    }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `${path} does not have the owner and mode the test starts from`,
    },
  );
}
