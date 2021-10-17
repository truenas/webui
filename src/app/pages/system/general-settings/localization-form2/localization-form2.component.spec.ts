import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { IxFormsModule } from 'app/pages/common/ix/ix-forms.module';
import { IxFormHarness } from 'app/pages/common/ix/testing/ix-form.harness';
import { LocalizationForm2Component } from 'app/pages/system/general-settings/localization-form2/localization-form2.component';
import { LanguageService, WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';
import { LocaleService } from 'app/services/locale.service';

describe('LocalizationFormComponent', () => {
  let spectator: Spectator<LocalizationForm2Component>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let localeService: LocaleService;
  const createComponent = createComponentFactory({
    component: LocalizationForm2Component,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('system.general.update'),
        mockCall('system.general.language_choices', {
          dsb: 'Lower Sorbian',
          el: 'Greek',
          en: 'English',
          'en-au': 'Australian English',
          'en-gb': 'British English',
        }),
        mockCall('system.general.kbdmap_choices', {
          'ua.winkeys': 'Ukrainian (Win keys)',
          us: 'English (US)',
          'us.alt-intl': 'English (US, alt. intl.)',
        }),
        mockCall('system.general.timezone_choices', {
          'America/Lima': 'America/Lima',
          'America/Los_Angeles': 'America/Los_Angeles',
          'America/Maceio': 'America/Maceio',
        }),
      ]),
      mockProvider(LocaleService, {
        getDateFormatOptions: () => [
          {
            label: '2021-10-16',
            value: 'yyyy-MM-dd',
          },
          {
            label: 'October 16, 2021',
            value: 'MMMM d, yyyy',
          },
          {
            label: '16 October, 2021',
            value: 'd MMMM, yyyy',
          },
        ],
        getTimeFormatOptions: () => [
          {
            label: '16:22:14 (24 Hours)',
            value: 'HH:mm:ss',
          },
          {
            label: '04:22:14 pm',
            value: "hh:mm:ss aaaaa'm'",
          },
          {
            label: '04:22:14 PM',
            value: 'hh:mm:ss aa',
          },
        ],
      }),
      mockProvider(IxModalService),
      mockProvider(LanguageService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    localeService = spectator.inject(LocaleService);
  });

  describe('saving localization settings', () => {
    beforeEach(() => {
      spectator.component.setupForm({
        dateFormat: 'yyyy-MM-dd',
        kbdMap: 'us',
        language: 'en',
        timeFormat: 'HH:mm:ss',
        timezone: 'America/Los_Angeles',
      } as LocalizationSettings);
    });

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
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Date Format': '2021-10-16',
        'Time Format': '16:22:14 (24 Hours)',
        'Console Keyboard Map': 'English (US) (us)',
        Language: 'English (en)',
        Timezone: 'America/Los_Angeles',
      });
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(localeService.saveDateTimeFormat).toHaveBeenCalledWith('yyyy-MM-dd', 'HH:mm:ss');
      expect(ws.call).toHaveBeenCalledWith('system.general.update', [{
        'Console Keyboard Map': 'us',
        Language: 'en',
        Timezone: 'America/Los_Angeles',
      }]);
    });
  });
});
