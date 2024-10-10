import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, forkJoin, map, of, switchMap,
  tap,
} from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { Role } from 'app/enums/role.enum';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmTime, vmCpuModeLabels, vmTimeNames,
} from 'app/enums/vm.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { Option } from 'app/interfaces/option.interface';
import { VirtualMachine, VirtualMachineUpdate } from 'app/interfaces/virtual-machine.interface';
import { VmPciPassthroughDevice } from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { byVmPciSlots } from 'app/pages/vm/utils/by-vm-pci-slots';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { vmCpusetPattern, vmNodesetPattern } from 'app/pages/vm/utils/vm-form-patterns.constant';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-vm-edit-form',
  templateUrl: './vm-edit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CpuValidatorService],
})
export class VmEditFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.VmWrite];

  showCpuModelField = true;

  form = this.formBuilder.group({
    name: ['', Validators.required],
    description: [''],
    time: [null as VmTime],
    bootloader: [null as VmBootloader],
    shutdown_timeout: [null as number, Validators.min(0)],
    autostart: [false],
    hyperv_enlightenments: [false],
    vcpus: [null as number, [Validators.required, Validators.min(1)], this.cpuValidator.createValidator()],
    cores: [null as number, [Validators.required, Validators.min(1)], this.cpuValidator.createValidator()],
    threads: [null as number, [Validators.required, Validators.min(1)], this.cpuValidator.createValidator()],
    cpuset: ['', Validators.pattern(vmCpusetPattern)],
    pin_vcpus: [false],
    cpu_mode: [null as VmCpuMode],
    cpu_model: [''],
    memory: [null as number, this.validators.withMessage(
      Validators.min(256 * MiB),
      this.translate.instant(helptextVmWizard.memory_size_err),
    )],
    min_memory: [null as number],
    nodeset: ['', Validators.pattern(vmNodesetPattern)],
    hide_from_msr: [false],
    ensure_display_device: [false],
    gpus: [[] as string[], [], [this.gpuValidator.validateGpu]],
  });

  private readonly gpuOptions = signal<Option[]>([]);
  isLoading = false;
  timeOptions$ = of(mapToOptions(vmTimeNames, this.translate));
  bootloaderOptions$ = this.ws.call('vm.bootloader_options').pipe(choicesToOptions());
  cpuModeOptions$ = of(mapToOptions(vmCpuModeLabels, this.translate));
  cpuModelOptions$ = this.ws.call('vm.cpu_model_choices').pipe(choicesToOptions());
  gpuOptions$ = this.gpuService.getGpuOptions().pipe(tap((options) => this.gpuOptions.set(options)));

  readonly helptext = helptextVmWizard;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private cpuValidator: CpuValidatorService,
    private validators: IxValidatorsService,
    private dialogService: DialogService,
    private gpuValidator: IsolatedGpuValidatorService,
    private gpuService: GpuService,
    private vmGpuService: VmGpuService,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<VmEditFormComponent>,
    @Inject(SLIDE_IN_DATA) private existingVm: VirtualMachine,
  ) {}

  ngOnInit(): void {
    this.listenForFormValueChanges();

    if (this.existingVm) {
      this.setVmForEdit();
    }
  }

  setVmForEdit(): void {
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

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const vmPayload = {
      ...this.form.value,
      memory: Math.round(this.form.value.memory / MiB),
      min_memory: this.form.value.min_memory
        ? Math.round(this.form.value.min_memory / MiB)
        : null,
    };
    delete vmPayload.gpus;

    if (this.form.controls.cpu_mode.value !== VmCpuMode.Custom) {
      vmPayload.cpu_model = null;
    }

    const gpusIds = this.form.value.gpus;
    let updateVmRequest$: Observable<unknown>;

    if (gpusIds.length) {
      updateVmRequest$ = this.ws.call('system.advanced.update_gpu_pci_ids', [gpusIds]).pipe(
        switchMap(() => this.ws.call('system.advanced.get_gpu_pci_choices')),
        map((choices) => {
          const pciIds: string[] = [];
          const gpuOptions = this.gpuOptions();
          const selectedGpusDesc: string[] = gpuOptions.filter(
            (gpuOption) => gpusIds.includes(gpuOption.value.toString()),
          ).map(
            (option) => `${option.label} [${option.value}]`,
          );

          for (const selectedGpuDesc of selectedGpusDesc) {
            pciIds.push(choices[selectedGpuDesc]);
          }

          return pciIds.flat();
        }),
        switchMap((pciIds) => forkJoin([
          this.ws.call('vm.update', [this.existingVm.id, vmPayload as VirtualMachineUpdate]),
          this.vmGpuService.updateVmGpus(this.existingVm, pciIds),
          this.gpuService.addIsolatedGpuPciIds(pciIds),
        ])),
      );
    } else {
      updateVmRequest$ = this.ws.call('vm.update', [this.existingVm.id, vmPayload as VirtualMachineUpdate]);
    }

    updateVmRequest$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.snackbar.success(this.translate.instant('VM updated successfully.'));
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  private setupGpuControl(vm: VirtualMachine): void {
    const vmPciSlots = vm.devices
      .filter((device) => device.dtype === VmDeviceType.Pci)
      .map((pciDevice: VmPciPassthroughDevice) => pciDevice.attributes.pptdev);

    this.gpuService.getAllGpus().pipe(untilDestroyed(this)).subscribe((allGpus) => {
      const vmGpus = allGpus.filter(byVmPciSlots(vmPciSlots));

      const vmGpuPciSlots = vmGpus.map((gpu) => gpu.addr.pci_slot);
      this.form.controls.gpus.setValue(vmGpuPciSlots, { emitEvent: false });
    });
  }

  private listenForFormValueChanges(): void {
    this.setPinVcpusRelation();
    this.form.controls.cpu_mode.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.showCpuModelField = value === VmCpuMode.Custom;
      });
  }

  private setPinVcpusRelation(): void {
    this.form.controls.cpuset.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((cpuset) => {
        if (cpuset) {
          this.form.controls.pin_vcpus.enable();
        } else {
          this.form.controls.pin_vcpus.disable();
        }
      });
  }
}
