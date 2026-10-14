/**
 * Boot environment preconditions, cleanup and readback, over the API.
 *
 * A boot environment is identified by its name, which is its id. The ones the
 * specs make are clones of the running one: a clone is a ZFS clone on the boot
 * pool, so it is cheap, and it is never the running boot environment nor the one
 * set to boot next — which are the two the list refuses to delete.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

export type BootEnvironmentRecord = Extract<
  CallResponse<E2eApiDirectory, 'boot.environment.query'>, unknown[]
>[number];

/**
 * The appliance's own record of a boot environment, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findBootEnvironment(
  client: E2eApiClient,
  name: string,
): Promise<BootEnvironmentRecord | undefined> {
  const [bootEnvironment] = await firstValueFrom(
    client.api.query('boot.environment.query', [['id', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return bootEnvironment;
}

/** The boot environment the appliance is running from. There is always exactly one. */
export async function findRunningBootEnvironment(client: E2eApiClient): Promise<BootEnvironmentRecord> {
  const [running] = await firstValueFrom(
    client.api.query('boot.environment.query', [['active', '=', true]]).pipe(timeout(readTimeoutMs)),
  );
  if (!running) {
    throw new Error('boot.environment.query reports no active boot environment');
  }

  return running;
}

/**
 * Removes a boot environment, if there is one by that name.
 *
 * Clears its keep flag first, so a run that died after setting it does not leave
 * a boot environment middleware may refuse to destroy.
 */
export async function ensureBootEnvironmentAbsent(client: E2eApiClient, name: string): Promise<void> {
  const bootEnvironment = await findBootEnvironment(client, name);
  if (!bootEnvironment) {
    return;
  }

  if (bootEnvironment.keep) {
    await firstValueFrom(
      client.api.call('boot.environment.keep', [{ id: name, value: false }]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
  await firstValueFrom(
    client.api.call('boot.environment.destroy', [{ id: name }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Clones the running boot environment under a name, if there is none by it already.
 *
 * For the boot environment a keep or a delete acts on, and for a bystander. Never
 * for the one under test in a clone — that one goes through the form.
 */
export async function ensureBootEnvironmentPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findBootEnvironment(client, name)) {
    return;
  }

  const running = await findRunningBootEnvironment(client);
  await firstValueFrom(
    client.api.call('boot.environment.clone', [{ id: running.id, target: name }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
