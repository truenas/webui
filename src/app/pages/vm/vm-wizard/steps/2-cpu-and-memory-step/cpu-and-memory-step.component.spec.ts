import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VmCpuMode } from 'app/enums/vm.enum';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import {
  CpuAndMemoryStepComponent,
} from 'app/pages/vm/vm-wizard/steps/2-cpu-and-memory-step/cpu-and-memory-step.component';

describe('CpuAndMemoryStepComponent', () => {
  let spectator: Spectator<CpuAndMemoryStepComponent>;
  let form: IxFormHarness;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CpuAndMemoryStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('vm.maximum_supported_vcpus', 27),
        mockCall('vm.cpu_model_choices', {
          486: '486',
          EPYC: 'EPYC',
        }),
      ]),
      mockProvider(CpuValidatorService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  async function fillForm(): Promise<void> {
    await form.fillForm({
      'Virtual CPUs': 2,
      Cores: 1,
      Threads: 1,
      'Optional: CPU Set (Examples: 0-3,8-11)': 2,
      'Pin vcpus': true,
      'CPU Mode': 'Custom',
      'CPU Model': 'EPYC',
      'Memory Size': '1 GiB',
      'Minimum Memory Size': '512 MiB',
      'Optional: NUMA nodeset (Example: 0-1)': 2,
    });
  }

  it('shows a form with fields for CPU and Memory settings', async () => {
    await fillForm();
    expect(spectator.component.form.value).toEqual({
      vcpus: 2,
      cores: 1,
      threads: 1,
      cpuset: '2',
      pin_vcpus: true,
      cpu_mode: VmCpuMode.Custom,
      cpu_model: 'EPYC',
      memory: 1073741824,
      min_memory: 536870912,
      nodeset: '2',
    });
  });

  it('returns summary when getSummary() is called', async () => {
    await fillForm();
    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'CPU Configuration',
        value: '2 CPUs, 1 core, 1 thread',
      },
      {
        label: 'CPU Mode',
        value: 'Custom',
      },
      {
        label: 'CPU Model',
        value: 'EPYC',
      },
      {
        label: 'Memory',
        value: '1 GiB',
      },
      {
        label: 'Minimum Memory',
        value: '512 MiB',
      },
    ]);
  });

  it('loads maximum number of vcpus and shows a message about it', () => {
    expect(spectator.query('.warning-text'))
      .toHaveText('The product of vCPUs, cores and threads must not exceed 27 on this system.');
  });
});
