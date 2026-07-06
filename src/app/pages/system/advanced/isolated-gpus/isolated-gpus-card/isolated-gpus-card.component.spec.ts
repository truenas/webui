import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { Device } from 'app/interfaces/device.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  IsolatedGpusCardComponent,
} from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-card/isolated-gpus-card.component';
import { IsolatedGpusFormComponent } from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-form/isolated-gpus-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { CriticalGpuPreventionService } from 'app/services/gpu/critical-gpu-prevention.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('IsolatedGpusCardComponent', () => {
  let spectator: Spectator<IsolatedGpusCardComponent>;
  let loader: HarnessLoader;
  let formPanel: FormSidePanelService;

  const createComponent = createComponentFactory({
    component: IsolatedGpusCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('system.advanced.update_gpu_pci_ids'),
        mockCall('system.advanced.get_gpu_pci_choices', {}),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockProvider(GpuService, {
        getIsolatedGpus: jest.fn(() => of([
          { description: 'Matrox G200' } as Device,
        ])),
        getGpuOptions: () => of([]),
        getRawGpuPciChoices: () => of({}),
      }),
      mockProvider(IsolatedGpuValidatorService, {
        validateGpu: () => of(null),
      }),
      mockProvider(CriticalGpuPreventionService, {
        setupCriticalGpuPrevention: jest.fn(() => new Map<string, string>()),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              isolated_gpu_pci_ids: [],
            } as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  describe('with isolated GPUs', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      formPanel = spectator.inject(FormSidePanelService);
    });

    it('shows currently isolated GPUs', () => {
      const item = spectator.query('.details-item');
      expect(item.textContent.replace(/\s+/g, ' ').trim()).toBe('Isolated GPU Device(s):Matrox G200');
    });

    it('opens the Isolated GPU form in a side panel when Configure is pressed', async () => {
      const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
      await configureButton.click();

      expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
      expect(formPanel.open).toHaveBeenCalledWith(IsolatedGpusFormComponent, {
        title: 'Isolated GPU Device(s)',
      });
    });
  });

  describe('without isolated GPUs', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(GpuService, {
            getIsolatedGpus: jest.fn(() => of([])),
            getGpuOptions: () => of([]),
            getRawGpuPciChoices: () => of({}),
          }),
        ],
      });
    });

    it('shows an empty state when no GPUs are isolated', () => {
      expect(spectator.query('tn-empty')).not.toBeNull();
      expect(spectator.query('.details-item')).toBeNull();
    });
  });
});
