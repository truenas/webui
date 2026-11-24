/**
 * Preference preconditions and cleanup, over the API.
 *
 * Preferences hang off the *account the whole suite signs in as*, so a leftover changes every later test (date
 * cells, language). There is no `ensure*Absent`: {@link establishPreferenceBaseline} writes a known state before
 * each test and returns what `afterEach` writes to undo it. It establishes rather than snapshots, so a killed run
 * can't leave the next asserting against a state it didn't choose (`CLAUDE.md`: cleanup runs in `beforeEach` too).
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/**
 * The preferences blob, as middleware hands it back.
 *
 * Deliberately opaque. The suite reads three fields out of it and writes the
 * rest back untouched, so naming the shape would restate webui's `Preferences`
 * interface — which this tree does not import — and go stale on the next field
 * added.
 */
export type PreferencesBlob = Record<string, unknown>;

/**
 * The state every preference test starts from.
 *
 * Only the fields the specs actually depend on. Merged over what the account
 * already has rather than replacing it, so a preference no test touches keeps
 * whatever the appliance was configured with.
 */
export const preferenceBaseline = {
  userTheme: 'ix-dark',
  syncThemeWithOS: false,
  hideBuiltinGroups: true,
  language: 'en',
  dateFormat: 'yyyy-MM-DD',
  terminalFontSize: 14,
} as const;

/**
 * A complete blob, for an account with no `preferences` attribute, which **is not the same as an empty one**.
 *
 * `preferences.effects.ts` seeds webui's full defaults for a missing attribute, but `{}` takes the
 * `preferencesLoaded` path with no `lifetime`, `language` or `sidenavStatus`; a partial write would leave the
 * account that way permanently. So this sits under every merge. It mirrors `defaultPreferences`, and
 * `src/app/store/preferences/e2e-default-preferences-parity.spec.ts` guards the key set against drift.
 */
export const fullDefaultPreferences = {
  userTheme: 'ix-dark',
  syncThemeWithOS: false,
  lightTheme: 'ix-blue',
  darkTheme: 'ix-dark',
  dateFormat: 'yyyy-MM-DD',
  timeFormat: 'HH:mm:ss',
  sidenavStatus: { isCollapsed: false, isOpen: true, mode: 'over' },
  tableDisplayedColumns: [],
  hideBuiltinGroups: true,
  showSnapshotExtraColumns: false,
  rebootAfterManualUpdate: false,
  autoRefreshReports: false,
  lifetime: 300,
  language: 'en',
  terminalFontSize: 14,
};

/**
 * Every preference the suite knows how to seed.
 *
 * Keyed to {@link fullDefaultPreferences} rather than left as `string`, so a
 * typo is a compile error instead of an `undefined` that quietly fails an
 * assertion about the wrong thing.
 */
export type PreferenceKey = keyof typeof fullDefaultPreferences;

/**
 * The signed-in account's preferences, or undefined when it has none.
 *
 * `auth.me`, not `user.query`: preferences live on the session's own account, as the app reads them.
 * Undefined rather than `{}` for an account that has never saved one; see {@link fullDefaultPreferences}.
 */
export async function readPreferences(client: E2eApiClient): Promise<PreferencesBlob | undefined> {
  const me = await firstValueFrom(client.api.call('auth.me').pipe(timeout(readTimeoutMs)));

  return (me as { attributes?: { preferences?: PreferencesBlob } }).attributes?.preferences;
}

/**
 * Writes a blob back, whole.
 *
 * Whole, not field-by-field, because `auth.set_attribute` replaces the entire
 * `preferences` attribute every time — the app does the same. Restoring one
 * field would leave any *other* field the test moved exactly where the test left
 * it.
 */
export async function restorePreferences(client: E2eApiClient, preferences: PreferencesBlob): Promise<void> {
  await firstValueFrom(
    client.api.call('auth.set_attribute', ['preferences', preferences]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Puts the account into {@link preferenceBaseline} and returns that state, for {@link restorePreferences} in
 * `afterEach`. Returns the *written* state, so a test failing mid-change is still undone to something known.
 *
 * **One thing it cannot undo**: middleware has no way to unset an attribute, so an account with no preferences
 * is left with webui's defaults written down (what it got at runtime anyway). Recorded under Known gaps in
 * `docs/status.md`.
 */
export async function establishPreferenceBaseline(client: E2eApiClient): Promise<PreferencesBlob> {
  const existing = await readPreferences(client);

  // Defaults underneath rather than only when there is nothing on top. Written
  // as `existing ?? fullDefaultPreferences` this would repair a *missing* blob
  // and write a merely short one straight back — and the whole reason absence is
  // kept distinct above is that a partial blob is the state worth never
  // creating. Ordered this way the fixture cannot write one, whatever it found.
  const baseline = { ...fullDefaultPreferences, ...(existing ?? {}), ...preferenceBaseline };

  await restorePreferences(client, baseline);

  return baseline;
}

/**
 * One preference, read fresh, so it can be polled: the save is a socket round trip the UI does not wait on.
 *
 * The UI re-rendering says it believed the change; this says the appliance stored it. `unknown`, not a scalar
 * union: `sidenavStatus` is an object and `tableDisplayedColumns` an array.
 */
export async function readPreference(client: E2eApiClient, key: PreferenceKey): Promise<unknown> {
  const preferences = await readPreferences(client);

  return preferences?.[key];
}
