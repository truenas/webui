import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_AUTOCOMPLETE_LABELS, type TnAutocompleteLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

const labelKeys: Record<keyof TnAutocompleteLabels, string> = {
  placeholder: T('Type to search...'),
  loading: T('Loading...'),
  noResults: T('No results found'),
};

/**
 * Translates the copy every `tn-autocomplete` shares. Same rationale as
 * `provideTnSelectLabels`: the library holds no translations, so without this its
 * English literals ship untranslated unless each call site rebinds them.
 */
export function provideTnAutocompleteLabels(): Provider {
  return {
    provide: TN_AUTOCOMPLETE_LABELS,
    useFactory: () => translated<TnAutocompleteLabels>((translate) => ({
      placeholder: translate.instant(labelKeys.placeholder),
      loading: translate.instant(labelKeys.loading),
      noResults: translate.instant(labelKeys.noResults),
    })),
  };
}
