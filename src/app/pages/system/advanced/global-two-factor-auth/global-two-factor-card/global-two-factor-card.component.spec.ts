import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { GlobalTwoFactorAuthCardComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

describe('GlobalTwoFactorAuthCardComponent', () => {
  let spectator: Spectator<GlobalTwoFactorAuthCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: GlobalTwoFactorAuthCardComponent,
    providers: [
      mockAuth(),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockApi([
        mockCall('auth.twofactor.config', {
          window: 3,
          enabled: false,
          services: { ssh: false },
        } as GlobalTwoFactorConfig),
        mockCall('auth.twofactor.update'),
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
    expect(spectator.query('ix-global-two-factor-auth-form')).toBeNull();

    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.query('ix-global-two-factor-auth-form')).not.toBeNull();
  });

  it('closes the side panel when the hosted form emits closed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();
    spectator.detectChanges();
    expect(spectator.query('ix-global-two-factor-auth-form')).not.toBeNull();

    spectator.query(GlobalTwoFactorAuthFormComponent).closed.emit(true);
    spectator.detectChanges();

    expect(spectator.query('ix-global-two-factor-auth-form')).toBeNull();
  });
});
