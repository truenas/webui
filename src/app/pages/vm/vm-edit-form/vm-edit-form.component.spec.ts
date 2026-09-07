import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AsyncValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnFormFieldHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
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
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
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
  let closedSpy: jest.Mock;
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

  const createComponent = createComponentFactory({
    component: VmEditFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      // Close synchronously on submit — the panel's minimum-feedback timer would otherwise
      // defer `closed` past the end of the test.
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent({ props: { vmToEdit: existingVm } });
    closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  // `canSubmit()` is what enables the panel footer's Save, and it delegates through a
  // `viewChild(IxFormComponent)` — a broken view query would silently return false, disabling
  // Save in production while every other test here still passed.
  it('gates the panel Save on canSubmit()', () => {
    expect(spectator.component.canSubmit()).toBe(true);

    // Cleared through the control rather than the harness: TnInputHarness.setValue('') sends
    // no keys and throws.
    spectator.component.form.controls.name.setValue('');
    spectator.detectChanges();

    expect(spectator.component.canSubmit()).toBe(false);
  });

  // The panel footer owns Save, so the form itself must render none — an ungated in-form Save
  // would show up twice.
  it('renders no Save of its own — the panel footer owns it', async () => {
    expect(await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Save' }))).toHaveLength(0);
  });

  // Drives the panel's closeGuard; without it an edited form closes silently on backdrop click.
  it('reports unsaved changes to the panel close guard once edited', async () => {
    expect(spectator.component.hasUnsavedChanges()).toBe(false);

    await (await getInput('name')).setValue('Edited');

    expect(spectator.component.hasUnsavedChanges()).toBe(true);
  });

  // The cases below address controls by `formControlName`, which observes no label at all —
  // whereas the pre-migration label-keyed `form.getValues()` would have failed on a mislabeled
  // or untranslated field. This keeps the visible copy pinned.
  it('labels every field', async () => {
    const fields = await loader.getAllHarnesses(TnFormFieldHarness);
    const labels = await parallel(() => fields.map((field) => field.getLabel()));

    expect(labels).toEqual(expect.arrayContaining([
      'Name', 'Description', 'System Clock', 'Boot Method', 'Shutdown Timeout',
      'Virtual CPUs', 'Cores', 'Threads', 'CPU Mode', 'CPU Model',
    ]));
  });

  it('shows values when existing VM is opened for edit', async () => {
    expect(await (await getInput('name')).getValue()).toBe('My VM');
    expect(await (await getInput('description')).getValue()).toBe('My test description');
    expect(await (await getSelect('time')).getDisplayText()).toBe('Local');
    expect(await (await getSelect('bootloader')).getDisplayText()).toBe('UEFI');
    expect(await (await getInput('shutdown_timeout')).getValue()).toBe('90');
    expect(await (await getCheckbox('autostart')).isChecked()).toBe(true);
    expect(await (await getCheckbox('hyperv_enlightenments')).isChecked()).toBe(false);
    expect(await (await getCheckbox('trusted_platform_module')).isChecked()).toBe(false);

    expect(await (await getInput('vcpus')).getValue()).toBe('1');
    expect(await (await getInput('cores')).getValue()).toBe('2');
    expect(await (await getInput('threads')).getValue()).toBe('3');
    expect(await (await getInput('cpuset')).getValue()).toBe('0-3,8-11');
    expect(await (await getCheckbox('pin_vcpus')).isChecked()).toBe(false);
    expect(await (await getSelect('cpu_mode')).getDisplayText()).toBe('Custom');
    expect(await (await getSelect('cpu_model')).getDisplayText()).toBe('EPYC');
    expect(await (await getInput('nodeset')).getValue()).toBe('0-1');

    expect(await (await getCheckbox('hide_from_msr')).isChecked()).toBe(false);
    expect(await (await getCheckbox('ensure_display_device')).isChecked()).toBe(true);
    expect(await (await getSelect('gpus')).getDisplayText()).toBe('GeForce [0000:02:00.0]');

    // Byte counts render in a unit that states them exactly (tn-input `InputType.Size`).
    expect(await (await getInput('memory')).getValue()).toBe('257 MiB');
    expect(await (await getInput('min_memory')).getValue()).toBe('256 MiB');
  });

  it('saves updated VM when form is edited and saved', async () => {
    await (await getInput('name')).setValue('Edited');
    await (await getInput('description')).setValue('New description');
    await (await getInput('memory')).setValue('258 mb');
    await (await getInput('min_memory')).setValue('257 mb');

    // Hosted in a <tn-side-panel>: the panel footer owns Save and calls submit() on the form.
    spectator.component.submit();
    spectator.detectChanges();

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
    expect(closedSpy).toHaveBeenCalledWith(true);
  });

  it('sends cpu_model as null when CPU Mode is not Custom', async () => {
    await (await getInput('name')).setValue('Edited');
    await (await getInput('description')).setValue('New description');
    await (await getSelect('cpu_model')).selectOption('EPYC');
    await (await getSelect('cpu_mode')).selectOption('Host Passthrough');
    await (await getInput('memory')).setValue('258 mb');
    await (await getInput('min_memory')).setValue('257 mb');

    // Hosted in a <tn-side-panel>: the panel footer owns Save and calls submit() on the form.
    spectator.component.submit();
    spectator.detectChanges();

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
    expect(closedSpy).toHaveBeenCalledWith(true);
  });

  it('updates GPU devices when form is edited and saved', async () => {
    await (await getSelect('gpus')).selectOption('Intel Arc [0000:03:00.0]');
    await (await getSelect('gpus')).selectOption('GeForce [0000:02:00.0]');

    // Hosted in a <tn-side-panel>: the panel footer owns Save and calls submit() on the form.
    spectator.component.submit();
    spectator.detectChanges();

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
        expect.any(Object),
        expect.any(String),
        expect.any(String),
        // eslint-disable-next-line @typescript-eslint/dot-notation
        spectator.component['cachedGpuPciChoices$'],
      );
    });
  });
});
