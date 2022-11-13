import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AsyncValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VmBootloader, VmCpuMode, VmTime } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { WebSocketService } from 'app/services';

describe('VmEditFormComponent', () => {
  let spectator: Spectator<VmEditFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const existingVm = {
    id: 4,
    name: 'My VM',
    description: 'My test description',
    time: VmTime.Local,
    bootloader: VmBootloader.Uefi,
    shutdown_timeout: 90,
    autostart: true,
    hyperv_enlightenments: false,
    vcpus: 1,
    cores: 2,
    threads: 3,
    cpuset: '0-3,8-11',
    pin_vcpus: false,
    cpu_mode: VmCpuMode.Custom,
    cpu_model: 'EPYC',
    memory: 257,
    nodeset: '0-1',
    hide_from_msr: false,
    ensure_display_device: true,
  } as VirtualMachine;

  const createComponent = createComponentFactory({
    component: VmEditFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('vm.bootloader_options', {
          UEFI: 'UEFI',
          UEFI_CSM: 'Legacy BIOS',
        }),
        mockCall('vm.cpu_model_choices', {
          EPYC: 'EPYC',
          Pentium: 'Pentium',
        }),
        mockCall('vm.update'),
      ]),
    ],
    componentProviders: [
      mockProvider(CpuValidatorService, {
        createValidator(): AsyncValidatorFn {
          return () => of(null);
        },
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows values when existing VM is opened for edit', async () => {
    spectator.component.setVmForEdit(existingVm);

    const formValues = await form.getValues();
    expect(formValues).toEqual({
      Name: 'My VM',
      Description: 'My test description',
      'System Clock': 'Local',
      'Boot Method': 'UEFI',
      'Shutdown Timeout': '90',
      'Start on Boot': true,
      'Enable Hyper-V Enlightenments': false,

      'Virtual CPUs': '1',
      Cores: '2',
      Threads: '3',
      'Optional: CPU Set (Examples: 0-3,8-11)': '0-3,8-11',
      'Pin vcpus': false,
      'CPU Mode': 'Custom',
      'CPU Model': 'EPYC',
      'Memory Size': '257 MiB',
      'Optional: NUMA nodeset (Example: 0-1)': '0-1',

      'Hide from MSR': false,
      'Ensure Display Device': true,
      "GPU's": [],
    });
  });

  it('saves updated VM when form is edited and saved', async () => {
    await form.fillForm({
      Name: 'Edited',
      Description: 'New description',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('vm.update', 2);
  });
});
