import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { fullDefaultPreferences } from '../../../../e2e/fixtures/preferences';

/**
 * `e2e/fixtures/preferences.ts` writes a whole preferences blob for accounts that never saved one.
 * A partial blob is worse than none: any object skips the reducer's defaults, so a field added
 * here and not there silently leaves the appliance one field short.
 *
 * Keys only: the e2e copy is a floor to merge onto, so a changed default value is not drift.
 * Lives under `src/` because Jest ignores `e2e/`.
 */
describe('e2e fullDefaultPreferences parity with defaultPreferences', () => {
  it('covers every preference webui seeds by default', () => {
    const byName = (a: string, b: string): number => a.localeCompare(b);

    expect(Object.keys(fullDefaultPreferences).sort(byName))
      .toEqual(Object.keys(defaultPreferences).sort(byName));
  });
});
