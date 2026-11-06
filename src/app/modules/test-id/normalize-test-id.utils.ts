import { kebabCase } from 'lodash-es';

export type SupportedTestId = number | string | null | undefined | (string | number | null | undefined)[];

/**
 * Kebab-cases one already-joined test id with lodash. The library kebab-cases `testId` too, but
 * doesn't split letter→digit (`eth0` vs lodash's `eth-0`), and the lodash-minted `data-test` values
 * are a contract with Release Engineering and e2e. So *dynamic* values for a tn-* `testId` go through
 * here first; static ids don't need it. Use {@link normalizeTestIdParts} for separate segments;
 * `e2e/locators/test-id.ts` mirrors this.
 */
export function normalizeTestIdString(id: string | number): string {
  return kebabCase(String(id));
}

/**
 * Segment-wise form of {@link normalizeTestIdString} that drops `null`, `undefined` and `''`
 * segments, as the existing ids were minted. `0` is kept so a `FormArray` index doesn't collide.
 * A call site that used to stringify an optional value loses its literal `undefined` segment
 * (see `addPortTestId` in add-port-menu).
 */
export function normalizeTestIdParts(segments: SupportedTestId): string[] {
  return (Array.isArray(segments) ? segments : [segments])
    .filter((part): part is string | number => part != null && part !== '')
    .map((part) => normalizeTestIdString(part));
}
