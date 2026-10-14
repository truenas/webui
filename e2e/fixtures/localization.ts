/**
 * Localization settings: preconditions, cleanup and readback, over the API.
 *
 * The appliance's timezone is one field of `system.general`, a single config
 * record, so — as in `fixtures/replication.ts` — there is nothing to create or
 * delete. Each test writes the timezone it starts from, and the spec writes back
 * the one the appliance held before its first test.
 *
 * Language and date format are not here. They are the signed-in account's own
 * preferences rather than the appliance's, and `fixtures/preferences.ts` owns
 * those.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** The appliance's timezone, as `system.general.config` holds it. */
export async function readTimezone(client: E2eApiClient): Promise<string> {
  const config = await firstValueFrom(client.api.call('system.general.config').pipe(timeout(readTimeoutMs)));
  return config.timezone;
}

/**
 * Writes the timezone. Used for the state a test starts from and for teardown.
 * Never for the change under test, which goes through the form.
 */
export async function setTimezone(client: E2eApiClient, timezone: string): Promise<void> {
  await firstValueFrom(
    client.api.call('system.general.update', [{ timezone }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * The label the form's Timezone field shows for a timezone.
 *
 * The field's options come from `system.general.timezone_choices`, and an
 * option's `data-test` is built from its label rather than its value, so a
 * locator needs the label. Read from the appliance rather than assumed equal to
 * the timezone's name, because that map is middleware's to define.
 */
export async function readTimezoneLabel(client: E2eApiClient, timezone: string): Promise<string> {
  const choices = await firstValueFrom(
    client.api.call('system.general.timezone_choices').pipe(timeout(readTimeoutMs)),
  );
  const label = choices[timezone];
  if (!label) {
    throw new Error(`system.general.timezone_choices offers no "${timezone}"`);
  }

  return label;
}
