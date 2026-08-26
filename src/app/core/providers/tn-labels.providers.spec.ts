import { InjectionToken, Provider, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DefaultLangChangeEvent, LangChangeEvent, TranslationChangeEvent, TranslateService,
} from '@ngx-translate/core';
import {
  TN_AUTOCOMPLETE_DEFAULT_LABELS,
  TN_AUTOCOMPLETE_LABELS,
  TN_DIALOG_CHROME_LABELS,
  TN_DIALOG_DEFAULT_CHROME_LABELS,
  TN_SELECT_DEFAULT_LABELS,
  TN_SELECT_LABELS,
  TN_TABLE_DEFAULT_LABELS,
  TN_TABLE_LABELS,
} from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { provideTnAutocompleteLabels } from 'app/core/providers/tn-autocomplete-labels.provider';
import { provideTnDialogLabels } from 'app/core/providers/tn-dialog-labels.provider';
import { provideTnSelectLabels } from 'app/core/providers/tn-select-labels.provider';
import { provideTnTableLabels } from 'app/core/providers/tn-table-labels.provider';

/**
 * Each provider fills one library label token. The library's own default bundle is the
 * source of truth for which keys a bundle has, so asserting against its keys is what
 * catches a release that adds one — a partial bundle would otherwise leave the new
 * string untranslated at runtime.
 */
const bundles = [
  {
    name: 'provideTnSelectLabels',
    provider: provideTnSelectLabels(),
    token: TN_SELECT_LABELS,
    defaults: TN_SELECT_DEFAULT_LABELS,
  },
  {
    name: 'provideTnAutocompleteLabels',
    provider: provideTnAutocompleteLabels(),
    token: TN_AUTOCOMPLETE_LABELS,
    defaults: TN_AUTOCOMPLETE_DEFAULT_LABELS,
  },
  {
    name: 'provideTnDialogLabels',
    provider: provideTnDialogLabels(),
    token: TN_DIALOG_CHROME_LABELS,
    defaults: TN_DIALOG_DEFAULT_CHROME_LABELS,
  },
  {
    name: 'provideTnTableLabels',
    provider: provideTnTableLabels(),
    token: TN_TABLE_LABELS,
    defaults: TN_TABLE_DEFAULT_LABELS,
  },
] as {
  name: string;
  provider: Provider;
  token: InjectionToken<unknown>;
  defaults: Record<string, string>;
}[];

function sortedKeys(bundle: Record<string, string>): string[] {
  return Object.keys(bundle).sort((a, b) => a.localeCompare(b));
}

describe('tn-* label providers', () => {
  let langChange$: Subject<LangChangeEvent>;
  let instantSpy: jest.Mock;

  function setup(provider: Provider, token: InjectionToken<unknown>): Signal<Record<string, string>> {
    langChange$ = new Subject<LangChangeEvent>();
    instantSpy = jest.fn((key: string) => `${key}-en`);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          // All three streams: `translated` merges the same set the `translate` pipe
          // subscribes to, so a mock missing any of them is not a TranslateService.
          useValue: {
            onLangChange: langChange$.asObservable(),
            onTranslationChange: new Subject<TranslationChangeEvent>().asObservable(),
            onDefaultLangChange: new Subject<DefaultLangChangeEvent>().asObservable(),
            instant: instantSpy,
          },
        },
        provider,
      ],
    });

    return TestBed.inject(token) as Signal<Record<string, string>>;
  }

  describe.each(bundles)('$name', ({ provider, token, defaults }) => {
    it('translates every key the library bundle declares', () => {
      const labels = setup(provider, token)();

      expect(sortedKeys(labels)).toEqual(sortedKeys(defaults));
      Object.values(labels).forEach((value) => expect(value).toMatch(/-en$/));
    });

    it('recomputes its labels after a language switch', () => {
      const labels = setup(provider, token);
      expect(Object.values(labels())[0]).toMatch(/-en$/);

      instantSpy.mockImplementation((key: string) => `${key}-fr`);
      langChange$.next({ lang: 'fr', translations: {} });

      Object.values(labels()).forEach((value) => expect(value).toMatch(/-fr$/));
    });
  });
});
