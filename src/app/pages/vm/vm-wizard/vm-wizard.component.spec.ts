import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness, MatStepperNextHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmDiskMode, VmDisplayType, VmTime,
} from 'app/enums/vm.enum';
import { VirtualMachine, VmPortWizardResult } from 'app/interfaces/virtual-machine.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SummaryComponent } from 'app/modules/summary/summary.component';
import { FreeSpaceValidatorService } from 'app/pages/vm/utils/free-space-validator.service';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { OsStepComponent } from 'app/pages/vm/vm-wizard/steps/1-os-step/os-step.component';
import {
  CpuAndMemoryStepComponent,
} from 'app/pages/vm/vm-wizard/steps/2-cpu-and-memory-step/cpu-and-memory-step.component';
import { DiskStepComponent } from 'app/pages/vm/vm-wizard/steps/3-disk-step/disk-step.component';
import {
  NetworkInterfaceStepComponent,
} from 'app/pages/vm/vm-wizard/steps/4-network-interface-step/network-interface-step.component';
import {
  InstallationMediaStepComponent,
} from 'app/pages/vm/vm-wizard/steps/5-installation-media-step/installation-media-step.component';
import { GpuStepComponent } from 'app/pages/vm/vm-wizard/steps/6-gpu-step/gpu-step.component';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('VmWizardComponent', () => {
  let spectator: Spectator<VmWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let nextButton: MatStepperNextHarness;

  const createComponent = createComponentFactory({
    component: VmWizardComponent,
    imports: [
      ReactiveFormsModule,
      MatStepperModule,
    ],
    declarations: [
      OsStepComponent,
      CpuAndMemoryStepComponent,
      DiskStepComponent,
      NetworkInterfaceStepComponent,
      InstallationMediaStepComponent,
      GpuStepComponent,

      MockComponent(SummaryComponent),
    ],
    providers: [
      mockProvider(SlideInService),
      mockProvider(GpuService),
      mockProvider(VmGpuService),
      mockAuth(),
      mockWebSocket([
        mockCall('vm.create', { id: 4 } as VirtualMachine),
        mockCall('vm.query', []),
        mockCall('vm.port_wizard', { port: 13669 } as VmPortWizardResult),
        mockCall('vm.device.create'),

        mockCall('vm.bootloader_options', {
          UEFI: 'UEFI',
        }),
        mockCall('vm.device.bind_choices', {
          '10.10.16.82': '10.10.16.82',
        }),
        mockCall('vm.cpu_model_choices', {
          Pentium: 'Pentium',
        }),
        mockCall('vm.maximum_supported_vcpus', 27),
        mockCall('pool.filesystem_choices', [
          'poolio',
        ]),
        mockCall('vm.device.disk_choices', {
          '/dev/zvol/poolio/test-327brn': 'poolio/test-327brn',
        }),
        mockCall('vm.random_mac', '00:00:00:00:00:01'),
        mockCall('vm.device.nic_attach_choices', {
          eno2: 'eno2',
        }),
        mockCall('system.advanced.update_gpu_pci_ids'),
        mockCall('system.advanced.get_gpu_pci_choices', {
          'GeForce GTX 1080 [0000:03:00.0]': '0000:03:00.0',
          'GeForce GTX 1070 [0000:02:00.0]': '0000:02:00.0',
        }),
      ]),
      mockProvider(GpuService, {
        getGpuOptions: () => of([
          { label: 'GeForce GTX 1080 [0000:03:00.0]', value: '0000:03:00.0' },
          { label: 'GeForce GTX 1070 [0000:02:00.0]', value: '0000:02:00.0' },
        ]),
        addIsolatedGpuPciIds: jest.fn(() => of({})),
        getIsolatedGpuPciIds: jest.fn(() => of([
          '0000:02:00.0',
        ])),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(),
      }),
      mockProvider(IsolatedGpuValidatorService, {
        validateGpu: () => of(null),
      }),
      mockProvider(SnackbarService),
      mockProvider(FreeSpaceValidatorService, {
        validate: () => of(null),
      }),
      mockProvider(VmGpuService, {
        updateVmGpus: jest.fn(() => of(undefined)),
      }),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await updateStepHarnesses();
  });

  async function updateStepHarnesses(): Promise<void> {
    const stepper = await loader.getHarness(MatStepperHarness);
    const activeStep = (await stepper.getSteps({ selected: true }))[0];

    form = await activeStep.getHarness(IxFormHarness);
    nextButton = await activeStep.getHarness(MatStepperNextHarness.with({ text: 'Next' }));
  }

  async function fillWizard(): Promise<void> {
    await form.fillForm({
      'Guest Operating System': 'Windows',
      Name: 'test',
      Password: '12345678',
    });
    await nextButton.click();
    await updateStepHarnesses();

    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      'Zvol Location': 'poolio',
    });
    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      'Adapter Type': 'Intel e82585 (e1000)',
      'Attach NIC': 'eno2',
    });
    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      'Optional: Choose installation media image': '/mnt/iso/FreeNAS-11.3-U3.iso',
    });
    await nextButton.click();
    await updateStepHarnesses();

    await form.fillForm({
      GPUs: ['GeForce GTX 1080 [0000:03:00.0]'],
    });
    await nextButton.click();
  }

  it('sets some form fields when OS is selected', async () => {
    jest.spyOn(spectator.component.cpuAndMemoryStep.form, 'patchValue');
    jest.spyOn(spectator.component.diskStep.form, 'patchValue');

    await form.fillForm({
      'Guest Operating System': 'Windows',
      Name: 'test',
    });

    expect(spectator.component.cpuAndMemoryStep.form.patchValue).toHaveBeenCalledWith({
      cores: 1,
      memory: 4 * GiB,
      threads: 1,
      vcpus: 2,
    });
    expect(spectator.component.diskStep.form.patchValue).toHaveBeenCalledWith({
      volsize: 40 * GiB,
    });
  });

  it('shows summary on the last step of the wizard', async () => {
    await fillWizard();

    const summary = spectator.query(SummaryComponent);
    expect(summary.summary).toEqual([
      [
        { label: 'Name', value: 'test' },
        {
          label: 'Guest Operating System',
          value: 'Windows',
        },
      ],
      [
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
          value: '',
        },
        {
          label: 'Memory',
          value: '4 GiB',
        },
      ],
      [
        {
          label: 'Disk',
          value: 'Create new disk image',
        },
        {
          label: 'Disk Description',
          value: '40 GiB AHCI at poolio',
        },
      ],
      [
        {
          label: 'NIC',
          value: 'Intel e82585 (e1000) (eno2)',
        },
      ],
      [
        {
          label: 'Installation Media',
          value: '/mnt/iso/FreeNAS-11.3-U3.iso',
        },
      ],
      [
        {
          label: 'GPU',
          value: '1 GPU isolated',
        },
      ],
    ]);
  });

  it('creates a VM an VM devices when wizard is submitted', async () => {
    await fillWizard();

    jest.clearAllMocks();
    const submit = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await submit.click();

    const websocket = spectator.inject(WebSocketService);
    expect(websocket.call).toHaveBeenCalledWith('vm.create', [{
      autostart: true,
      bootloader: VmBootloader.Uefi,
      cores: 1,
      cpu_mode: VmCpuMode.Custom,
      cpu_model: null,
      cpuset: '',
      description: '',
      ensure_display_device: true,
      hide_from_msr: false,
      hyperv_enlightenments: false,
      memory: 4096,
      min_memory: null,
      name: 'test',
      nodeset: '',
      pin_vcpus: false,
      shutdown_timeout: 90,
      threads: 1,
      time: VmTime.Local,
      vcpus: 2,
    }]);
    expect(websocket.call).toHaveBeenCalledWith('vm.device.create', [{
      vm: 4,
      dtype: VmDeviceType.Nic,
      attributes: {
        mac: '00:00:00:00:00:01',
        nic_attach: 'eno2',
        trust_guest_rx_filters: false,
        type: 'E1000',
      },
    }]);
    expect(websocket.call).toHaveBeenCalledWith('vm.device.create', [{
      vm: 4,
      dtype: VmDeviceType.Disk,
      attributes: {
        create_zvol: true,
        logical_sectorsize: null,
        physical_sectorsize: null,
        type: VmDiskMode.Ahci,
        zvol_name: expect.stringContaining('poolio/test-'),
        zvol_volsize: 40 * GiB,
      },
    }]);
    expect(websocket.call).toHaveBeenCalledWith('vm.device.create', [{
      vm: 4,
      dtype: VmDeviceType.Cdrom,
      attributes: { path: '/mnt/iso/FreeNAS-11.3-U3.iso' },
    }]);
    expect(websocket.call).toHaveBeenCalledWith('vm.port_wizard');
    expect(websocket.call).toHaveBeenCalledWith('vm.device.create', [{
      dtype: VmDeviceType.Display,
      vm: 4,
      attributes: {
        bind: '0.0.0.0',
        password: '12345678',
        port: 13669,
        type: VmDisplayType.Spice,
        web: true,
      },
    }]);
    expect(spectator.inject(GpuService).addIsolatedGpuPciIds).toHaveBeenCalledWith(
      ['0000:03:00.0'],
    );
    expect(spectator.inject(VmGpuService).updateVmGpus).toHaveBeenCalledWith({ id: 4 }, ['0000:03:00.0']);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });
});
