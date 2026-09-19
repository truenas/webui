import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { fullDefaultPreferences } from '../../../../e2e/fixtures/preferences';

/**
 * Keeps the E2E suite's fallback preferences blob complete.
 *
 * `e2e/fixtures/preferences.ts` carries a copy of this shape for one case: an
 * account that has never saved a preference has no `preferences` attribute, and
 * the fixture has nothing to merge its baseline into. What it writes there has
 * to be a *whole* blob, because a partial one is worse than none —
 * `preferences.effects.ts` reads a missing attribute as `noPreferencesFound`
 * and the reducer seeds these defaults, while any object at all is truthy and
 * takes the `preferencesLoaded` path instead. An account written with three
 * fields would run with three fields: no `lifetime`, no `language`, no
 * `sidenavStatus`.
 *
 * So the risk this guards is a *field added here* and not there. That is the
 * silent one — nothing fails, the suite keeps passing, and the appliance it ran
 * against is left one field short of a valid blob.
 *
 * Keys only, not values. The e2e copy is a floor to merge onto rather than a
 * mirror of what webui ships, so a default that changes (a new theme, a longer
 * session) is not drift and should not fail a build.
 *
 * Under `src/` because Jest ignores `e2e/`, the same reasoning as
 * `e2e-kebab-test-segment-parity.spec.ts`.
 */
describe('e2e fullDefaultPreferences parity with defaultPreferences', () => {
  it('covers every preference webui seeds by default', () => {
    const byName = (a: string, b: string): number => a.localeCompare(b);

    expect(Object.keys(fullDefaultPreferences).sort(byName))
      .toEqual(Object.keys(defaultPreferences).sort(byName));
  });
});
