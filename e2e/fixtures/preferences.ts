/**
 * Preference preconditions and cleanup, over the API.
 *
 * Preferences are unlike every other fixture here. They are not an object the
 * suite creates and deletes — they are a blob hanging off the *account the whole
 * suite signs in as*, so a test that changes one changes what every later test
 * sees. A left-behind date format changes the text in every date cell; a
 * left-behind language translates the app.
 *
 * So there is no `ensure*Absent`. {@link establishPreferenceBaseline} writes a
 * known state before each test and hands back exactly what `afterEach` must
 * write to undo it.
 *
 * ## Why this establishes rather than observes
 *
 * The obvious version of this file snapshots whatever it finds and puts it back.
 * That reads as conservative and is not: it makes every test's precondition
 * "whatever the appliance happened to be set to", so an interrupted run — killed
 * between a toggle and its restore — leaves the next run asserting against a
 * state it did not choose. `CLAUDE.md` has the rule: cleanup runs in
 * `beforeEach` too, so a test is re-runnable against a dirty appliance.
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

/** What a single preference can be, for the handful the specs read back. */
export type PreferenceValue = string | number | boolean | null | undefined;

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
} as const;

/**
 * A complete blob, for the one case where merging has nothing to merge into.
 *
 * An account that has never saved a preference has no `preferences` attribute at
 * all, and **that is not the same as an empty one**: `preferences.effects.ts`
 * treats a missing attribute as `noPreferencesFound`, whose reducer seeds
 * webui's full defaults, while `{}` is truthy and takes the `preferencesLoaded`
 * path — leaving the app running with no `lifetime`, no `language`, no
 * `sidenavStatus`. Writing a partial blob onto such an account would put it in
 * that second state permanently, for this run and every later one.
 *
 * So this sits underneath every merge. It mirrors `defaultPreferences` in webui,
 * and `src/app/store/preferences/e2e-default-preferences-parity.spec.ts` holds
 * it to that set of keys — the silent drift being a field added to webui and not
 * here.
 */
export const fullDefaultPreferences: PreferencesBlob = {
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
 * The signed-in account's preferences, or undefined when it has none.
 *
 * `auth.me` rather than `user.query`: preferences live on the *session's* own
 * account, and reading them the way the app does keeps this honest about where
 * they come from.
 *
 * Undefined rather than `{}` for an account that has never saved one — see
 * {@link fullDefaultPreferences} for why collapsing the two is a trap rather
 * than a convenience.
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
 * Puts the account into {@link preferenceBaseline} and returns that state.
 *
 * Call in `beforeEach` and hand the result straight back to
 * {@link restorePreferences} in `afterEach`. The return value is the *written*
 * state rather than the state found, so a test that fails halfway through a
 * change is still undone to something known.
 *
 * **One thing it cannot undo.** Middleware exposes `auth.set_attribute` and no
 * way to unset an attribute, so on an account that had no preferences at all
 * this leaves one behind — webui's own defaults, which is what that account was
 * already being given at runtime, but now written down. Recorded under Known
 * gaps in `docs/status.md`.
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
 * One preference, read fresh.
 *
 * The assertion a UI change is checked against: the screen re-rendering says it
 * believed the change, this says the appliance stored it. Fresh every call so it
 * can be polled — the save is a socket round trip the UI does not wait on.
 */
export async function readPreference(client: E2eApiClient, key: string): Promise<PreferenceValue> {
  const preferences = await readPreferences(client);

  return preferences?.[key] as PreferenceValue;
}
