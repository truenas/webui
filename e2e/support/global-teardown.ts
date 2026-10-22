/**
 * Exports the suite's own pool when a shared worker was handed it.
 *
 * An exclusive worker exports the pool it built when it stops (the `pool`
 * fixture in `support/fixtures.ts`), but a shared one cannot: another may still
 * have datasets on it. A run that reaches the serial project still ends with
 * the pool gone, since that worker adopts the suite's pool by name and exports
 * it — but a run of only `parallel` or `data-protection` specs, by file, grep
 * or shard, would leave it holding its disk. Every worker has stopped by the
 * time this runs, so nothing can still be using it.
 *
 * Connects only when a shared worker said it used the pool, so a run that never
 * touched it signs in no extra time.
 */
import { connectAndLogin } from './api/client';
import { wasSharedPoolUsed } from './appliance-lock';
import { keepTestData } from './cleanup';
import { loadTargetConfig } from './config';
import { suiteOwnedPoolName } from '../fixtures/pool';
import { ensurePoolAbsent } from '../fixtures/storage';

export default async function globalTeardown(): Promise<void> {
  if (!wasSharedPoolUsed()) {
    return;
  }
  if (keepTestData) {
    console.warn(`TN_KEEP_TEST_DATA=1 — leaving pool "${suiteOwnedPoolName}".`);
    return;
  }

  const client = await connectAndLogin(loadTargetConfig());
  try {
    await ensurePoolAbsent(client, suiteOwnedPoolName);
  } finally {
    client.close();
  }
}
