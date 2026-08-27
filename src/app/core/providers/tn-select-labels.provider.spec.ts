import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DefaultLangChangeEvent, LangChangeEvent, TranslationChangeEvent, TranslateService,
} from '@ngx-translate/core';
import { TN_SELECT_LABELS, type TnSelectLabels } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { provideTnSelectLabels } from 'app/core/providers/tn-select-labels.provider';

describe('provideTnSelectLabels', () => {
  let langChange$: Subject<LangChangeEvent>;
  let translationChange$: Subject<TranslationChangeEvent>;
  let defaultLangChange$: Subject<DefaultLangChangeEvent>;
  let instantSpy: jest.Mock;

  function setup(): Signal<TnSelectLabels> {
    langChange$ = new Subject<LangChangeEvent>();
    translationChange$ = new Subject<TranslationChangeEvent>();
    defaultLangChange$ = new Subject<DefaultLangChangeEvent>();
    instantSpy = jest.fn((key: string) => `${key}-en`);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          // All three streams, not just `onLangChange`: `translated` merges the same set the
          // `translate` pipe subscribes to, so a mock missing any of them is not a TranslateService.
          useValue: {
            onLangChange: langChange$.asObservable(),
            onTranslationChange: translationChange$.asObservable(),
            onDefaultLangChange: defaultLangChange$.asObservable(),
            instant: instantSpy,
          },
        },
        provideTnSelectLabels(),
      ],
    });

    return TestBed.inject(TN_SELECT_LABELS) as Signal<TnSelectLabels>;
  }

  it('exposes a translated value for every TnSelectLabels key', () => {
    expect(setup()()).toEqual({
      placeholder: 'Select an option-en',
      noOptions: 'No options-en',
      selectAll: 'Select All-en',
    });
  });

  it('recomputes labels when TranslateService emits onLangChange', () => {
    const labelsSignal = setup();
    expect(labelsSignal().placeholder).toBe('Select an option-en');

    instantSpy.mockImplementation((key: string) => `${key}-fr`);
    langChange$.next({ lang: 'fr', translations: {} });

    expect(labelsSignal().placeholder).toBe('Select an option-fr');
    expect(labelsSignal().noOptions).toBe('No options-fr');
  });

  it('recomputes labels when a bundle is merged after construction', () => {
    const labelsSignal = setup();
    expect(labelsSignal().placeholder).toBe('Select an option-en');

    // The lazy-load case: the language never changes, the bundle for it just arrives late.
    instantSpy.mockImplementation((key: string) => `${key}-loaded`);
    translationChange$.next({ lang: 'en', translations: {} });

    expect(labelsSignal().placeholder).toBe('Select an option-loaded');
  });
});
