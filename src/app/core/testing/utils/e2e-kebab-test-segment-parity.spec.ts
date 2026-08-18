import { kebabTestSegment } from '@truenas/ui-components';
import { kebabTestSegment as e2eKebabTestSegment } from '../../../../../e2e/locators/test-id';

/**
 * Keeps the E2E suite's copy of `kebabTestSegment` honest.
 *
 * `e2e/locators/test-id.ts` replicates the library function rather than importing
 * it, because `@truenas/ui-components` has a single Angular entry point and the
 * Playwright runner is a Node process with no browser — see that file for the
 * full reasoning. This spec is what holds the copy to the original: without it,
 * the two could drift and nothing would say so.
 *
 * This lives under `src/` deliberately: it is the only tree where the library
 * resolves, and Jest is the only runner that compiles it. `e2e/` is in Jest's
 * `testPathIgnorePatterns`, so the guard could not live beside the code it
 * guards.
 *
 * Why it is worth a test at all: a `~0.4.9` bump that touches the normalizer
 * desynchronizes the copy silently. `datasetLocators.treeNode`, `widthOption`
 * and `vdevCountOption` all interpolate through it, so the divergence would
 * surface as a locator that never matches — a 20 second action timeout partway
 * into the slowest test in the suite, pointing at the pool wizard rather than at
 * the one-line string function actually responsible. Failing here instead costs
 * a second and names the cause.
 */
describe('e2e kebabTestSegment parity with @truenas/ui-components', () => {
  // Chosen so that every transformation step in the function is the sole reason
  // at least one case passes. That is the property that makes this a guard
  // rather than decoration: the first draft of this list looked thorough and
  // still survived a deliberate mutation of the digit-boundary rule, because
  // nothing in it put a digit immediately before a capital.
  const cases: (string | number)[] = [
    // lower/digit -> upper boundary. `tank2Pool` and `20GiB` are the only cases
    // separating `([a-z0-9])([A-Z])` from `([a-z])([A-Z])`.
    'MyPool',
    'sshPort',
    'tank2Pool',
    '20GiB',
    'RAIDZ2Disk',
    'disk1SSD',
    // acronym followed by a word: `([A-Z]+)([A-Z][a-z])`
    'HTTPServer',
    'GiB',
    'ISCSIShare',
    // digits NOT followed by a capital stay joined — `RAIDZ2` -> `raidz2`,
    // where lodash `kebabCase` would give `raidz-2`. This is the disagreement
    // between the two normalizers in this codebase.
    'RAIDZ2',
    'tank2',
    // separator collapsing, trimming, and the values the suite interpolates
    'e2e_tank',
    'addr_trtype',
    'My Label',
    '20 GiB HDD',
    'already-kebab',
    '  leading and trailing  ',
    '__underscores__',
    'multiple   spaces',
    'Mixed_Case-With.Dots',
    '---',
    '',
    9,
    1,
    0,
  ];

  it.each(cases)('agrees with the library for %p', (input) => {
    expect(e2eKebabTestSegment(input)).toBe(kebabTestSegment(input));
  });

  // Guards the specific derivations the locator layer depends on. If the library
  // ever changes these, the suite's selectors are wrong and this says which.
  it('produces the ids the locator layer is built on', () => {
    expect(e2eKebabTestSegment('e2e_tank')).toBe('e2e-tank');
    expect(e2eKebabTestSegment('MyPool')).toBe('my-pool');
    expect(e2eKebabTestSegment('RAIDZ2')).toBe('raidz2');
    expect(e2eKebabTestSegment(9)).toBe('9');
  });
});
