import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { translated } from 'app/helpers/translated.helper';

describe('translated', () => {
  let langChange$: Subject<LangChangeEvent>;
  let instant: (key: string) => string;

  beforeEach(() => {
    langChange$ = new Subject<LangChangeEvent>();
    instant = (key: string) => key;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => instant(key), onLangChange: langChange$ },
        },
      ],
    });
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
});
