import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('LocalizationFormComponent', () => {
  let spectator: Spectator<LocalizationFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const settings = {
    dateFormat: 'yyyy-MM-dd',
    kbdMap: 'us',
    language: 'en',
    timeFormat: 'HH:mm:ss',
    timezone: 'America/Los_Angeles',
  } as LocalizationSettings;

  const slideInRef: SlideInRef<LocalizationSettings | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => settings),
  };

  const createComponent = createComponentFactory({
    component: LocalizationFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('system.general.update'),
      ]),
      mockProvider(SystemGeneralService, {
        languageOptions(): Observable<Option[]> {
          return of([
            { value: 'dsb', label: 'Lower Sorbian (dsb)' },
            { value: 'el', label: 'Greek (el)' },
            { value: 'en', label: 'English (en)' },
            { value: 'en-au', label: 'Australian English (en-au)' },
            { value: 'en-gb', label: 'British English (en-gb)' },
          ]);
        },
        kbdMapChoices(): Observable<Option[]> {
          return of([
            { value: 'ua.winkeys', label: 'Ukrainian (Win keys) (ua.winkeys)' },
            { value: 'us', label: 'English (US) (us)' },
            { value: 'us.alt-intl', label: 'English (US, alt. intl.) (us.alt-intl)' },
          ]);
        },
        timezoneChoices(): Observable<Option[]> {
          return of([
            { label: 'America/Lima', value: 'America/Lima' },
            { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
            { label: 'America/Maceio', value: 'America/Maceio' },
          ]);
        },
      }),
      mockProvider(LocaleService, {
        getDateFormatOptions: () => [
          { label: '2021-10-16', value: 'yyyy-MM-dd' },
          { label: 'October 16, 2021', value: 'MMMM d, yyyy' },
          { label: '16 October, 2021', value: 'd MMMM, yyyy' },
        ],
        getTimeFormatOptions: () => [
          { label: '16:22:14 (24 Hours)', value: 'HH:mm:ss' },
          { label: '04:22:14 pm', value: "hh:mm:ss aaaaa'm'" },
          { label: '04:22:14 PM', value: 'hh:mm:ss aa' },
        ],
      }),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(LanguageService),
      mockProvider(FormErrorHandlerService),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              dateFormat: '2021-10-16',
              timeFormat: '16:22:14 (24 Hours)',
            },
          },
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  describe('saving localization settings', () => {
    it('shows current localization settings when editing', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        'Date Format': '2021-10-16',
        'Console Keyboard Map': 'English (US) (us)',
        Language: 'English (en)',
        'Time Format': '16:22:14 (24 Hours)',
        Timezone: 'America/Los_Angeles',
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Date Format': 'October 16, 2021',
        'Time Format': '04:22:14 PM',
        'Console Keyboard Map': 'English (US) (us)',
        Language: 'English (en)',
        Timezone: 'America/Los_Angeles',
      });
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(store$.dispatch).toHaveBeenCalledWith(localizationFormSubmitted({
        dateFormat: 'MMMM d, yyyy',
        timeFormat: 'hh:mm:ss aa',
      }));
      expect(api.call).toHaveBeenCalledWith('system.general.update', [{
        language: 'en',
        kbdmap: 'us',
        timezone: 'America/Los_Angeles',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
      expect(spectator.inject(LanguageService).setLanguage).toHaveBeenCalledWith('en');
    });
  });
});
