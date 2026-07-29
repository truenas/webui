import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnSelectHarness, TnStepperComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { GpuStepComponent } from 'app/pages/vm/vm-wizard/steps/6-gpu-step/gpu-step.component';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';

describe('GpuStepComponent', () => {
  let spectator: Spectator<GpuStepComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: GpuStepComponent,
    providers: [
      mockProvider(TnStepperComponent),
      mockProvider(GpuService, {
        getRawGpuPciChoices: () => of({
          'GeForce GTX 1080 [0000:03:00.0]': {
            pci_slot: '0000:03:00.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
          'GeForce GTX 1080 Ti [0000:04:00.0]': {
            pci_slot: '0000:04:00.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
        }),
        transformGpuChoicesToOptions: (choices: Record<string, { pci_slot: string }>) => Object.entries(choices).map(
          ([label, choice]) => ({ label, value: choice.pci_slot }),
        ),
      }),
      mockProvider(IsolatedGpuValidatorService, {
        validateGpu: () => of(null),
      }),
      mockApi([
        mockCall('system.advanced.get_gpu_pci_choices', {
          'GeForce GTX 1080 [0000:03:00.0]': {
            pci_slot: '0000:03:00.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
          'GeForce GTX 1080 Ti [0000:04:00.0]': {
            pci_slot: '0000:04:00.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
        }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function fillForm(): Promise<void> {
    const hideFromMsr = await loader.getHarness(
      TnCheckboxHarness.with({ selector: '[formControlName="hide_from_msr"]' }),
    );
    await hideFromMsr.check();

    const ensureDisplayDevice = await loader.getHarness(
      TnCheckboxHarness.with({ selector: '[formControlName="ensure_display_device"]' }),
    );
    await ensureDisplayDevice.check();

    const gpusSelect = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="gpus"]' }));
    await gpusSelect.selectOption('GeForce GTX 1080 Ti [0000:04:00.0]');
  }

  it('shows form with GPU fields', async () => {
    await fillForm();

    expect(spectator.component.form.value).toEqual({
      hide_from_msr: true,
      ensure_display_device: true,
      gpus: ['0000:04:00.0'],
    });
  });

  it('returns form summary when getSummary() is called', async () => {
    await fillForm();

    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'GPU',
        value: '1 GPU isolated',
      },
    ]);
  });
});
