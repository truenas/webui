import { TnSelectOption } from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';

/**
 * Ready-made `optionTestIdKey` callbacks for `tn-select` / `tn-autocomplete`.
 *
 * With no key, the library's `optionTestId()` derives an option's id from its **value** when that
 * value is a `string` or a `number`, and falls back to the **label** for anything else. The legacy
 * `[ixTest]` directive always derived it from the label, so a select whose label and value differ
 * *and* whose value is a primitive — `<name> | <guid>` vs the bare guid, an enclosure name vs its
 * id — silently renames every option id on migration unless the key is pinned back to the label.
 * Object- or array-valued options (`{ size, type }`) already land on the label unaided and need no
 * key; pin one only if the default would be wrong or if you want the derivation stated in the
 * template.
 *
 * Kept here so the reasoning is pinned in one place instead of being re-derived per component.
 * Pass one straight through:
 * `[optionTestIdKey]="optionTestIdByLabel"`.
 *
 * A select whose id has to come from somewhere other than the label — a lookup keyed by the
 * option value, say — still needs its own callback; see `app-update-dialog.component.ts`.
 *
 * **Sharp edge:** a label-derived id is locale-dependent — the option ids shift with the active
 * language, so a test pinned to `option-pool-my-pool` in English will not resolve under another
 * locale. Legacy `[ixTest]="[name, option.label]"` had exactly the same property, so pinning the
 * key is parity-preserving rather than a new hazard; but where an id must be stable across
 * languages, key off a locale-independent field of the option value instead.
 */
export const optionTestIdByLabel = (option: TnSelectOption): string => option.label;

/**
 * As {@link optionTestIdByLabel}, but kebab-cased the way `[ixTest]` normalized its input.
 *
 * Use this when the legacy id had already collapsed spaces or mixed case that the label still
 * carries — e.g. `RAIDZ1` resolved to `option-layout-raidz-1`, which the library's own
 * normalizer would not reproduce from the value (it drops the hyphen before the digit).
 */
export const optionTestIdByKebabLabel = (option: TnSelectOption): string => kebabCase(option.label);
