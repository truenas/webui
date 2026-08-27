import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DefaultLangChangeEvent, LangChangeEvent, TranslationChangeEvent, TranslateService,
} from '@ngx-translate/core';
import { TN_FALLBACK_LABELS, type TnFallbackLabels } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { provideTnFallbackLabels } from 'app/core/providers/tn-fallback-labels.provider';

describe('provideTnFallbackLabels', () => {
  let langChange$: Subject<LangChangeEvent>;
  let translationChange$: Subject<TranslationChangeEvent>;
  let defaultLangChange$: Subject<DefaultLangChangeEvent>;
  let instantSpy: jest.Mock;

  function setup(): Signal<TnFallbackLabels> {
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
        provideTnFallbackLabels(),
      ],
    });

    return TestBed.inject(TN_FALLBACK_LABELS) as Signal<TnFallbackLabels>;
  }

  it('exposes a translated value for every TnFallbackLabels key', () => {
    expect(setup()()).toEqual({
      spinner: 'Loading-en',
      brandedSpinner: 'Loading...-en',
      progressBar: 'Progress-en',
      particleProgressBar: 'Progress-en',
      dialog: 'Dialog-en',
      sidePanel: 'Side panel-en',
      drawer: 'Drawer-en',
    });
  });

  it('recomputes labels when TranslateService emits onLangChange', () => {
    const labelsSignal = setup();
    expect(labelsSignal().spinner).toBe('Loading-en');

    instantSpy.mockImplementation((key: string) => `${key}-fr`);
    langChange$.next({ lang: 'fr', translations: {} });

    expect(labelsSignal().spinner).toBe('Loading-fr');
    expect(labelsSignal().sidePanel).toBe('Side panel-fr');
  });

  it('recomputes labels when a bundle is merged after construction', () => {
    const labelsSignal = setup();
    expect(labelsSignal().spinner).toBe('Loading-en');

    // The lazy-load case: the language never changes, the bundle for it just arrives late.
    instantSpy.mockImplementation((key: string) => `${key}-loaded`);
    translationChange$.next({ lang: 'en', translations: {} });

    expect(labelsSignal().spinner).toBe('Loading-loaded');
  });
});
