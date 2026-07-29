import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness, TnStepperComponent,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VmCpuMode } from 'app/enums/vm.enum';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import {
  CpuAndMemoryStepComponent,
} from 'app/pages/vm/vm-wizard/steps/2-cpu-and-memory-step/cpu-and-memory-step.component';

describe('CpuAndMemoryStepComponent', () => {
  let spectator: Spectator<CpuAndMemoryStepComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CpuAndMemoryStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(TnStepperComponent),
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

  async function setInput(controlName: string, value: string): Promise<void> {
    const input = await loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${controlName}"]` }));
    await input.setValue(value);
  }

  async function setSelect(controlName: string, optionLabel: string): Promise<void> {
    const select = await loader.getHarness(TnSelectHarness.with({ selector: `[formControlName="${controlName}"]` }));
    await select.selectOption(optionLabel);
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function fillForm(): Promise<void> {
    await setInput('vcpus', '2');
    await setInput('cores', '1');
    await setInput('threads', '1');
    await setInput('cpuset', '2');
    const pinVcpus = await loader.getHarness(TnCheckboxHarness.with({ selector: '[formControlName="pin_vcpus"]' }));
    await pinVcpus.check();
    await setSelect('cpu_mode', 'Custom');
    await setSelect('cpu_model', 'EPYC');
    await setInput('memory', '1 GiB');
    await setInput('min_memory', '512 MiB');
    await setInput('nodeset', '2');
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
