/**
 * The system dataset's pool and the priority resilvering window: preconditions,
 * cleanup and readback, over the API.
 *
 * Both are single config records behind the Storage card on System > Advanced
 * Settings, so there is nothing to create or delete. A spec records them before
 * its first test and writes them back afterwards.
 *
 * Every write here is conditional on a difference. Moving the system dataset
 * copies `.system` and restarts what depends on it — the tiering daemon among
 * them, which has already hit systemd's start limit from churn like this (see
 * `establishTierBaseline` in `fixtures/tiering.ts`) — so a move that would
 * change nothing is not made.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/**
 * Ceiling on one move of the system dataset. It copies `.system` to the other
 * pool and restarts the services that keep files there, which is minutes rather
 * than seconds on the CI appliance.
 */
export const systemDatasetMoveTimeoutMs = 5 * 60_000;

/** The part of `pool.resilver.config` the Storage card shows and its form edits. */
export interface ResilverSettings {
  enabled: boolean;
  /** `HH:MM`. */
  begin: string;
  /** `HH:MM`. */
  end: string;
  /** 1 is Monday, 7 is Sunday. */
  weekday: number[];
}

/** What `boot.get_state` holds that this file reads. The API client types it loosely. */
interface BootPoolName {
  name: string;
}

/** The pool the system dataset is on, by name. */
export async function readSystemDatasetPool(client: E2eApiClient): Promise<string> {
  const config = await firstValueFrom(client.api.call('systemdataset.config').pipe(timeout(readTimeoutMs)));
  if (!config.pool) {
    throw new Error('systemdataset.config reports no pool for the system dataset');
  }

  return config.pool;
}

/** The boot pool's name, as the System Dataset Pool select offers it. Not assumed to be `boot-pool`. */
export async function readBootPoolName(client: E2eApiClient): Promise<string> {
  const state = await firstValueFrom(
    client.api.call('boot.get_state').pipe(timeout(readTimeoutMs)),
  ) as unknown as BootPoolName;

  return state.name;
}

/**
 * Moves the system dataset onto `pool`, unless it is there already.
 *
 * A job, so through `runJob`: the move restarts services over the socket job
 * events arrive on. Confirmed by reading the config back, because the move is
 * the whole of what the job is for.
 */
export async function moveSystemDataset(client: E2eApiClient, pool: string): Promise<void> {
  if (await readSystemDatasetPool(client) === pool) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('systemdataset.update', [{ pool }]),
    {
      timeoutMs: systemDatasetMoveTimeoutMs,
      whatItCosts: `The system dataset was not moved to pool "${pool}", so a later pool export may fail on it.`,
      confirm: async () => await readSystemDatasetPool(client) === pool,
    },
  );
}

/**
 * The ids of every `systemdataset.update` job middleware remembers, so a later
 * read can tell whether a save started a move.
 */
export async function findSystemDatasetMoveJobIds(client: E2eApiClient): Promise<number[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'systemdataset.update']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs.map((job) => job.id);
}

/** The resilvering window as the appliance holds it. */
export async function readResilverConfig(client: E2eApiClient): Promise<ResilverSettings> {
  // Middleware types the defaulted fields as optional although it always
  // returns them, which is why the app reads this through `toResilverConfig`.
  const config = await firstValueFrom(
    client.api.call('pool.resilver.config').pipe(timeout(readTimeoutMs)),
  ) as unknown as ResilverSettings;

  return {
    enabled: config.enabled,
    begin: config.begin,
    end: config.end,
    weekday: config.weekday,
  };
}

/** Writes the resilvering window, unless the appliance already holds exactly this one. */
export async function setResilverConfig(client: E2eApiClient, settings: ResilverSettings): Promise<void> {
  const current = await readResilverConfig(client);
  const unchanged = current.enabled === settings.enabled
    && current.begin === settings.begin
    && current.end === settings.end
    && current.weekday.join() === settings.weekday.join();
  if (unchanged) {
    return;
  }

  await firstValueFrom(
    client.api.call('pool.resilver.update', [{
      enabled: settings.enabled,
      begin: settings.begin,
      end: settings.end,
      weekday: settings.weekday,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
