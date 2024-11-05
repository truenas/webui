import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { Option } from 'app/interfaces/option.interface';
import { LocalizationCardComponent } from 'app/pages/system/general-settings/localization/localization-card/localization-card.component';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('LocalizationCardComponent', () => {
  let spectator: Spectator<LocalizationCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: LocalizationCardComponent,
    providers: [
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectGeneralConfig,
            value: {
              language: 'en',
              timezone: 'America/New_York',
              kbdmap: 'us',
            },
          },
        ],
      }),
      mockProvider(SystemGeneralService, {
        languageChoices(): Observable<Choices> {
          return of({
            en: 'English',
          });
        },
        kbdMapChoices(): Observable<Option[]> {
          return of([
            { value: 'us', label: 'English (US) (us)' },
          ]);
        },
      }),
      mockProvider(LocaleService, {
        getDateAndTime(): [string, string] {
          return ['2023-03-31', '05:17:49'];
        },
      }),
      mockProvider(SlideInService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Localization related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Language: English',
      'Date Format: 2023-03-31',
      'Time Format: 05:17:49',
      'Timezone: America/New_York',
      'Console Keyboard Map: English (US) (us)',
    ]);
  });

  it('opens Localization form when Settings button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await configureButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(LocalizationFormComponent, {
      data: {
        dateFormat: undefined, kbdMap: 'us', language: 'en', timeFormat: undefined, timezone: 'America/New_York',
      },
    });
  });
});
