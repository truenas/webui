import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DefaultLangChangeEvent, LangChangeEvent, TranslateService, TranslationChangeEvent,
} from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { translated } from 'app/helpers/translated.helper';

describe('translated', () => {
  let langChange$: Subject<LangChangeEvent>;
  let translationChange$: Subject<TranslationChangeEvent>;
  let defaultLangChange$: Subject<DefaultLangChangeEvent>;
  let instant: (key: string) => string;

  beforeEach(() => {
    langChange$ = new Subject<LangChangeEvent>();
    translationChange$ = new Subject<TranslationChangeEvent>();
    defaultLangChange$ = new Subject<DefaultLangChangeEvent>();
    instant = (key: string) => key;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => instant(key),
            onLangChange: langChange$,
            onTranslationChange: translationChange$,
            onDefaultLangChange: defaultLangChange$,
          },
        },
      ],
    });
  });

  it('hands the TranslateService to the derivation, for call sites without one of their own', () => {
    TestBed.runInInjectionContext(() => {
      const text = translated((translate) => translate.instant('Success') as string);

      expect(text()).toBe('Success');
    });
  });

  it('is lazy — nothing is translated until the signal is read', () => {
    TestBed.runInInjectionContext(() => {
      const derive = jest.fn(() => 'Success');
      translated(derive);

      expect(derive).not.toHaveBeenCalled();
    });
  });

  it('throws when called outside an injection context', () => {
    expect(() => translated((translate) => translate.instant('Success'))).toThrow();
  });

  it('memoizes like a computed while nothing it reads changes', () => {
    TestBed.runInInjectionContext(() => {
      const derive = jest.fn(() => 'Success');
      const text = translated(derive);

      expect(text()).toBe('Success');
      expect(text()).toBe('Success');
      expect(derive).toHaveBeenCalledTimes(1);
    });
  });

  it('re-runs when a signal it reads changes', () => {
    TestBed.runInInjectionContext(() => {
      const state = signal('Pending');
      const text = translated(() => TestBed.inject(TranslateService).instant(state()));

      expect(text()).toBe('Pending');

      state.set('Error');

      expect(text()).toBe('Error');
    });
  });

  it('re-runs on a language change, so instant() does not freeze on the first locale', () => {
    TestBed.runInInjectionContext(() => {
      const text = translated(() => TestBed.inject(TranslateService).instant('Success'));
      expect(text()).toBe('Success');

      instant = () => 'Succès';
      langChange$.next({ lang: 'fr' } as LangChangeEvent);

      expect(text()).toBe('Succès');
    });
  });

  it('re-runs when a catalog arrives late, so instant() does not stay cached on the raw key', () => {
    TestBed.runInInjectionContext(() => {
      const text = translated(() => TestBed.inject(TranslateService).instant('Success'));
      expect(text()).toBe('Success');

      instant = () => 'Succès';
      translationChange$.next({ lang: 'fr' } as TranslationChangeEvent);

      expect(text()).toBe('Succès');
    });
  });

  it('re-runs on a default-language change, which changes what an unresolved key falls back to', () => {
    TestBed.runInInjectionContext(() => {
      const text = translated(() => TestBed.inject(TranslateService).instant('Success'));
      expect(text()).toBe('Success');

      instant = () => 'Succès';
      defaultLangChange$.next({ lang: 'fr' } as DefaultLangChangeEvent);

      expect(text()).toBe('Succès');
    });
  });
});
