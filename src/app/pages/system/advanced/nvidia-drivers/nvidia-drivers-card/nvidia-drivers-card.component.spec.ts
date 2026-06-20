import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  NvidiaDriversCardComponent,
} from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-card/nvidia-drivers-card.component';
import { NvidiaDriversFormComponent } from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-form/nvidia-drivers-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('NvidiaDriversCardComponent', () => {
  let spectator: Spectator<NvidiaDriversCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: NvidiaDriversCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('system.advanced.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: { nvidia: false },
          },
        ],
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows NVIDIA drivers status as disabled when nvidia config is false', () => {
    const item = spectator.query('.details-item');
    expect(item.textContent.replace(/\s+/g, ' ').trim()).toBe('Enable NVIDIA GPU Support: Disabled');
  });

  it('shows NVIDIA drivers status as enabled when nvidia config is true', () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectAdvancedConfig, { nvidia: true });
    store$.refreshState();
    spectator.detectChanges();

    const item = spectator.query('.details-item');
    expect(item.textContent.replace(/\s+/g, ' ').trim()).toBe('Enable NVIDIA GPU Support: Enabled');
  });

  it('opens the NVIDIA Drivers form in a side panel when Configure is pressed', async () => {
    expect(spectator.query('ix-nvidia-drivers-form')).toBeNull();

    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.query('ix-nvidia-drivers-form')).not.toBeNull();
  });

  it('closes the side panel when the hosted form emits closed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();
    spectator.detectChanges();
    expect(spectator.query('ix-nvidia-drivers-form')).not.toBeNull();

    spectator.query(NvidiaDriversFormComponent).closed.emit(true);
    spectator.detectChanges();

    expect(spectator.query('ix-nvidia-drivers-form')).toBeNull();
  });
});
