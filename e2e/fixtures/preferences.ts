/**
 * Preference preconditions and cleanup, over the API.
 *
 * Preferences are unlike every other fixture here. They are not an object the
 * suite creates and deletes — they are a blob hanging off the *account the whole
 * suite signs in as*, so a test that changes one changes what every later test
 * sees. A left-behind date format changes the text in every date cell; a
 * left-behind language translates the app.
 *
 * So these do not "ensure absent". They snapshot the whole blob and put it back
 * verbatim, which is the only restore that is correct for a value the suite does
 * not own and did not set. See {@link restorePreferences}.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/**
 * The preferences blob, as middleware hands it back.
 *
 * Deliberately opaque. The suite reads two or three fields out of it and puts
 * the rest back untouched, so naming the shape here would be restating
 * `Preferences` from webui's own interfaces — which this tree does not import —
 * and would go stale the first time a field is added. What the specs need is
 * {@link PreferenceValue} lookups on the fields they actually assert.
 */
export type PreferencesBlob = Record<string, unknown>;

/** What a single preference can be, for the handful the specs read back. */
export type PreferenceValue = string | number | boolean | null | undefined;

/**
 * The signed-in account's preferences, or an empty object.
 *
 * `auth.me` rather than `user.query`: preferences live on the *session's* own
 * account, which is the account the suite authenticated as, and reading them
 * back the way the app does keeps this honest about where they come from.
 *
 * Empty rather than undefined when unset, because an account that has never
 * saved a preference is the normal starting state on a fresh appliance and
 * every caller here would otherwise have to say so.
 */
export async function readPreferences(client: E2eApiClient): Promise<PreferencesBlob> {
  const me = await firstValueFrom(client.api.call('auth.me').pipe(timeout(readTimeoutMs)));

  return (me as { attributes?: { preferences?: PreferencesBlob } }).attributes?.preferences ?? {};
}

/**
 * Puts a previously-read blob back, whole.
 *
 * Whole, not field-by-field, and that is the point. `auth.set_attribute` writes
 * the entire `preferences` attribute every time — the app does the same — so
 * restoring one field would leave any *other* field the test moved exactly where
 * the test left it. Snapshot in `beforeEach`, hand the same object back in
 * `afterEach`, and the account is where it started whatever the test touched.
 */
export async function restorePreferences(client: E2eApiClient, preferences: PreferencesBlob): Promise<void> {
  await firstValueFrom(
    client.api.call('auth.set_attribute', ['preferences', preferences]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * One preference, read fresh.
 *
 * The assertion a UI change is checked against: the screen re-rendering says it
 * believed the change, this says the appliance stored it. Fresh every call so it
 * can be polled — the save is a websocket round trip the UI does not wait for.
 */
export async function readPreference(client: E2eApiClient, key: string): Promise<PreferenceValue> {
  const preferences = await readPreferences(client);

  return preferences[key] as PreferenceValue;
}
