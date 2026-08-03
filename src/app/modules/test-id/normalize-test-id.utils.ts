import { kebabCase } from 'lodash-es';

export type SupportedTestId = number | string | null | undefined | (string | number | null | undefined)[];

/**
 * Normalizes one already-joined test id the way `[ixTest]` always has: lodash `kebabCase`.
 *
 * `@truenas/ui-components` normalizes `testId` values too, but it does not split
 * letter→digit boundaries the way lodash does, so `eth0` stays `eth0` where
 * `[ixTest]` produced `eth-0`. Pre-normalizing a *dynamic* value with this helper
 * before handing it to a tn-* `[testId]` input keeps the ids Release Engineering
 * already selects on byte-identical across the legacy `[ixTest]` directive, the
 * library's `[tnTestId]` directive, and the tn-* components' own `testId` inputs.
 * Static ids need no such treatment.
 *
 * Use this for a single string (a table row tag, typically) and
 * {@link normalizeTestIdParts} when the id is built from separate segments.
 *
 * See NAS-141021.
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
 * Dropping empties is what `[ixTest]` did, so this stays byte-identical for anything
 * that already went through the directive — but a call site that used to stringify an
 * optional value itself (`kebabCase(String(maybeUndefined))`) loses its literal
 * `undefined` segment here. See `addPortTestId` in add-port-menu.
 *
 * `[ixTest]` itself filters on plain falsiness, so it also drops a numeric `0`. That
 * legacy quirk stays inside `TestDirective` rather than here, so brand-new tn-* call
 * sites don't inherit it.
 */
export function normalizeTestIdParts(segments: SupportedTestId): string[] {
  return (Array.isArray(segments) ? segments : [segments])
    .filter((part): part is string | number => part != null && part !== '')
    .map((part) => normalizeTestIdString(part));
}
