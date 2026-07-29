import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { GlobalTwoFactorAuthCardComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

describe('GlobalTwoFactorAuthCardComponent', () => {
  let spectator: Spectator<GlobalTwoFactorAuthCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: GlobalTwoFactorAuthCardComponent,
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => ({ success$: of(true) })),
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
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows 2fa related settings', () => {
    const items = spectator.queryAll('.details-item');
    const itemTexts = items.map((item) => {
      // Read the label's own text node (excludes the nested ix-tooltip) and the value separately.
      const label = item.querySelector('.label').firstChild.textContent.replace(/\s+/g, ' ').trim();
      const value = item.querySelector('.value').textContent.replace(/\s+/g, ' ').trim();
      return `${label} ${value}`;
    });

    expect(itemTexts).toEqual([
      'Global 2FA: Disabled',
      'Tolerance Window: 3',
      'Two Factor Authentication for SSH: Disabled',
    ]);
  });

  it('opens the Two Factor form in a side panel when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      {
        title: 'Global Two Factor Authentication',
        editData: {
          enabled: false,
          window: 3,
          ssh: false,
        },
      },
    );
  });
});
