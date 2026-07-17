import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnAutocompleteHarness, TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { Option } from 'app/interfaces/option.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ThemeService } from 'app/modules/theme/theme.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import {
  guiFormSubmitted, lifetimeTokenUpdated, localizationFormSubmitted, themeChangedInGuiForm,
} from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('PreferencesFormComponent', () => {
  let spectator: Spectator<PreferencesFormComponent>;
  let loader: HarnessLoader;
  const slideInRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    getData: jest.fn((): undefined => undefined),
    requireConfirmationWhen: jest.fn(),
  };
  const createComponent = createComponentFactory({
    component: PreferencesFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      provideMockStore({
        selectors: [{
          selector: selectPreferences,
          value: {
            lifetime: 600,
            userTheme: 'ix-dark',
            language: 'en',
            dateFormat: 'yyyy-MM-dd',
            timeFormat: 'HH:mm:ss',
          } as Preferences,
        }, {
          selector: selectGeneralConfig,
          value: { timezone: 'America/New_York' },
        }],
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(ThemeService, {
        allThemes: [
          { name: 'ix-dark', label: 'Dark', bg2: '#282828' },
          { name: 'ix-blue', label: 'Blue', bg2: '#ffffff' },
          { name: 'dracula', label: 'Dracula', bg2: '#282a36' },
        ],
        isDarkTheme: jest.fn((name: string) => name !== 'ix-blue'),
        findTheme: jest.fn((name: string) => ({ name })),
        updateThemeInLocalStorage: jest.fn(),
      }),
      mockProvider(SystemGeneralService, {
        languageOptions(): Observable<Option[]> {
          return of([
            { value: 'en', label: 'English (en)' },
            { value: 'fr', label: 'French (fr)' },
          ]);
        },
      }),
      mockProvider(LocaleService, {
        getDateFormatOptions: () => [
          { label: '2021-10-16', value: 'yyyy-MM-dd' },
          { label: 'October 16, 2021', value: 'MMMM d, yyyy' },
        ],
        getTimeFormatOptions: () => [
          { label: '16:22:14 (24 Hours)', value: 'HH:mm:ss' },
          { label: '04:22:14 PM', value: 'hh:mm:ss aa' },
        ],
      }),
      mockProvider(LanguageService),
      mockWindow({
        localStorage: {
          setItem: jest.fn(),
        },
        matchMedia: jest.fn().mockReturnValue({
          matches: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        }),
      }),
    ],
  });

  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const hasSelect = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current preferences values', async () => {
    const syncCheckbox = await loader.getHarness(TnCheckboxHarness);
    const themeSelect = await getSelect('theme');
    const timeoutInput = await loader.getHarness(TnInputHarness);
    const languageAutocomplete = await loader.getHarness(TnAutocompleteHarness);
    const dateFormatSelect = await getSelect('date_format');
    const timeFormatSelect = await getSelect('time_format');

    expect(await syncCheckbox.isChecked()).toBe(false);
    expect(await themeSelect.getDisplayText()).toBe('Dark');
    expect(await timeoutInput.getValue()).toBe('600');
    expect(await languageAutocomplete.getInputValue()).toBe('English (en)');
    expect(await dateFormatSelect.getDisplayText()).toBe('2021-10-16');
    expect(await timeFormatSelect.getDisplayText()).toBe('16:22:14 (24 Hours)');
  });

  it('dispatches themeChangedInGuiForm when theme is changed', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    const themeSelect = await getSelect('theme');
    await themeSelect.selectOption('Dracula');

    expect(store$.dispatch).toHaveBeenCalledWith(themeChangedInGuiForm({ theme: 'dracula' }));
  });

  it('dispatches all preference actions when save is pressed', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    await (await getSelect('theme')).selectOption('Blue');
    await (await loader.getHarness(TnInputHarness)).setValue('120');
    const languageAutocomplete = await loader.getHarness(TnAutocompleteHarness);
    await languageAutocomplete.setInputValue('French');
    await languageAutocomplete.selectOption('French (fr)');
    await (await getSelect('date_format')).selectOption('October 16, 2021');
    await (await getSelect('time_format')).selectOption('04:22:14 PM');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(store$.dispatch).toHaveBeenCalledWith(lifetimeTokenUpdated({ lifetime: 120 }));
    expect(store$.dispatch).toHaveBeenCalledWith(guiFormSubmitted({
      theme: 'ix-blue',
      syncThemeWithOS: false,
      lightTheme: 'ix-blue',
      darkTheme: 'ix-dark',
    }));
    expect(store$.dispatch).toHaveBeenCalledWith(localizationFormSubmitted({
      dateFormat: 'MMMM d, yyyy',
      timeFormat: 'hh:mm:ss aa',
      language: 'fr',
    }));
    expect(spectator.inject(ThemeService).updateThemeInLocalStorage).toHaveBeenCalled();
    expect(spectator.inject(LanguageService).setLanguage).toHaveBeenCalledWith('fr');
    expect(slideInRef.close).toHaveBeenCalled();
  });

  it('shows Light Theme and Dark Theme dropdowns when Sync Theme With OS is checked', async () => {
    const syncCheckbox = await loader.getHarness(TnCheckboxHarness);
    await syncCheckbox.check();

    expect(await hasSelect('lightTheme')).toBe(true);
    expect(await hasSelect('darkTheme')).toBe(true);
    expect(await hasSelect('theme')).toBe(false);
  });

  it('dispatches preview theme during editing and stops after save', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    const themeSelect = await getSelect('theme');
    await themeSelect.selectOption('Dracula');

    expect(store$.dispatch).toHaveBeenCalledWith(themeChangedInGuiForm({ theme: 'dracula' }));

    jest.clearAllMocks();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(store$.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: themeChangedInGuiForm.type }),
    );
  });

  it('dispatches guiFormSubmitted with sync fields when saving with OS sync enabled', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    const syncCheckbox = await loader.getHarness(TnCheckboxHarness);
    await syncCheckbox.check();
    await (await getSelect('lightTheme')).selectOption('Blue');
    await (await getSelect('darkTheme')).selectOption('Dracula');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(store$.dispatch).toHaveBeenCalledWith(guiFormSubmitted({
      theme: 'ix-dark',
      syncThemeWithOS: true,
      lightTheme: 'ix-blue',
      darkTheme: 'dracula',
    }));
  });
});
