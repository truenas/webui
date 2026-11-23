import { TnSelectOption } from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';

/**
 * `optionTestIdKey` callbacks for `tn-select` / `tn-autocomplete`. Without a key, the library derives
 * an option id from a primitive value, but the ids these replaced came from the label, so a select with
 * differing label and primitive value needs `[optionTestIdKey]="optionTestIdByLabel"` to keep its ids.
 * Object values already fall back to the label. Label-derived ids change with the locale; key off a
 * locale-independent field where that matters (see `app-update-dialog.component.ts`).
 */
export const optionTestIdByLabel = (option: TnSelectOption): string => option.label;

/**
 * As {@link optionTestIdByLabel}, but kebab-cased with lodash, the way the existing ids were.
 *
 * Use this when the legacy id had already collapsed spaces or mixed case that the label still
 * carries — e.g. `RAIDZ1` resolved to `option-layout-raidz-1`, which the library's own
 * normalizer would not reproduce from the value (it drops the hyphen before the digit).
 */
export const optionTestIdByKebabLabel = (option: TnSelectOption): string => kebabCase(option.label);

/**
 * Keys option ids off a primitive value instead of the label. For labels that the library's
 * normalizer splits at a case change — `NFSv3` becomes `nf-sv3` — while the value it maps to
 * (`NFSV3` → `nfsv3`) gives the id e2e and Release Engineering select by.
 */
export const optionTestIdByValue = (option: TnSelectOption): string | number | undefined => {
  return typeof option.value === 'string' || typeof option.value === 'number' ? option.value : undefined;
};
