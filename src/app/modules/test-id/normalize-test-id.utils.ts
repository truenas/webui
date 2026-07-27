import { kebabCase } from 'lodash-es';

export type SupportedTestId = number | string | null | undefined | (string | number | null | undefined)[];

/**
 * Normalizes one test-id segment the way `[ixTest]` always has: lodash `kebabCase`.
 *
 * `@truenas/ui-components` normalizes `testId` values too, but it does not split
 * letter→digit boundaries the way lodash does, so `eth0` stays `eth0` where
 * `[ixTest]` produced `eth-0`. Pre-normalizing a *dynamic* value with this helper
 * before handing it to a tn-* `[testId]` input keeps the ids Release Engineering
 * already selects on byte-identical across the legacy `[ixTest]` directive, the
 * library's `[tnTestId]` directive, and the tn-* components' own `testId` inputs.
 * Static ids need no such treatment.
 *
 * Use this for an already-joined id (a table row tag, typically) and
 * {@link normalizeTestId} when the id is built from separate segments.
 *
 * See NAS-141021.
 */
export function normalizeTestIdSegment(segment: string | number): string {
  return kebabCase(String(segment));
}

/**
 * Segment-wise form of {@link normalizeTestIdSegment}, with empty segments dropped.
 * This is what `[ixTest]` applies to its own `string | string[]` input.
 */
export function normalizeTestId(segments: SupportedTestId): string[] {
  return (Array.isArray(segments) ? segments : [segments])
    .filter((part) => part)
    .map((part) => normalizeTestIdSegment(part as string | number));
}
