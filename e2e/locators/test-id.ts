/**
 * The library's `data-test` segment normalizer, replicated.
 *
 * Every `data-test` value in the app is built from segments run through this
 * function, so any locator that interpolates a runtime value — a pool name, a
 * disk width — has to apply the same normalization or it will look for an
 * element that does not exist.
 *
 * ## Why a copy rather than an import
 *
 * `kebabTestSegment` is exported from `@truenas/ui-components`, but that
 * package has a single entry point (`fesm2022/truenas-ui-components.mjs`) and
 * importing it pulls the whole Angular library into the Playwright runner — a
 * Node process with no browser and no Angular platform — for one pure string
 * function. Until the library ships a browser-free subpath export for its
 * test-id helpers, a faithful copy is the lesser cost.
 *
 * Copied verbatim from `kebabTestSegment` in
 * `node_modules/@truenas/ui-components/fesm2022/truenas-ui-components.mjs`, so a
 * diff against it is trivial. If a normalization here ever disagrees with the
 * app, this is the first place to check.
 *
 * **The copy is guarded.**
 * `src/app/core/testing/utils/e2e-kebab-test-segment-parity.spec.ts` runs both
 * implementations over a corpus and asserts they agree, so a library bump that
 * changes the normalizer fails in Jest — in a second, naming this file — rather
 * than surfacing later as a locator that never matches, twenty minutes into the
 * slowest test in the suite. The guard lives under `src/` because that is the
 * only tree where the Angular library resolves and Jest ignores `e2e/`.
 *
 * What is enforced is that the two agree on every input in that corpus, not that
 * the text is identical. A source-text comparison was tried and rejected: it
 * breaks on a build-tool formatting change while the only extra thing it catches
 * is drift in a branch no input can reach — which by definition cannot affect a
 * selector. If you change this function, add the case that motivated it to the
 * corpus.
 *
 * ## Not the only normalizer
 *
 * webui's legacy `[ixTest]` directive and controls declaring
 * `[optionTestIdKey]="optionTestIdByKebabLabel"` use **lodash** `kebabCase`
 * instead, which splits letters from digits: `RAIDZ2` becomes `raidz-2` there
 * and `raidz2` here. Derive option ids from the extractor the control actually
 * declares — see the `layoutRaidz2` note in `locators/storage.ts`.
 */
export function kebabTestSegment(part: string | number): string {
  return String(part)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
