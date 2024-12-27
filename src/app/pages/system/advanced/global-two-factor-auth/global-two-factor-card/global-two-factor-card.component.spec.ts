import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { GlobalTwoFactorAuthCardComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { SlideIn } from 'app/services/slide-in';

describe('GlobalTwoFactorAuthCardComponent', () => {
  let spectator: Spectator<GlobalTwoFactorAuthCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: GlobalTwoFactorAuthCardComponent,
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockApi([
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

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      GlobalTwoFactorAuthFormComponent,
      {
        data: {
          window: 3,
          enabled: false,
          services: { ssh: false },
        } as GlobalTwoFactorConfig,
      },
    );
  });
});
