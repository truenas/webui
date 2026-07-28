import { TnSelectOption } from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';

/**
 * Ready-made `optionTestIdKey` callbacks for `tn-select` / `tn-autocomplete`.
 *
 * By default the library derives an option's test id from its **value**. The legacy `[ixTest]`
 * directive derived it from the **label**, so any select whose label and value differ — `<name> |
 * <guid>` vs the bare guid, an enclosure name vs its id — silently renames every option id on
 * migration unless the key is pinned back to the label.
 *
 * Kept here, alongside `tn-select-labels.constant.ts`, so the reasoning is pinned in one place
 * instead of being re-derived per component. Pass one straight through:
 * `[optionTestIdKey]="optionTestIdByLabel"`.
 *
 * A select whose id has to come from somewhere other than the label — a lookup keyed by the
 * option value, say — still needs its own callback; see `app-update-dialog.component.ts`.
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
