import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmTime, vmTimeNames,
} from 'app/enums/vm.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { VirtualMachine, VirtualMachineUpdate } from 'app/interfaces/virtual-machine.interface';
import { VmPciPassthroughDevice } from 'app/interfaces/vm-device.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { byVmPciSlots } from 'app/pages/vm/utils/by-vm-pci-slots';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { vmCpusetPattern, vmNodesetPattern } from 'app/pages/vm/utils/vm-form-patterns.constant';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './vm-edit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CpuValidatorService],
})
export class VmEditFormComponent implements OnInit {
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
    pin_vcpus: [false], // TODO: Add relationship as in wizard
    cpu_mode: [null as VmCpuMode],
    cpu_model: [''],
    memory: [null as number, this.validators.withMessage(
      Validators.min(256 * MiB),
      this.translate.instant(helptext.memory_size_err),
    )],
    min_memory: [null as number],
    nodeset: ['', Validators.pattern(vmNodesetPattern)],
    hide_from_msr: [false],
    ensure_display_device: [false],
    gpus: [[] as string[], [], [this.gpuValidator.validateGpu]],
  });

  isLoading = false;
  timeOptions$ = of(mapToOptions(vmTimeNames, this.translate));
  bootloaderOptions$ = this.ws.call('vm.bootloader_options').pipe(choicesToOptions());
  cpuModeOptions$ = of(helptext.cpu_mode.options);
  cpuModelOptions$ = this.ws.call('vm.cpu_model_choices').pipe(choicesToOptions());
  gpuOptions$ = this.gpuService.getGpuOptions();

  readonly helptext = helptext;

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

    const gpusIds = this.form.value.gpus;
    forkJoin([
      this.ws.call('vm.update', [this.existingVm.id, vmPayload as VirtualMachineUpdate]),
      this.vmGpuService.updateVmGpus(this.existingVm, gpusIds),
      this.gpuService.addIsolatedGpuPciIds(gpusIds),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackbar.success(this.translate.instant('VM updated successfully.'));
          this.slideInRef.close();
        },
        error: (error: WebsocketError) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseWsError(error));
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
    this.form.controls.cpu_mode.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.showCpuModelField = value === VmCpuMode.Custom;
    });
  }
}
