import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  SelfEncryptingDriveCardComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.component';
import {
  SelfEncryptingDriveFormComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('SelfEncryptingDriveCardComponent', () => {
  let spectator: Spectator<SelfEncryptingDriveCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SelfEncryptingDriveCardComponent,
    providers: [
      mockWebsocket([
        mockCall('system.advanced.sed_global_password', '12345678'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              sed_user: 'admin',
            },
          },
        ],
      }),
      mockProvider(IxSlideInService, {
        onClose$: of(),
      }),
      mockProvider(AdvancedSettingsService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Self Encrypting Drive settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'ATA Security User: admin',
      'Password: ********',
    ]);
  });

  it('shows SED form when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SelfEncryptingDriveFormComponent);
  });
});
