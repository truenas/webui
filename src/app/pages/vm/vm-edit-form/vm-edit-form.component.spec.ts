import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AsyncValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmTime,
} from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { DialogService } from 'app/services/dialog.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

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
    min_memory: 256,
    nodeset: '0-1',
    hide_from_msr: false,
    ensure_display_device: true,
    devices: [
      {
        dtype: VmDeviceType.Pci,
        vm: 4,
        id: 1,
        attributes: {
          pptdev: 'pci_0000_02_00_0',
        },
      },
    ] as VmDevice[],
  } as VirtualMachine;

  const createComponent = createComponentFactory({
    component: VmEditFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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
      mockProvider(DialogService),
      mockProvider(GpuService, {
        getGpuOptions: () => of([
          { label: 'GeForce', value: '0000:02:00.0' },
          { label: 'Intel Arc', value: '0000:03:00.0' },
        ]),
        getAllGpus: () => of([
          {
            addr: {
              pci_slot: '0000:02:00.0',
            },
            description: 'Geforce',
            devices: [
              {
                pci_slot: '0000:02:00.0',
                vm_pci_slot: 'pci_0000_02_00_0',
              },
            ],
          },
          {
            addr: {
              pci_slot: '0000:03:00.0',
            },
            description: 'Intel Arc',
            devices: [
              {
                pci_slot: '0000:03:00.0',
                vm_pci_slot: 'pci_0000_03_00_0',
              },
            ],
          },
        ]),
        addIsolatedGpuPciIds: jest.fn(() => of(undefined)),
      }),
      mockProvider(VmGpuService, {
        updateVmGpus: jest.fn(() => of(undefined)),
      }),
      mockProvider(IxSlideInService),
    ],
    componentProviders: [
      mockProvider(CpuValidatorService, {
        createValidator(): AsyncValidatorFn {
          return () => of(null);
        },
      }),
      mockProvider(IsolatedGpuValidatorService, {
        validateGpu: () => of(null),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      providers: [
        { provide: SLIDE_IN_DATA, useValue: existingVm },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows values when existing VM is opened for edit', async () => {
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
      'Minimum Memory Size': '256 MiB',
      'Optional: NUMA nodeset (Example: 0-1)': '0-1',

      'Hide from MSR': false,
      'Ensure Display Device': true,
      GPUs: ['GeForce'],
    });
  });

  it('saves updated VM when form is edited and saved', async () => {
    await form.fillForm({
      Name: 'Edited',
      Description: 'New description',
      'Memory Size': '258 mb',
      'Minimum Memory Size': '257 mb',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('vm.update', [4, {
      autostart: true,
      bootloader: VmBootloader.Uefi,
      cores: 2,
      cpu_mode: VmCpuMode.Custom,
      cpu_model: 'EPYC',
      cpuset: '0-3,8-11',
      description: 'New description',
      ensure_display_device: true,
      hide_from_msr: false,
      hyperv_enlightenments: false,
      memory: 258,
      min_memory: 257,
      name: 'Edited',
      nodeset: '0-1',
      pin_vcpus: false,
      shutdown_timeout: 90,
      threads: 3,
      time: VmTime.Local,
      vcpus: 1,
    }]);
    expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
  });

  it('updates GPU devices when form is edited and saved', async () => {
    await form.fillForm({
      GPUs: ['Intel Arc'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(VmGpuService).updateVmGpus).toHaveBeenCalledWith(existingVm, ['0000:03:00.0']);
    expect(spectator.inject(GpuService).addIsolatedGpuPciIds).toHaveBeenCalledWith(['0000:03:00.0']);
  });
});
