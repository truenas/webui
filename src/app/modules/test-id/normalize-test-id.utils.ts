import { kebabCase } from 'lodash-es';

export type SupportedTestId = number | string | null | undefined | (string | number | null | undefined)[];

/**
 * Normalizes test-id segments the way `[ixTest]` always has: lodash `kebabCase`
 * per segment, with empty segments dropped.
 *
 * `@truenas/ui-components` normalizes `testId` segments too, but it does not split
 * letter→digit boundaries the way lodash does, so `eth0` stays `eth0` where
 * `[ixTest]` produced `eth-0`. Pre-normalizing a *dynamic* value with this helper
 * before handing it to a tn-* `[testId]` input keeps the ids Release Engineering
 * already selects on. Static ids need no such treatment. See NAS-141021.
 */
export function normalizeTestId(segments: SupportedTestId): string[] {
  return (Array.isArray(segments) ? segments : [segments])
    .filter((part) => part)
    .map((part) => kebabCase(String(part)));
}
