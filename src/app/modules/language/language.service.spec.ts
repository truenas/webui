import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { defaultLanguage, languages } from 'app/constants/languages.constant';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { LanguageService } from 'app/modules/language/language.service';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
// eslint-disable-next-line no-restricted-imports
import { getLanguageFiles } from '../../../../scripts/language/get-language-files';

describe('LanguageService', () => {
  let spectator: SpectatorService<LanguageService>;
  let service: LanguageService;
  let translate: TranslateService;
  let store$: MockStore<AppState>;

  const createService = createServiceFactory({
    service: LanguageService,
    providers: [
      mockWindow({
        localStorage: {
          getItem: jest.fn(),
          setItem: jest.fn(),
        },
      }),
      provideMockStore({
        selectors: [{
          selector: selectPreferences,
          value: {
            language: defaultLanguage,
          },
        }],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
    translate = spectator.inject(TranslateService);
    store$ = spectator.inject(MockStore);

    // Default spy behavior for translate
    jest.spyOn(translate, 'use').mockReturnValue(of(true));
    jest.spyOn(translate, 'getBrowserLang').mockReturnValue('en');
  });

  it('compares language constant with files', async () => {
    const langFiles = await getLanguageFiles();
    const availableLanguages = [...languages.keys()].sort((a, b) => a.localeCompare(b));
    expect(availableLanguages).toEqual(langFiles);
  });

  describe('setLanguage', () => {
    it('should set currentanguage to the provided valid language', () => {
      service.setLanguage('de').subscribe((result) => {
        expect(result).toBe(true);
        expect(service.currentLanguage).toBe('de');
      });
      expect(translate.use).toHaveBeenCalledWith('de');
    });

    it('should set currentLanguage to defaultLanguage when an invalid language is provided', () => {
      service.setLanguage('invalid').subscribe((result) => {
        expect(result).toBe(true);
        expect(service.currentLanguage).toBe(defaultLanguage);
      });
      expect(translate.use).toHaveBeenCalledWith(defaultLanguage);
    });
  });

  describe('setLanguageFromBrowser', () => {
    it('should return true immediately if currentLanguage is already set', () => {
      service.currentLanguage = 'fr';
      service.setLanguageFromBrowser().subscribe((result) => {
        expect(result).toBe(true);
      });
    });

    it('should use the browser language if no stored language exists', () => {
      service.currentLanguage = null;
      jest.spyOn(translate, 'getBrowserLang').mockReturnValue('pt-br');
      service.setLanguageFromBrowser().subscribe((result) => {
        expect(result).toBe(true);
        expect(service.currentLanguage).toBe('pt-br');
      });
      expect(translate.use).toHaveBeenCalledWith('pt-br');
    });

    it('should fallback to defaultLanguage if neither stored nor browser language exists', () => {
      service.currentLanguage = null;
      jest.spyOn(translate, 'getBrowserLang').mockReturnValue(null);
      service.setLanguageFromBrowser().subscribe((result) => {
        expect(result).toBe(true);
        expect(service.currentLanguage).toBe(defaultLanguage);
      });
      expect(translate.use).toHaveBeenCalledWith(defaultLanguage);
    });
  });

  describe('setLanguageFromMiddleware', () => {
    it('should set language from store preferences if available', () => {
      store$.overrideSelector(selectPreferences, { language: 'ja' } as Preferences);
      store$.refreshState();

      service.setLanguageFromMiddleware().subscribe((result) => {
        expect(result).toBe(true);
        expect(service.currentLanguage).toBe('ja');
      });
      expect(translate.use).toHaveBeenCalledWith('ja');
    });

    it('should fallback to setLanguageFromBrowser if no language in preferences', () => {
      store$.overrideSelector(selectPreferences, {} as Preferences);
      store$.refreshState();

      service.setLanguageFromBrowser = jest.fn().mockReturnValue(of(true));
      service.setLanguageFromMiddleware().subscribe((result) => {
        expect(result).toBe(true);
      });
      expect(service.setLanguageFromBrowser).toHaveBeenCalled();
    });
  });
});
