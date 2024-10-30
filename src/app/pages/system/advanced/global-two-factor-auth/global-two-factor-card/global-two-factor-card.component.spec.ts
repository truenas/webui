import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { GlobalTwoFactorAuthCardComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';

describe('GlobalTwoFactorAuthCardComponent', () => {
  let spectator: Spectator<GlobalTwoFactorAuthCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: GlobalTwoFactorAuthCardComponent,
    providers: [
      mockAuth(),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(AdvancedSettingsService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockWebSocket([
        mockCall('auth.twofactor.config', {
          window: 3,
          enabled: false,
          services: { ssh: false },
        } as GlobalTwoFactorConfig),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows 2fa related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Global 2FA: Disabled',
      'Tolerance Window: 3',
      'Two Factor Authentication for SSH: Disabled',
    ]);
  });

  it('opens Config Form form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      GlobalTwoFactorAuthFormComponent,
      false,
      {
        window: 3,
        enabled: false,
        services: { ssh: false },
      } as GlobalTwoFactorConfig,
    );
  });
});
