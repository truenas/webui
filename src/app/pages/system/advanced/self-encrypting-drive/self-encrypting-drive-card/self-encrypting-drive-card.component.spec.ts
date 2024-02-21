import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  SelfEncryptingDriveCardComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.component';
import {
  SelfEncryptingDriveFormComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('SelfEncryptingDriveCardComponent', () => {
  let spectator: Spectator<SelfEncryptingDriveCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SelfEncryptingDriveCardComponent,
    providers: [
      mockWebSocket([
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
      mockProvider(IxChainedSlideInService, {
        pushComponent: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(AdvancedSettingsService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
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
    expect(spectator.inject(IxChainedSlideInService).pushComponent).toHaveBeenCalledWith(
      SelfEncryptingDriveFormComponent,
      false,
      { sedPassword: '********', sedUser: 'admin' },
    );
  });
});
