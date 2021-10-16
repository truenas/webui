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
      mockProvider(LocaleService),
      mockProvider(IxModalService),
      mockProvider(LanguageService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  describe('saving localization settings', () => {
    beforeEach(() => {
      spectator.component.setupForm({
        dateFormat: '2021-10-16',
        kbdMap: 'us',
        language: 'en',
        timeFormat: '05:27:54',
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
        'Time Format': '05:27:54',
        Timezone: 'America/Los_Angeles',
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const body = {
        'Console Keyboard Map': 'us',
        Language: 'en',
        'Time Format': '05:27:54',
        'Date Format': '2021-10-17',
        Timezone: 'America/Los_Angeles',
      };
      await form.fillForm(body);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('system.general.update', [body]);
    });
  });
});
