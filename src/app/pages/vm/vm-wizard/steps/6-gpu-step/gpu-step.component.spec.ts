import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { GpuStepComponent } from 'app/pages/vm/vm-wizard/steps/6-gpu-step/gpu-step.component';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';

describe('GpuStepComponent', () => {
  let spectator: Spectator<GpuStepComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: GpuStepComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(GpuService, {
        getGpuOptions: () => of([
          { label: 'GeForce GTX 1080', value: '0000:03:00.0' },
          { label: 'GeForce GTX 1080 Ti', value: '0000:04:00.0' },
        ]),
      }),
      mockProvider(IsolatedGpuValidatorService, {
        validateGpu: () => of(null),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  async function fillForm(): Promise<void> {
    await form.fillForm({
      'Hide from MSR': true,
      'Ensure Display Device': true,
      GPUs: ['GeForce GTX 1080 Ti'],
    });
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
