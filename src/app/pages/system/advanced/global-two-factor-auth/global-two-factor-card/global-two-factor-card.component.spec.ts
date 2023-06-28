import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { GlobalTwoFactorAuthCardComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('GlobalTwoFactorAuthCardComponent', () => {
  let spectator: Spectator<GlobalTwoFactorAuthCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: GlobalTwoFactorAuthCardComponent,
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(AdvancedSettingsService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of()),
      }),
      mockWebsocket([
        mockCall('auth.twofactor.config', {
          interval: 30,
          window: 3,
          enabled: false,
          otp_digits: 4,
          services: { ssh: false },
        } as TwoFactorConfig),
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
      'Interval: 30',
      'OTP Digits: 4',
      'Window: 3',
      'Two Factor Authentication for SSH: Disabled',
    ]);
  });

  it('opens Config Form form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(GlobalTwoFactorAuthFormComponent, {
      data: {
        interval: 30,
        window: 3,
        enabled: false,
        otp_digits: 4,
        services: { ssh: false },
      } as TwoFactorConfig,
    });
  });
});
