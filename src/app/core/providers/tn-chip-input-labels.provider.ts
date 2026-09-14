import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_CHIP_INPUT_LABELS, type TnChipInputLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

const labelKeys: Record<keyof TnChipInputLabels, string> = {
  loading: T('Loading...'),
};

/**
 * Translates the copy every `tn-chip-input` shares. Same rationale as
 * `provideTnAutocompleteLabels`: the library holds no translations, so without this its
 * English literals ship untranslated unless each call site rebinds them.
 *
 * Only reachable once a chip input is given an async `[dataSource]` — the spinner label is
 * the component's single piece of copy. The legacy chips control had no loading state at
 * all, so this string arrived with the migration rather than surviving it.
 */
export function provideTnChipInputLabels(): Provider {
  return {
    provide: TN_CHIP_INPUT_LABELS,
    useFactory: () => translated<TnChipInputLabels>((translate) => ({
      loading: translate.instant(labelKeys.loading),
    })),
  };
}
