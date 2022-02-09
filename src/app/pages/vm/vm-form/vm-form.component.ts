import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { DeviceType } from 'app/enums/device-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { VmDeviceType, VmTime } from 'app/enums/vm.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { Device } from 'app/interfaces/device.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmPciPassthroughDevice } from 'app/interfaces/vm-device.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  AppLoaderService,
  DialogService,
  StorageService,
  VmService,
  WebSocketService,
} from 'app/services';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'app-vm',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [StorageService],
})
export class VmFormComponent implements FormConfiguration {
  queryCall = 'vm.query' as const;
  editCall = 'vm.update' as const;
  isEntity = true;
  routeSuccess: string[] = ['vm'];
  protected entityForm: EntityFormComponent;
  saveButtonEnabled: boolean;
  private rawVmData: VirtualMachine;
  vcpus: number;
  cores: number;
  threads: number;
  private gpus: Device[];
  private isolatedGpuPciIds: string[];
  private maxVcpus: number;
  private productType = window.localStorage.getItem('product_type') as ProductType;
  queryCallOption: any[] = [];

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet<this>[] = [
    {
      name: helptext.vm_settings_title,
      class: 'vm_settings',
      label: true,
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.name_placeholder,
          tooltip: helptext.name_tooltip,
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.description_placeholder,
          tooltip: helptext.description_tooltip,
        },
        {
          name: 'time',
          placeholder: helptext.time_placeholder,
          tooltip: helptext.time_tooltip,
          type: 'select',
          options: [
            { label: helptext.time_local_text, value: VmTime.Local },
            { label: helptext.time_utc_text, value: VmTime.Utc },
          ],
        },
        {
          type: 'select',
          name: 'bootloader',
          placeholder: helptext.bootloader_placeholder,
          tooltip: helptext.bootloader_tooltip,
          options: [],
        },
        {
          type: 'input',
          name: 'shutdown_timeout',
          inputType: 'number',
          placeholder: helptext.shutdown_timeout.placeholder,
          tooltip: helptext.shutdown_timeout.tooltip,
          validation: helptext.shutdown_timeout.validation,
        },
        {
          type: 'checkbox',
          name: 'autostart',
          placeholder: helptext.autostart_placeholder,
          tooltip: helptext.autostart_tooltip,
        },
      ],
    },
    {
      name: 'spacer',
      class: 'spacer',
      label: false,
      width: '2%',
      config: [],
    },
    {
      name: helptext.vm_cpu_mem_title,
      class: 'vm_settings',
      label: true,
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'vcpus',
          inputType: 'number',
          placeholder: helptext.vcpus_placeholder,
          tooltip: helptext.vcpus_tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads')],
        },
        {
          type: 'input',
          name: 'cores',
          inputType: 'number',
          placeholder: helptext.cores.placeholder,
          tooltip: helptext.cores.tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads')],
        },
        {
          type: 'input',
          name: 'threads',
          inputType: 'number',
          placeholder: helptext.threads.placeholder,
          tooltip: helptext.threads.tooltip,
          validation: [Validators.required, Validators.min(1), this.cpuValidator('threads')],
        },
        {
          type: 'select',
          name: 'cpu_mode',
          placeholder: helptext.cpu_mode.placeholder,
          tooltip: helptext.cpu_mode.tooltip,
          options: helptext.cpu_mode.options,
          isHidden: true,
        },
        {
          type: 'select',
          name: 'cpu_model',
          placeholder: helptext.cpu_model.placeholder,
          tooltip: helptext.cpu_model.tooltip,
          options: [
            { label: '---', value: '' },
          ],
          isHidden: true,
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: `${this.translate.instant(helptext.memory_placeholder)} ${this.translate.instant(globalHelptext.human_readable.suggestion_label)}`,
          tooltip: helptext.memory_tooltip,
          blurStatus: true,
          blurEvent: () => this.memoryBlur(),
          parent: this,
        },

      ],
    },
    {
      name: 'spacer',
      class: 'spacer',
      label: false,
      width: '2%',
      config: [],
    },
    {
      name: this.translate.instant('GPU'),
      class: 'vm_settings',
      label: true,
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'hide_from_msr',
          placeholder: this.translate.instant('Hide from MSR'),
          value: false,
        },
        {
          type: 'checkbox',
          name: 'ensure_display_device',
          placeholder: this.translate.instant('Ensure Display Device'),
          tooltip: this.translate.instant('When checked it will ensure that the guest always has access to a video device. For headless installations like ubuntu server this is required for the guest to operate properly. However for cases where consumer would like to use GPU passthrough and does not want a display device added should uncheck this.'),
          value: true,
        },
        {
          type: 'select',
          placeholder: this.translate.instant("GPU's"),
          name: 'gpus',
          multiple: true,
          options: [],
          required: false,
        },
      ],
    },
  ];
  private bootloader: FormSelectConfig;

  constructor(
    protected router: Router,
    private loader: AppLoaderService,
    protected ws: WebSocketService,
    protected storageService: StorageService,
    protected vmService: VmService,
    protected route: ActivatedRoute,
    private translate: TranslateService,
    private dialogService: DialogService,
    private store$: Store<AppState>,
  ) {}

  preInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['pk']) {
        const opt = params.pk ? ['id', '=', parseInt(params.pk, 10)] : [];
        this.queryCallOption = [opt];
      }
    });
    this.ws.call('vm.maximum_supported_vcpus').pipe(untilDestroyed(this)).subscribe((max) => {
      this.maxVcpus = max;
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.bootloader = _.find(this.fieldConfig, { name: 'bootloader' }) as FormSelectConfig;
    this.vmService.getBootloaderOptions().pipe(untilDestroyed(this)).subscribe((options) => {
      for (const option in options) {
        this.bootloader.options.push({ label: options[option], value: option });
      }
    });

    entityForm.formGroup.controls['memory'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: string | number) => {
      const mem = _.find(this.fieldConfig, { name: 'memory' });
      if (typeof (value) === 'number') {
        value = value.toString();
      }
      const filteredValue = this.storageService.convertHumanStringToNum(value);
      mem['hasErrors'] = false;
      mem['errors'] = '';
      if (Number.isNaN(filteredValue)) {
        mem['hasErrors'] = true;
        mem['errors'] = globalHelptext.human_readable.input_error;
      }
    });

    entityForm.formGroup.controls['vcpus'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: number) => {
      this.vcpus = value;
    });
    entityForm.formGroup.controls['cores'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: number) => {
      this.cores = value;
    });
    entityForm.formGroup.controls['threads'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: number) => {
      this.threads = value;
    });

    if (this.productType.includes(ProductType.Scale)) {
      _.find(this.fieldConfig, { name: 'cpu_mode' })['isHidden'] = false;
      const cpuModel = _.find(this.fieldConfig, { name: 'cpu_model' }) as FormSelectConfig;
      cpuModel.isHidden = false;

      this.vmService.getCpuModels().pipe(untilDestroyed(this)).subscribe((models) => {
        for (const model in models) {
          cpuModel.options.push(
            {
              label: model, value: models[model],
            },
          );
        }
      });
    }

    this.store$.pipe(waitForAdvancedConfig, untilDestroyed(this)).subscribe((config) => {
      this.isolatedGpuPciIds = config.isolated_gpu_pci_ids;
    });

    const gpusFormControl = this.entityForm.formGroup.controls['gpus'];
    gpusFormControl.valueChanges.pipe(untilDestroyed(this)).subscribe((gpusValue: string[]) => {
      const finalIsolatedPciIds = [...this.isolatedGpuPciIds];
      for (const gpuValue of gpusValue) {
        if (finalIsolatedPciIds.findIndex((pciId) => pciId === gpuValue) === -1) {
          finalIsolatedPciIds.push(gpuValue);
        }
      }
      const gpusConf = _.find(this.entityForm.fieldConfig, { name: 'gpus' }) as FormSelectConfig;
      if (finalIsolatedPciIds.length && finalIsolatedPciIds.length >= gpusConf.options.length) {
        const prevSelectedGpus = [];
        for (const gpu of this.gpus) {
          if (this.isolatedGpuPciIds.find((igpi) => igpi === gpu.addr.pci_slot)) {
            prevSelectedGpus.push(gpu);
          }
        }
        const listItems = '<li>' + prevSelectedGpus.map((gpu, index) => (index + 1) + '. ' + gpu.description).join('</li><li>') + '</li>';
        gpusConf.warnings = this.translate.instant('At least 1 GPU is required by the host for it’s functions.');
        if (prevSelectedGpus.length) {
          gpusConf.warnings += this.translate.instant(
            '<p>Currently following GPU(s) have been isolated:<ol>{gpus}</ol></p>',
            { gpus: listItems },
          );
        }
        gpusConf.warnings += `<p>${this.translate.instant('With your selection, no GPU is available for the host to consume.')}</p>`;
        gpusFormControl.setErrors({ maxPCIIds: true });
      } else {
        gpusConf.warnings = null;
        gpusFormControl.setErrors(null);
      }
    });
  }

  memoryBlur(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['memory'].setValue(this.storageService.humanReadable);
      const valString = (this.entityForm.formGroup.controls['memory'].value);
      const valBytes = Math.round(this.storageService.convertHumanStringToNum(valString) / 1048576);
      if (valBytes < 256) {
        const mem = _.find(this.fieldConfig, { name: 'memory' });
        mem['hasErrors'] = true;
        mem['errors'] = helptext.memory_size_err;
      }
    }
  }

  cpuValidator(name: string): any {
    return () => {
      const config = this.fieldConfig.find((c) => c.name === name);
      setTimeout(() => {
        const errors = this.vcpus * this.cores * this.threads > this.maxVcpus
          ? { validCPU: true }
          : null;

        if (errors) {
          config.hasErrors = true;
          config.warnings = this.translate.instant(helptext.vcpus_warning, { maxVCPUs: this.maxVcpus });
        } else {
          config.hasErrors = false;
          config.warnings = '';
        }
        return errors;
      }, 100);
    };
  }

  resourceTransformIncomingRestData(vmRes: VirtualMachine): any {
    this.rawVmData = vmRes;
    (vmRes as any)['memory'] = this.storageService.convertBytestoHumanReadable(vmRes['memory'] * 1048576, 0);
    this.ws.call('device.get_info', [DeviceType.Gpu]).pipe(untilDestroyed(this)).subscribe((gpus) => {
      this.gpus = gpus;
      const vmPciSlots = (vmRes.devices
        .filter((device) => device.dtype === VmDeviceType.Pci) as VmPciPassthroughDevice[])
        .map((pciDevice) => pciDevice.attributes.pptdev);
      const gpusConf = _.find(this.entityForm.fieldConfig, { name: 'gpus' }) as FormSelectConfig;
      for (const item of gpus) {
        gpusConf.options.push({ label: item.description, value: item.addr.pci_slot });
      }
      const vmGpus = this.gpus.filter((gpu) => {
        for (const gpuPciDevice of gpu.devices) {
          if (!vmPciSlots.includes(gpuPciDevice.vm_pci_slot)) {
            return false;
          }
        }
        return true;
      });
      const gpuVmPciSlots = vmGpus.map((gpu) => gpu.addr.pci_slot);
      this.entityForm.formGroup.controls['gpus'].setValue(gpuVmPciSlots);
    });
    return vmRes;
  }

  beforeSubmit(data: any): void {
    if (data['memory'] !== undefined && data['memory'] !== null) {
      data['memory'] = Math.round(this.storageService.convertHumanStringToNum(data['memory']) / 1048576);
    }
    return data;
  }

  customSubmit(updatedVmData: any): void {
    const pciDevicesToCreate = [];
    const vmPciDeviceIdsToRemove = [];

    const prevVmPciDevices = this.rawVmData.devices.filter((device) => {
      return device.dtype === VmDeviceType.Pci;
    }) as VmPciPassthroughDevice[];
    const prevVmPciSlots: string[] = prevVmPciDevices.map((pciDevice) => pciDevice.attributes.pptdev);
    const prevGpus = this.gpus.filter((gpu) => {
      for (const gpuPciDevice of gpu.devices) {
        if (!prevVmPciSlots.includes(gpuPciDevice.vm_pci_slot)) {
          return false;
        }
      }
      return true;
    });
    const currentGpusSelected = this.gpus.filter((gpu) => updatedVmData['gpus'].includes(gpu.addr.pci_slot));

    for (const currentGpu of currentGpusSelected) {
      let found = false;
      for (const prevGpu of prevGpus) {
        if (prevGpu.addr.pci_slot === currentGpu.addr.pci_slot) {
          found = true;
        }
      }
      if (!found) {
        const gpuPciDevices = currentGpu.devices.filter((gpuPciDevice) => {
          return !prevVmPciSlots.includes(gpuPciDevice.vm_pci_slot);
        });
        const gpuPciDevicesConverted = gpuPciDevices.map((pptDev) => ({
          dtype: VmDeviceType.Pci,
          vm: this.rawVmData.id,
          attributes: {
            pptdev: pptDev.vm_pci_slot,
          },
        }));
        pciDevicesToCreate.push(...gpuPciDevicesConverted);
      }
    }

    for (const prevGpu of prevGpus) {
      let found = false;
      for (const currentGpu of currentGpusSelected) {
        if (currentGpu.addr.pci_slot === prevGpu.addr.pci_slot) {
          found = true;
        }
      }
      if (!found) {
        const prevVmGpuPciDevicesPciSlots = prevGpu.devices.map((prevGpuPciDevice) => prevGpuPciDevice.vm_pci_slot);
        const vmPciDevices = prevVmPciDevices.filter((prevVmPciDevice) => {
          return prevVmGpuPciDevicesPciSlots.includes(prevVmPciDevice.attributes.pptdev);
        });
        const vmPciDeviceIds = vmPciDevices.map((prevVmPciDevice) => prevVmPciDevice.id);
        vmPciDeviceIdsToRemove.push(...vmPciDeviceIds);
      }
    }

    const observables: Observable<unknown>[] = [];
    if (updatedVmData.gpus) {
      const finalIsolatedPciIds = [...this.isolatedGpuPciIds];
      for (const gpuValue of updatedVmData.gpus) {
        if (finalIsolatedPciIds.findIndex((pciId) => pciId === gpuValue) === -1) {
          finalIsolatedPciIds.push(gpuValue);
        }
      }
      observables.push(this.ws.call('system.advanced.update', [{ isolated_gpu_pci_ids: finalIsolatedPciIds }]));
    }

    for (const deviceId of vmPciDeviceIdsToRemove) {
      observables.push(this.ws.call('vm.device.delete', [deviceId]));
    }

    for (const device of pciDevicesToCreate) {
      observables.push(this.ws.call('vm.device.create', [device]));
    }

    delete updatedVmData['gpus'];
    this.loader.open();
    observables.push(this.ws.call('vm.update', [this.rawVmData.id, updatedVmData]));

    // TODO: Potential error - forkJoin may be needed.
    combineLatest(observables).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.routeSuccess));
      },
      (error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }
}
