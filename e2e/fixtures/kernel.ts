/**
 * The debug kernel setting: preconditions, cleanup and readback, over the API.
 *
 * `debugkernel` is part of `system.advanced`, a single config record, so — as in
 * `fixtures/console.ts` — there is nothing to create or delete. The spec reads
 * the value once and writes it back.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/**
 * How long saving `debugkernel` may take, through the form or over the API.
 *
 * Any change regenerates the boot loader's configuration and the initramfs
 * flags, and turning it on also rebuilds the initramfs
 * (`plugins/system_advanced/config.py`). That is slower than the console's
 * 60 s. Not measured on the CI appliance — no run had reached it when this was
 * written — so this is a ceiling, read the run's timing before lowering it.
 */
export const debugKernelSaveTimeoutMs = 180_000;

export async function readDebugKernel(client: E2eApiClient): Promise<boolean> {
  const config = await firstValueFrom(client.api.call('system.advanced.config').pipe(timeout(readTimeoutMs)));

  return config.debugkernel;
}

/** For the state a test starts from and for teardown. Never for the change under test, which goes through the form. */
export async function setDebugKernel(client: E2eApiClient, enabled: boolean): Promise<void> {
  await firstValueFrom(
    client.api.call('system.advanced.update', [{ debugkernel: enabled }]).pipe(timeout(debugKernelSaveTimeoutMs)),
  );
}
