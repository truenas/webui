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
 * Segment-wise form of {@link normalizeTestIdString}, with empty segments dropped.
 * This is what `[ixTest]` applies to its own `string | string[]` input.
 *
 * Note that dropping empties is what `[ixTest]` did, so it is byte-identical for
 * anything that already went through the directive — but a call site that used to
 * stringify an optional value itself (`kebabCase(String(maybeUndefined))`) loses its
 * literal `undefined` segment here. See `addPortTestId` in add-port-menu.
 */
export function normalizeTestIdParts(segments: SupportedTestId): string[] {
  return (Array.isArray(segments) ? segments : [segments])
    .filter((part): part is string | number => Boolean(part))
    .map((part) => normalizeTestIdString(part));
}
