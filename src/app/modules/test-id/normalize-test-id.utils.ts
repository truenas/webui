import { kebabCase } from 'lodash-es';

export type SupportedTestId = number | string | null | undefined | (string | number | null | undefined)[];

/**
 * Normalizes one already-joined test id with lodash `kebabCase`.
 *
 * `@truenas/ui-components` kebab-cases `testId` values too, but not the same way: it
 * does not split a letter→digit boundary, so `eth0` stays `eth0` where lodash gives
 * `eth-0`. This exists to bridge that one difference, and nothing else. Thousands
 * of `data-test` values that Release Engineering and the e2e suite select on were
 * minted through lodash and cannot move, so a *dynamic* value destined for a tn-*
 * `testId` input is pre-normalized here and passes through the library unchanged.
 * Static ids need no such treatment.
 *
 * Use this for a single string (a table row tag, typically) and
 * {@link normalizeTestIdParts} when the id is built from separate segments.
 *
 * The mismatch is historical: webui minted these ids through a local directive that
 * kebab-cased with lodash, and the library's directive replaced it (NAS-141021,
 * NAS-143893). Nothing is left to migrate — what remains is the id values themselves,
 * which are a Release Engineering contract. Every call site that says "normalized the
 * old way" means this helper; there is no second lodash copy in `src/`.
 * `e2e/locators/test-id.ts` carries the suite's mirror of it.
 */
export function normalizeTestIdString(id: string | number): string {
  return kebabCase(String(id));
}

/**
 * Segment-wise form of {@link normalizeTestIdString}, with absent segments dropped.
 *
 * "Absent" means `null`, `undefined` and `''` — a segment that carries no value. A
 * numeric `0` is a value and is kept, so a control at index 0 of a `FormArray` still
 * contributes its index instead of silently colliding with its siblings.
 *
 * Dropping empties is how the existing ids were minted, so this stays byte-identical
 * for anything that already carried one — but a call site that used to stringify an
 * optional value itself (`kebabCase(String(maybeUndefined))`) loses its literal
 * `undefined` segment here. See `addPortTestId` in add-port-menu.
 */
export function normalizeTestIdParts(segments: SupportedTestId): string[] {
  return (Array.isArray(segments) ? segments : [segments])
    .filter((part): part is string | number => part != null && part !== '')
    .map((part) => normalizeTestIdString(part));
}
