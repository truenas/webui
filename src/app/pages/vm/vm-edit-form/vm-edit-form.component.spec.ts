import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AsyncValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmTime,
} from 'app/enums/vm.enum';
import { GpuPciChoices } from 'app/interfaces/gpu-pci-choice.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { CriticalGpuPreventionService } from 'app/services/gpu/critical-gpu-prevention.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';

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
        vm: 4,
        id: 1,
        attributes: {
          dtype: VmDeviceType.Pci,
          pptdev: 'pci_0000_02_00_0',
        },
      },
    ] as VmDevice[],
  } as VirtualMachine;

  const slideInRef: SlideInRef<VirtualMachine | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => existingVm),
  };

  const createComponent = createComponentFactory({
    component: VmEditFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideInRef, slideInRef),
      mockApi([
        mockCall('vm.bootloader_options', {
          UEFI: 'UEFI',
          UEFI_CSM: 'Legacy BIOS',
        }),
        mockCall('vm.cpu_model_choices', {
          EPYC: 'EPYC',
          Pentium: 'Pentium',
        }),
        mockCall('vm.update'),
        mockCall('system.advanced.update_gpu_pci_ids'),
        mockCall('system.advanced.get_gpu_pci_choices', {
          'GeForce [0000:02:00.0]': {
            pci_slot: '0000:02:00.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
          'Intel Arc [0000:03:00.0]': {
            pci_slot: '0000:03:00.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
        }),
      ]),
      mockAuth(),
      mockProvider(DialogService),
      mockProvider(GpuService, {
        getGpuOptions: jest.fn(() => of([
          { label: 'GeForce [0000:02:00.0]', value: '0000:02:00.0' },
          { label: 'Intel Arc [0000:03:00.0]', value: '0000:03:00.0' },
        ])),
        getRawGpuPciChoices: jest.fn(() => of({
          'GeForce [0000:02:00.0]': {
            pci_slot: '0000:02:00.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
          'Intel Arc [0000:03:00.0]': {
            pci_slot: '0000:03:00.0',
            uses_system_critical_devices: false,
            critical_reason: '',
          },
        })),
        transformGpuChoicesToOptions: jest.fn((choices: GpuPciChoices) => {
          return Object.entries(choices).map(([label, choice]) => ({
            value: choice.pci_slot,
            label: choice.uses_system_critical_devices ? `${label} (System Critical)` : label,
            disabled: false,
          }));
        }),
        addIsolatedGpuPciIds: jest.fn(() => of({})),
        getIsolatedGpuPciIds: jest.fn(() => of([
          '0000:02:00.0',
        ])),
        getAllGpus: jest.fn(() => of([
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
        ])),
      }),
      mockProvider(VmGpuService, {
        updateVmGpus: jest.fn(() => of(undefined)),
      }),
      mockProvider(CriticalGpuPreventionService, {
        setupCriticalGpuPrevention: jest.fn(() => new Map()),
      }),
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
    spectator = createComponent();
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
      'Enable Trusted Platform Module (TPM)': false,

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
      GPUs: ['GeForce [0000:02:00.0]'],
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.update', [4, {
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
      trusted_platform_module: false,
      vcpus: 1,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('sends cpu_model as null when CPU Mode is not Custom', async () => {
    await form.fillForm({
      Name: 'Edited',
      Description: 'New description',
      'Memory Size': '258 mb',
      'CPU Model': 'EPYC',
      'CPU Mode': 'Host Passthrough',
      'Minimum Memory Size': '257 mb',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.update', [4, {
      autostart: true,
      bootloader: VmBootloader.Uefi,
      cores: 2,
      cpu_mode: VmCpuMode.HostPassthrough,
      cpu_model: null,
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
      trusted_platform_module: false,
      vcpus: 1,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('updates GPU devices when form is edited and saved', async () => {
    await form.fillForm({
      GPUs: ['Intel Arc [0000:03:00.0]'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(GpuService).addIsolatedGpuPciIds).toHaveBeenCalledWith(
      ['0000:03:00.0'],
    );
    expect(spectator.inject(VmGpuService).updateVmGpus).toHaveBeenCalledWith(existingVm, ['0000:03:00.0']);
  });

  describe('GPU API call caching', () => {
    it('should cache GPU PCI choices and share between options and critical prevention', () => {
      const gpuService = spectator.inject(GpuService);
      const getRawSpy = jest.spyOn(gpuService, 'getRawGpuPciChoices');
      const transformSpy = jest.spyOn(gpuService, 'transformGpuChoicesToOptions');

      // Mock getRawGpuPciChoices to return a test observable
      getRawSpy.mockReturnValue(of({
        'Test GPU': {
          pci_slot: '0000:01:00.0',
          uses_system_critical_devices: false,
          critical_reason: '',
        },
      }));

      // Create a new component instance to test initial subscriptions
      const component = spectator.component;

      // Subscribe to both observables to trigger the caching mechanism
      const subscription1 = component.gpuOptions$.subscribe();
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const subscription2 = component['cachedGpuPciChoices$'].subscribe();

      // Should only call getRawGpuPciChoices once despite multiple subscriptions
      expect(getRawSpy).toHaveBeenCalledTimes(1);

      // Transform should be called when gpuOptions$ is subscribed
      expect(transformSpy).toHaveBeenCalled();

      // Clean up subscriptions
      subscription1.unsubscribe();
      subscription2.unsubscribe();
    });

    it('should provide cached GPU choices to critical GPU prevention', () => {
      const criticalGpuPrevention = spectator.inject(CriticalGpuPreventionService);
      const setupSpy = jest.spyOn(criticalGpuPrevention, 'setupCriticalGpuPrevention');

      // Recreate the component to capture the setupCriticalGpuPrevention call
      spectator.component.ngOnInit();

      // Verify that setupCriticalGpuPrevention was called with the cached observable
      expect(setupSpy).toHaveBeenCalledWith(
        spectator.component.form.controls.gpus,
        spectator.component,
        expect.any(String),
        expect.any(String),
        // eslint-disable-next-line @typescript-eslint/dot-notation
        spectator.component['cachedGpuPciChoices$'],
      );
    });
  });
});
