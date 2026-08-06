import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  Observable, forkJoin, of, switchMap,
} from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MiB } from 'app/constants/bytes.constant';
import { Role } from 'app/enums/role.enum';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmTime, vmCpuModeLabels, vmTimeNames,
} from 'app/enums/vm.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { VirtualMachine, VirtualMachineUpdate } from 'app/interfaces/virtual-machine.interface';
import { VmPciPassthroughDevice } from 'app/interfaces/vm-device.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { vmCpusetPattern, vmNodesetPattern } from 'app/pages/vm/utils/vm-form-patterns.constant';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { CriticalGpuPreventionService } from 'app/services/gpu/critical-gpu-prevention.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';

@Component({
  selector: 'ix-vm-edit-form',
  templateUrl: './vm-edit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CpuValidatorService],
  standalone: true,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    IxInputComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class VmEditFormComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  formatter = inject(IxFormatterService);
  private cpuValidator = inject(CpuValidatorService);
  private validators = inject(IxValidatorsService);
  private gpuValidator = inject(IsolatedGpuValidatorService);
  private gpuService = inject(GpuService);
  private vmGpuService = inject(VmGpuService);
  private criticalGpuPrevention = inject(CriticalGpuPreventionService);
  private destroyRef = inject(DestroyRef);

  /**
   * The VM to edit, supplied by the `<tn-side-panel>` host. Required: this form has no add
   * mode, and `handleSubmit` dereferences the VM's id — without it the panel would open a
   * form that looks fine and then throws on Save.
   */
  readonly vmToEdit = input.required<VirtualMachine>();

  readonly requiredRoles = [Role.VmWrite];

  protected readonly InputType = InputType;

  protected showCpuModelField = true;

  form = this.formBuilder.group({
    name: ['', Validators.required],
    description: [''],
    time: [null as VmTime | null],
    bootloader: [null as VmBootloader | null],
    shutdown_timeout: [null as number | null, Validators.min(0)],
    autostart: [false],
    hyperv_enlightenments: [false],
    trusted_platform_module: [false],
    vcpus: [null as number | null, [Validators.required, Validators.min(1)], this.cpuValidator.createValidator()],
    cores: [null as number | null, [Validators.required, Validators.min(1)], this.cpuValidator.createValidator()],
    threads: [null as number | null, [Validators.required, Validators.min(1)], this.cpuValidator.createValidator()],
    cpuset: ['', Validators.pattern(vmCpusetPattern)],
    pin_vcpus: [false],
    cpu_mode: [null as VmCpuMode | null],
    cpu_model: [''],
    memory: [null as number | null, this.validators.withMessage(
      Validators.min(256 * MiB),
      this.translate.instant(helptextVmWizard.memory_size_err),
    )],
    min_memory: [null as number | null],
    nodeset: ['', Validators.pattern(vmNodesetPattern)],
    hide_from_msr: [false],
    ensure_display_device: [false],
    gpus: [[] as string[], [], [this.gpuValidator.validateGpu]],
  });

  timeOptions$ = of(mapToOptions(vmTimeNames, this.translate));
  bootloaderOptions$ = this.api.call('vm.bootloader_options').pipe(
    choicesToOptions(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  cpuModeOptions$ = of(mapToOptions(vmCpuModeLabels, this.translate));
  cpuModelOptions$ = this.api.call('vm.cpu_model_choices').pipe(
    choicesToOptions(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // Single source of truth for GPU PCI choices
  private cachedGpuPciChoices$ = this.gpuService.getRawGpuPciChoices().pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // Derive GPU options from the cached source using the service's transformation
  gpuOptions$ = this.cachedGpuPciChoices$.pipe(
    map((choices) => this.gpuService.transformGpuChoicesToOptions(choices)),
  );

  readonly helptext = helptextVmWizard;
  previouslySetGpuPciIds: string[] = [];
  criticalGpus = new Map<string, string>(); // Maps pci_slot to critical_reason

  protected existingVm: VirtualMachine;

  ngOnInit(): void {
    // Resolved here rather than in a field initializer: the `vmToEdit` input the side-panel
    // host sets is only populated before ngOnInit.
    this.existingVm = this.vmToEdit();

    this.listenForFormValueChanges();
    this.setupCriticalGpuPrevention();
    this.setVmForEdit();
  }

  private setVmForEdit(): void {
    if (this.existingVm.cpu_mode !== VmCpuMode.Custom) {
      this.showCpuModelField = false;
    }

    this.form.patchValue({
      ...this.existingVm,
      memory: this.existingVm.memory * MiB,
      min_memory: this.existingVm.min_memory ? this.existingVm.min_memory * MiB : null,
    });

    this.setupGpuControl(this.existingVm);
  }

  /**
   * Deliberately ignores the submit event and reads `this.form.value`: the event's `allValues` is
   * `getRawValue()`, which INCLUDES disabled controls. `pin_vcpus` is disabled whenever `cpuset` is
   * empty, so building the payload from `allValues` would start sending `pin_vcpus: false` for VMs
   * that never sent the key.
   */
  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const vmPayload = {
      ...this.form.value,
      memory: Math.round(Number(this.form.value.memory) / MiB),
      min_memory: this.form.value.min_memory
        ? Math.round(this.form.value.min_memory / MiB)
        : null,
    } as VirtualMachineUpdate & { gpus?: string[]; enable_secure_boot?: boolean };
    delete vmPayload.gpus;
    delete vmPayload.enable_secure_boot;

    if (this.form.controls.cpu_mode.value !== VmCpuMode.Custom) {
      vmPayload.cpu_model = null;
    }

    const gpusIds = this.form.getRawValue().gpus;
    const request$: Observable<unknown> = this.gpuService.addIsolatedGpuPciIds(gpusIds).pipe(
      switchMap(() => forkJoin([
        this.api.call('vm.update', [this.existingVm.id, vmPayload]),
        this.vmGpuService.updateVmGpus(this.existingVm, gpusIds),
      ])),
    );

    return {
      request$,
      successMessage: this.translate.instant('VM updated successfully.'),
    };
  };

  private setupGpuControl(vm: VirtualMachine): void {
    const vmPciSlots = vm.devices
      ?.filter((device) => device.attributes.dtype === VmDeviceType.Pci)
      ?.map((pciDevice: VmPciPassthroughDevice) => pciDevice.attributes.pptdev) || [];

    this.gpuService.getAllGpus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((allGpus) => {
      // Only include GPUs that have at least one of their PCI devices attached to the VM
      const vmGpus = allGpus.filter((gpu) => {
        return gpu.devices.some((pciDevice) => vmPciSlots.includes(pciDevice.vm_pci_slot));
      });

      const vmGpuPciSlots = vmGpus.map((gpu) => gpu.addr.pci_slot);
      this.previouslySetGpuPciIds = vmGpuPciSlots;
      // Set value WITH emitEvent so validators run
      this.form.controls.gpus.setValue(vmGpuPciSlots);
    });
  }

  private listenForFormValueChanges(): void {
    this.setPinVcpusRelation();
    this.form.controls.cpu_mode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.showCpuModelField = value === VmCpuMode.Custom;
      });
  }

  private setupCriticalGpuPrevention(): void {
    // Setup critical GPU prevention with cached observable
    this.criticalGpus = this.criticalGpuPrevention.setupCriticalGpuPrevention(
      this.form.controls.gpus,
      this.destroyRef,
      this.translate.instant('Cannot Select GPU'),
      this.translate.instant('System critical GPUs cannot be used for VMs'),
      this.cachedGpuPciChoices$,
    );
  }

  private setPinVcpusRelation(): void {
    this.form.controls.cpuset.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cpuset) => {
        if (cpuset) {
          this.form.controls.pin_vcpus.enable();
        } else {
          this.form.controls.pin_vcpus.disable();
        }
      });
  }
}
