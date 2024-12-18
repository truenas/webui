import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import {
  VmBootloader, VmDisplayType, VmOs, VmTime,
} from 'app/enums/vm.enum';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { OsStepComponent } from 'app/pages/vm/vm-wizard/steps/1-os-step/os-step.component';

describe('OsStepComponent', () => {
  let spectator: Spectator<OsStepComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: OsStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('vm.query', []),
        mockCall('vm.bootloader_options', {
          UEFI: 'UEFI',
          UEFI_CSM: 'UEFI_CSM',
        }),
        mockCall('vm.device.bind_choices', {
          '0.0.0.0': '0.0.0.0',
          '10.10.16.82': '10.10.16.82',
        }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  async function fillForm(): Promise<void> {
    await form.fillForm({
      'Guest Operating System': 'Linux',
      Name: 'vm1',
      Description: 'My first VM',
      'System Clock': 'UTC',
      'Boot Method': 'UEFI',
      'Shutdown Timeout': 90,
      'Start on Boot': true,
      'Enable Display': true,
      Password: '12345678910',
      Bind: '10.10.16.82',
    });
  }

  it('shows a form with basic VM fields like name, description, OS, etc.', async () => {
    await fillForm();

    expect(spectator.component.form.value).toEqual({
      os: VmOs.Linux,
      name: 'vm1',
      description: 'My first VM',
      time: VmTime.Utc,
      bootloader: VmBootloader.Uefi,
      shutdown_timeout: 90,
      autostart: true,
      enable_display: true,
      display_type: VmDisplayType.Spice,
      bind: '10.10.16.82',
      password: '12345678910',
      hyperv_enlightenments: false,
    });
  });

  it('shows Hyper-V Enlightenments checkbox when Windows is selected as OS', async () => {
    await fillForm();

    await form.fillForm(
      {
        'Guest Operating System': 'Windows',
        'Enable Hyper-V Enlightenments': true,
      },
    );

    expect(spectator.component.form.value).toMatchObject({
      os: VmOs.Windows,
      hyperv_enlightenments: true,
    });
  });

  it('returns a summary when getSummary is called', async () => {
    await fillForm();

    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'Name',
        value: 'vm1',
      },
      {
        label: 'Guest Operating System',
        value: 'Linux',
      },
    ]);
  });
});
