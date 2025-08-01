import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { IsolatedGpusFormComponent } from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-form/isolated-gpus-form.component';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('IsolatedGpuPcisFormComponent', () => {
  let spectator: Spectator<IsolatedGpusFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: IsolatedGpusFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              isolated_gpu_pci_ids: ['0000:00:02.0'],
            } as AdvancedConfig,
          },
        ],
      }),
      mockApi([
        mockCall('system.advanced.update_gpu_pci_ids'),
        mockCall('system.advanced.get_gpu_pci_choices', {
          'Fake HD Graphics [0000:00:01.0]': {
            pci_slot: '0000:00:01.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
          'Intel Corporation HD Graphics 510 [0000:00:02.0]': {
            pci_slot: '0000:00:02.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
          'Critical GPU [0000:00:03.0]': {
            pci_slot: '0000:00:03.0',
            uses_system_critical_devices: true,
            critical_reason: 'Critical devices found: 0000:00:01.0, 0000:00:00.0',
          },
        }),
      ]),
      mockProvider(SystemGeneralService),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(GpuService, {
        getGpuOptions: () => of([
          { label: 'Fake HD Graphics [0000:00:01.0]', value: '0000:00:01.0', disabled: false },
          { label: 'Intel Corporation HD Graphics 510 [0000:00:02.0]', value: '0000:00:02.0', disabled: false },
          {
            label: 'Critical GPU [0000:00:03.0] (System Critical)',
            value: '0000:00:03.0',
            disabled: false,
          },
        ]),
      }),
      mockProvider(IsolatedGpuValidatorService, {
        validateGpu: () => of(null),
      }),
      mockProvider(SlideInRef, { close: jest.fn(), requireConfirmationWhen: jest.fn() }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads current settings and shows them', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      GPUs: ['Intel Corporation HD Graphics 510 [0000:00:02.0]'],
    });
  });

  it('saves updated settings when Save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      GPUs: 'Fake HD Graphics [0000:00:01.0]',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update_gpu_pci_ids', [['0000:00:01.0']]);
  });
});
