import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Option } from 'app/interfaces/option.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { LocalizationCardComponent } from 'app/pages/system/general-settings/localization/localization-card/localization-card.component';
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
              timezone: 'America/New_York',
              kbdmap: 'us',
            },
          },
        ],
      }),
      mockProvider(SystemGeneralService, {
        kbdMapChoices(): Observable<Option[]> {
          return of([
            { value: 'us', label: 'English (US) (us)' },
          ]);
        },
        timezoneChoices(): Observable<Option[]> {
          return of([
            { value: 'America/New_York', label: 'America/New_York' },
          ]);
        },
      }),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => SlideInResult.empty()),
      }),
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
      'Timezone: America/New_York',
      'Console Keyboard Map: English (US) (us)',
    ]);
  });

  it('opens Localization form when Settings button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await configureButton.click();

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(expect.anything(), {
      title: 'Localization Settings',
      editData: {
        kbdmap: 'us',
        timezone: 'America/New_York',
      },
    });
  });
});
