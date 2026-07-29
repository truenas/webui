import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DefaultLangChangeEvent, LangChangeEvent, TranslationChangeEvent, TranslateService,
} from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { translatedSignal } from 'app/modules/translate/translated-signal';

describe('translatedSignal', () => {
  let langChange$: Subject<LangChangeEvent>;
  let translationChange$: Subject<TranslationChangeEvent>;
  let defaultLangChange$: Subject<DefaultLangChangeEvent>;
  let instantSpy: jest.Mock;

  /**
   * Builds the signal inside an injection context, which `translatedSignal` requires (the
   * `toSignal` it wraps does).
   */
  function setup(): Signal<string> {
    langChange$ = new Subject<LangChangeEvent>();
    translationChange$ = new Subject<TranslationChangeEvent>();
    defaultLangChange$ = new Subject<DefaultLangChangeEvent>();
    instantSpy = jest.fn((key: string) => `${key}-en`);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: {
            onLangChange: langChange$.asObservable(),
            onTranslationChange: translationChange$.asObservable(),
            onDefaultLangChange: defaultLangChange$.asObservable(),
            instant: instantSpy,
          },
        },
      ],
    });

    return TestBed.runInInjectionContext(() => translatedSignal(
      (translate) => translate.instant('Save') as string,
    ));
  }

  it('computes its value from the current translations', () => {
    expect(setup()()).toBe('Save-en');
  });

  it('is lazy — nothing is translated until the signal is read', () => {
    setup();

    expect(instantSpy).not.toHaveBeenCalled();
  });

  it('recomputes on a language switch', () => {
    const label = setup();
    expect(label()).toBe('Save-en');

    instantSpy.mockImplementation((key: string) => `${key}-fr`);
    langChange$.next({ lang: 'fr', translations: {} });

    expect(label()).toBe('Save-fr');
  });

  it('recomputes when a bundle is merged after the signal was first read', () => {
    const label = setup();
    // The lazy-load case the util exists for: the language never changes, its bundle just arrives
    // late — a plain `computed` would keep the raw key it resolved to before the merge.
    expect(label()).toBe('Save-en');

    instantSpy.mockImplementation((key: string) => `${key}-loaded`);
    translationChange$.next({ lang: 'en', translations: {} });

    expect(label()).toBe('Save-loaded');
  });

  it('recomputes when the default language changes', () => {
    const label = setup();
    expect(label()).toBe('Save-en');

    instantSpy.mockImplementation((key: string) => `${key}-default`);
    defaultLangChange$.next({ lang: 'de', translations: {} });

    expect(label()).toBe('Save-default');
  });

  it('does not recompute while nothing has changed', () => {
    const label = setup();

    label();
    label();

    expect(instantSpy).toHaveBeenCalledTimes(1);
  });

  it('throws when called outside an injection context', () => {
    expect(() => translatedSignal((translate) => translate.instant('Save'))).toThrow();
  });
});
