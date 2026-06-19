import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { KernelCardComponent } from 'app/pages/system/advanced/kernel/kernel-card/kernel-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('KernelCardComponent', () => {
  let spectator: Spectator<KernelCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: KernelCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('system.advanced.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              debugkernel: true,
            } as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows kernel related settings', () => {
    const items = spectator.queryAll('.details-item');
    const itemTexts = items.map((item) => item.textContent.replace(/\s+/g, ' ').trim());

    expect(itemTexts).toEqual([
      'Enable Debug Kernel: Enabled',
    ]);
  });

  it('opens the Kernel form in a side panel when Configure is pressed', async () => {
    expect(spectator.query('ix-kernel-form')).toBeNull();

    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.query('ix-kernel-form')).not.toBeNull();
  });
});
