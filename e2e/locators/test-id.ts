import { kebabCase } from 'lodash-es';

/**
 * The library's `data-test` segment normalizer, copied verbatim from `kebabTestSegment` in `@truenas/ui-components`
 * (`fesm2022/truenas-ui-components.mjs`); a locator interpolating a runtime value must use it. Copied because the
 * package's single entry point would pull all of Angular into the Node runner; drop it once a browser-free subpath
 * exists. `src/app/core/testing/utils/e2e-kebab-test-segment-parity.spec.ts` (Jest ignores `e2e/`) checks both
 * agree on a corpus, not identical text; add the case behind any change. webui's `normalizeTestIdString` and
 * `optionTestIdByKebabLabel` use lodash instead (`raidz-2` vs `raidz2`); see {@link legacyKebabTestSegment}.
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

/**
 * webui's legacy normalizer: lodash `kebabCase` itself, from `lodash-es` like `normalizeTestIdString` (no third copy;
 * ESM because Playwright loads the suite as ES modules). Applies to `option-<control>-<label>` options
 * (`ix-user-picker`, `ix-combobox`, …), row tags from `toUniqueRowTag`, and only the legacy-id shares-card cells via
 * `cellRowTag` (NFS Path/Description, SMB Name/Path/Description/Audit Logging, WebShare Name/Path, NVMe-oF
 * Namespaces/Ports/Hosts), whose rows use {@link kebabTestSegment}: `row-card-smb-share-smb123` beside
 * `text-name-card-smb-share-smb-123-row-text`. The two agree on anything without a letter/digit boundary.
 */
export function legacyKebabTestSegment(part: string | number): string {
  return kebabCase(String(part));
}
