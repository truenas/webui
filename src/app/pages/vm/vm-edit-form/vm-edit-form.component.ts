import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmTime, vmTimeNames,
} from 'app/enums/vm.enum';
import { choicesToOptions, mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { VirtualMachine, VirtualMachineUpdate } from 'app/interfaces/virtual-machine.interface';
import { VmPciPassthroughDevice } from 'app/interfaces/vm-device.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { byVmPciSlots } from 'app/pages/vm/utils/by-vm-pci-slots';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { vmCpusetPattern, vmNodesetPattern } from 'app/pages/vm/utils/vm-form-patterns.constant';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { DialogService, WebSocketService } from 'app/services';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const mbs = 1024 * 1024;

@UntilDestroy()
@Component({
  templateUrl: './vm-edit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CpuValidatorService, VmGpuService],
})
export class VmEditFormComponent {
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
      Validators.min(256 * mbs),
      this.translate.instant(helptext.memory_size_err),
    )],
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

  existingVm: VirtualMachine;

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private slideIn: IxSlideInService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private cpuValidator: CpuValidatorService,
    private validators: IxValidatorsService,
    private dialogService: DialogService,
    private gpuValidator: IsolatedGpuValidatorService,
    private gpuService: GpuService,
    private vmGpuService: VmGpuService,
    private snackbar: SnackbarService,
  ) {}

  setVmForEdit(vm: VirtualMachine): void {
    this.existingVm = vm;
    this.form.patchValue({
      ...vm,
      memory: vm.memory * mbs,
    });

    this.setupGpuControl(vm);
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const vmPayload = {
      ...this.form.value,
      memory: Math.round(this.form.value.memory / mbs),
    };
    delete vmPayload.gpus;

    const gpusIds = this.form.value.gpus;
    combineLatest([
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
          this.slideIn.close();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(this, error, this.dialogService);
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
}
