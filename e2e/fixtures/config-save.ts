/**
 * `config.save` jobs, read back over the API.
 *
 * Download File calls `core.download` with `config.save`, which middleware runs
 * as a job of its own. So `core.get_jobs` is where a download that really
 * happened shows up, with the options the dialog sent as its first argument.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** A `config.save` job, and whether it was asked for the secret seed. */
export interface ConfigSaveRun {
  id: number;
  /** `SUCCESS`, `FAILED`, … */
  state: string;
  secretseed: boolean | null;
}

/** Every `config.save` job middleware remembers, by job id. */
export async function findConfigSaveRuns(client: E2eApiClient): Promise<ConfigSaveRun[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'config.save']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs
    .map((job) => {
      const [params] = Array.isArray(job.arguments) ? job.arguments : [];
      const sent = (params ?? {}) as { secretseed?: boolean };

      return {
        id: job.id,
        state: String(job.state),
        secretseed: sent.secretseed ?? null,
      };
    })
    .sort((a, b) => a.id - b.id);
}

/** The highest `config.save` job id so far, so a test reads only its own. */
export async function lastConfigSaveRunId(client: E2eApiClient): Promise<number> {
  return Math.max(0, ...(await findConfigSaveRuns(client)).map(({ id }) => id));
}
