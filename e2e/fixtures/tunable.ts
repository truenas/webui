/**
 * Sysctl tunable preconditions, cleanup and readback, over the API.
 *
 * A tunable is identified by its variable, which middleware holds unique: a
 * second create for the same variable is refused, so these helpers key on it.
 *
 * Creating, updating and deleting a tunable are jobs, and they reach the
 * kernel. A sysctl tunable that is enabled sets its variable as soon as it is
 * saved, and deleting or disabling it puts back the value middleware recorded
 * when it was created. So the specs use variables that are harmless to move,
 * and a run that dies before its teardown leaves one of them changed.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A tunable as middleware reports it, with its id narrowed — see `GroupRecord`. */
type TunableEntry = Extract<CallResponse<E2eApiDirectory, 'tunable.query'>, unknown[]>[number];

export type TunableRecord = TunableEntry & { id: number };

/**
 * The appliance's own record of the tunable for a variable, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findTunable(client: E2eApiClient, variable: string): Promise<TunableRecord | undefined> {
  const [tunable] = await firstValueFrom(
    client.api.query('tunable.query', [['var', '=', variable]]).pipe(timeout(readTimeoutMs)),
  );

  return tunable as TunableRecord | undefined;
}

/** Removes the tunable for a variable, if there is one. */
export async function ensureTunableAbsent(client: E2eApiClient, variable: string): Promise<void> {
  const tunable = await findTunable(client, variable);
  if (!tunable) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('tunable.delete', [tunable.id]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `the ${variable} tunable is still on the appliance, so the next run's create is refused`,
      confirm: async () => (await findTunable(client, variable)) === undefined,
    },
  );
}

/**
 * Creates an enabled sysctl tunable, if the variable has none already.
 *
 * For the tunable an edit or a delete acts on, and for a bystander. Never for
 * the tunable under test in a create — that one goes through the form.
 */
export async function ensureTunablePresent(
  client: E2eApiClient,
  { variable, value, comment }: { variable: string; value: string; comment: string },
): Promise<void> {
  if (await findTunable(client, variable)) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('tunable.create', [{
      type: 'SYSCTL', var: variable, value, comment, enabled: true,
    }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `the ${variable} tunable could not be created, so there is nothing to act on`,
      confirm: async () => (await findTunable(client, variable)) !== undefined,
    },
  );
}
