import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { defaultLanguage, languages } from 'app/constants/languages.constant';
import { WINDOW } from 'app/helpers/window.helper';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  currentLanguage: string | null = null;

  constructor(
    protected translate: TranslateService,
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {}

  setLanguageFromBrowser(): Observable<boolean> {
    if (this.currentLanguage) {
      return of(true);
    }

    const storedLanguage = this.window.localStorage.getItem('language');
    if (storedLanguage) {
      return this.setLanguage(storedLanguage);
    }

    const browserLang = this.translate.getBrowserLang();
    if (browserLang) {
      return this.setLanguage(browserLang);
    }

    return this.setLanguage();
  }

  setLanguageFromMiddleware(): Observable<boolean> {
    return this.store$.select(selectPreferences).pipe(switchMap((config) => {
      if (config?.language) {
        return this.setLanguage(config.language);
      }

      return this.setLanguageFromBrowser();
    }));
  }

  /**
   * @return Observable that completes when translations have been loaded.
   */
  setLanguage(lang = defaultLanguage): Observable<boolean> {
    if (languages.has(lang)) {
      this.currentLanguage = lang;
    } else {
      this.currentLanguage = defaultLanguage;
    }

    return this.translate.use(this.currentLanguage).pipe(
      map(() => true),
    );
  }
}
