import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DefaultLangChangeEvent, LangChangeEvent, TranslationChangeEvent, TranslateService,
} from '@ngx-translate/core';
import {
  TN_FILE_PICKER_DEFAULT_LABELS, TN_FILE_PICKER_LABELS, TnFilePickerLabels,
} from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { provideTnFilePickerLabels } from 'app/core/providers/tn-file-picker-labels.provider';

/**
 * Kept apart from `tn-labels.providers.spec.ts`: that one asserts every label is a string, and
 * the file picker's labels that carry a value are functions.
 */
describe('provideTnFilePickerLabels', () => {
  let langChange$: Subject<LangChangeEvent>;
  let instant: jest.Mock;
  let labels: Signal<TnFilePickerLabels>;

  beforeEach(() => {
    langChange$ = new Subject<LangChangeEvent>();
    instant = jest.fn((key: string, params?: Record<string, unknown>) => {
      return params ? `${key}-en ${JSON.stringify(params)}` : `${key}-en`;
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: {
            onLangChange: langChange$.asObservable(),
            onTranslationChange: new Subject<TranslationChangeEvent>().asObservable(),
            onDefaultLangChange: new Subject<DefaultLangChangeEvent>().asObservable(),
            instant,
          },
        },
        provideTnFilePickerLabels(),
      ],
    });
    labels = TestBed.inject(TN_FILE_PICKER_LABELS) as Signal<TnFilePickerLabels>;
  });

  it('translates every key the library bundle declares, with the same shape', () => {
    const bundle = labels();
    const keys = (value: object): string[] => Object.keys(value).sort((a, b) => a.localeCompare(b));

    expect(keys(bundle)).toEqual(keys(TN_FILE_PICKER_DEFAULT_LABELS));
    Object.entries(TN_FILE_PICKER_DEFAULT_LABELS).forEach(([key, value]) => {
      expect(typeof bundle[key as keyof TnFilePickerLabels]).toBe(typeof value);
    });
    expect(bundle.placeholder).toBe('Select file or folder-en');
  });

  it('passes values into the translation as parameters', () => {
    const bundle = labels();

    expect(bundle.itemsSelected(3))
      .toBe('{count, plural, one {# item selected} other {# items selected}}-en {"count":3}');
    expect(bundle.pathOutsideRoot('/mnt')).toBe('Path is outside of {root}-en {"root":"/mnt"}');
    expect(bundle.openItem('tank')).toBe('Open {name}-en {"name":"tank"}');
  });

  it('recomputes its labels after a language switch', () => {
    expect(labels().select).toBe('Select-en');

    instant.mockImplementation((key: string) => `${key}-fr`);
    langChange$.next({ lang: 'fr', translations: {} });

    expect(labels().select).toBe('Select-fr');
    expect(labels().noItems).toBe('No items found-fr');
  });
});
