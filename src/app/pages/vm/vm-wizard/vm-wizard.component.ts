import { Component } from '@angular/core';
import {
  UntypedFormArray, UntypedFormControl, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DatasetType } from 'app/enums/dataset.enum';
import { DeviceType } from 'app/enums/device-type.enum';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import {
  VmBootloader, VmCpuMode, VmDeviceType, VmTime,
} from 'app/enums/vm.enum';
import { choicesToOptions } from 'app/helpers/options.helper';
import globalHelptext from 'app/helptext/global-helptext';
import add_edit_helptext from 'app/helptext/vm/devices/device-add-edit';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { Device } from 'app/interfaces/device.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { Statfs } from 'app/interfaces/filesystem-stat.interface';
import { Job } from 'app/interfaces/job.interface';
import { VirtualMachineUpdate } from 'app/interfaces/virtual-machine.interface';
import { VmDevice, VmDeviceUpdate } from 'app/interfaces/vm-device.interface';
import { VmFormValues } from 'app/interfaces/vm-form-values.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  FieldConfig, FormParagraphConfig, FormSelectConfig, FormUploadConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { Wizard } from 'app/modules/entity/entity-form/models/wizard.interface';
import { MessageService } from 'app/modules/entity/entity-form/services/message.service';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { EntityWizardComponent } from 'app/modules/entity/entity-wizard/entity-wizard.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  NetworkService, StorageService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { VmService } from 'app/services/vm.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  template: '<ix-entity-wizard [conf]="this"></ix-entity-wizard>',
  providers: [VmService],
})
export class VmWizardComponent implements WizardConfiguration {
  addWsCall = 'vm.create' as const;
  summary: Record<string, unknown> = {};
  isLinear = true;
  summaryTitle = this.translate.instant('VM Summary');
  namesInUse: string[] = [];
  statSize: Statfs;
  displayPort: number;
  vcpus = 1;
  cores = 1;
  threads = 1;
  mode: VmCpuMode;
  model: string | null;
  title = helptext.formTitle;
  hideCancel = true;

  entityWizard: EntityWizardComponent;

  wizardConfig: Wizard[] = [
    {
      label: helptext.os_label,
      fieldConfig: [
        {
          type: 'select',
          name: 'os',
          required: true,
          placeholder: helptext.os_placeholder,
          tooltip: helptext.os_tooltip,
          options: helptext.os_options,
          validation: helptext.os_validation,
        },
        {
          type: 'checkbox',
          name: 'hyperv_enlightenments',
          placeholder: helptext.hyperv_enlightenments_placeholder,
          tooltip: helptext.hyperv_enlightenments_tooltip,
          value: false,
          isHidden: false,
          relation: [
            {
              action: RelationAction.Show,
              when: [
                {
                  name: 'os',
                  value: 'Windows',
                },
              ],
            },
          ],
        },
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.name_placeholder,
          tooltip: helptext.name_tooltip,
          validation: [Validators.required, Validators.pattern('^[a-zA-Z0-9_]*$'), forbiddenValues(this.namesInUse)],
          required: true,
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.description_placeholder,
          tooltip: helptext.description_tooltip,
        },
        {
          name: 'time',
          type: 'select',
          placeholder: helptext.time_placeholder,
          tooltip: helptext.time_tooltip,
          validation: [Validators.required],
          required: true,
          value: VmTime.Local,
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
          value: 90,
          placeholder: helptext.shutdown_timeout.placeholder,
          tooltip: helptext.shutdown_timeout.tooltip,
          validation: helptext.shutdown_timeout.validation,
        },
        {
          type: 'checkbox',
          name: 'autostart',
          placeholder: helptext.autostart_placeholder,
          tooltip: helptext.autostart_tooltip,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'enable_display',
          placeholder: helptext.enable_display_placeholder,
          tooltip: helptext.enable_display_tooltip,
          value: true,
          isHidden: false,
        },
        {
          name: 'wait',
          placeholder: add_edit_helptext.wait_placeholder,
          tooltip: add_edit_helptext.wait_tooltip,
          type: 'checkbox',
          value: false,
        },
        {
          type: 'select',
          name: 'display_type',
          placeholder: this.translate.instant('Display Type'),
          options: [{ label: 'VNC', value: 'VNC' }, { label: 'SPICE', value: 'SPICE' }],
          required: true,
          value: 'VNC',
          validation: [Validators.required],
        },
        {
          type: 'select',
          name: 'bind',
          placeholder: helptext.display_bind_placeholder,
          tooltip: helptext.display_bind_tooltip,
          options: [],
          required: true,
          validation: [Validators.required],
        },
      ],
    },
    {
      label: helptext.vcpus_label,
      fieldConfig: [
        {
          type: 'paragraph',
          name: 'vcpu_limit',
          paraText: '',
        },
        {
          type: 'input',
          name: 'vcpus',
          placeholder: helptext.vcpus_placeholder,
          inputType: 'number',
          min: 1,
          required: true,
          validation: [this.cpuValidator('threads'), Validators.required, Validators.min(1)],
          tooltip: helptext.vcpus_tooltip,
        },
        {
          type: 'input',
          name: 'cores',
          placeholder: helptext.cores.placeholder,
          inputType: 'number',
          required: true,
          validation: [this.cpuValidator('threads'), Validators.required, Validators.min(1)],
          tooltip: helptext.cores.tooltip,
        },
        {
          type: 'input',
          name: 'threads',
          placeholder: helptext.threads.placeholder,
          inputType: 'number',
          required: true,
          validation: [
            this.cpuValidator('threads'),
            Validators.required,
            Validators.min(1),
          ],
          tooltip: helptext.threads.tooltip,
        },
        {
          type: 'input',
          name: 'cpuset',
          placeholder: helptext.cpuset.placeholder,
          tooltip: helptext.cpuset.tooltip,
          validation: [Validators.pattern('^((\\d+)|(\\d+-\\d+))(,((\\d+)|(\\d+-\\d+)))*$')],
          required: false,
        },
        {
          type: 'checkbox',
          name: 'pin_vcpus',
          placeholder: helptext.pin_vcpus.placeholder,
          tooltip: helptext.pin_vcpus.tooltip,
          value: false,
          disabled: true,
          relation: [
            {
              action: RelationAction.Enable,
              when: [{
                name: 'cpuset',
                operator: '>',
                value: '',
              }],
            },
          ],
        },
        {
          type: 'select',
          name: 'cpu_mode',
          placeholder: helptext.cpu_mode.placeholder,
          tooltip: helptext.cpu_mode.tooltip,
          options: helptext.cpu_mode.options,
          isHidden: true,
          value: helptext.cpu_mode.options[0].value,
        },
        {
          type: 'select',
          name: 'cpu_model',
          placeholder: helptext.cpu_model.placeholder,
          tooltip: helptext.cpu_model.tooltip,
          options: [
            { label: '---', value: '' },
          ],
          value: '',
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [
                {
                  name: 'cpu_mode',
                  value: VmCpuMode.Custom,
                },
              ],
            },
          ],
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: helptext.memory_placeholder,
          inputType: 'text',
          validation: [
            ...helptext.memory_validation,
            this.memoryValidator('memory'),
            (control: UntypedFormControl): ValidationErrors => {
              const memoryConfig = this.wizardConfig.find((wizardConfig) => wizardConfig.label === helptext.vcpus_label)
                .fieldConfig.find((fieldConfig) => fieldConfig.name === 'memory');
              const isMemoryNan = Number.isNaN(this.storageService.convertHumanStringToNum(control.value as string));
              const errors = control.value && isMemoryNan
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                memoryConfig.hasErrors = true;
                memoryConfig.errors = globalHelptext.human_readable.input_error;
              } else {
                memoryConfig.hasErrors = false;
                memoryConfig.errors = '';
              }

              return errors;
            },
          ],
          value: '',
          required: true,
          blurStatus: true,
          blurEvent: () => this.blurEventForMemory(),
          parent: this,
          tooltip: helptext.memory_tooltip,
        },
        {
          type: 'input',
          name: 'nodeset',
          placeholder: helptext.nodeset.placeholder,
          tooltip: helptext.nodeset.tooltip,
          validation: [Validators.pattern('^((\\d+)|(\\d+-\\d+))(,((\\d+)|(\\d+-\\d+)))*$')],
          required: false,
        },
        {
          type: 'paragraph',
          name: 'memory_warning',
          paraText: helptext.memory_warning,
        },
      ],
    },
    {
      label: helptext.disks_label,
      fieldConfig: [
        {
          type: 'radio',
          name: 'disk_radio',
          options: [
            {
              label: helptext.disk_radio_options_new_label,
              value: true,
              tooltip: helptext.disk_radio_tooltip,
            },
            {
              label: helptext.disk_radio_options_existing_label,
              value: false,
            },
          ],
          value: true,
        },
        {
          type: 'select',
          name: 'hdd_type',
          placeholder: helptext.hdd_type_placeholder,
          tooltip: helptext.hdd_type_tooltip,
          options: helptext.hdd_type_options,
          value: helptext.hdd_type_value,
        },
        {
          type: 'select',
          name: 'datastore',
          tooltip: helptext.datastore_tooltip,
          placeholder: helptext.datastore_placeholder,
          options: [],
          isHidden: false,
          validation: [Validators.required],
          required: true,
        },
        {
          type: 'input',
          name: 'volsize',
          inputType: 'text',
          placeholder: helptext.volsize_placeholder,
          tooltip: helptext.volsize_tooltip,
          isHidden: false,
          blurStatus: true,
          blurEvent: () => this.blueEventForVolSize(),
          parent: this,
          validation: [
            ...helptext.volsize_validation,
            this.volSizeValidator('volsize'),
            (control: UntypedFormControl): ValidationErrors => {
              const volsizeConfig = this.wizardConfig
                .find((wizardConfig) => wizardConfig.label === helptext.disks_label)
                .fieldConfig
                .find((fieldConfig) => fieldConfig.name === 'volsize');
              const isMemoryNan = Number.isNaN(this.storageService.convertHumanStringToNum(control.value as string, false, 'mgtp'));
              const errors = control.value && isMemoryNan
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                volsizeConfig.hasErrors = true;
                volsizeConfig.errors = globalHelptext.human_readable.input_error;
              } else {
                volsizeConfig.hasErrors = false;
                volsizeConfig.errors = '';
              }

              return errors;
            },
          ],
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'datastore',
                value: undefined,
              }],
            },
          ],
          required: true,
        },
        {
          type: 'select',
          name: 'hdd_path',
          placeholder: helptext.hdd_path_placeholder,
          tooltip: helptext.hdd_path_tooltip,
          isHidden: true,
          options: [],
        },
      ],
    },
    {
      label: helptext.NIC_label,
      fieldConfig: [
        {
          name: 'NIC_type',
          placeholder: helptext.NIC_type_placeholder,
          tooltip: helptext.NIC_type_tooltip,
          type: 'select',
          options: [],
          validation: helptext.NIC_type_validation,
          required: true,
        },
        {
          name: 'NIC_mac',
          placeholder: helptext.NIC_mac_placeholder,
          tooltip: helptext.NIC_mac_tooltip,
          type: 'input',
          value: helptext.NIC_mac_value,
          validation: helptext.NIC_mac_validation,
        },
        {
          name: 'nic_attach',
          placeholder: helptext.nic_attach_placeholder,
          tooltip: helptext.nic_attach_tooltip,
          type: 'select',
          options: [],
          validation: helptext.nic_attach_validation,
          required: true,
        },
        {
          name: 'trust_guest_rx_filters',
          placeholder: helptext.trust_guest_rx_filters_placeholder,
          type: 'checkbox',
          value: false,
        },
      ],
    },
    {
      label: helptext.media_label,
      fieldConfig: [
        {
          type: 'explorer',
          name: 'iso_path',
          placeholder: helptext.iso_path_placeholder,
          initial: '/mnt',
          tooltip: helptext.iso_path_tooltip,
        },
        {
          type: 'checkbox',
          name: 'upload_iso_checkbox',
          placeholder: helptext.upload_iso_checkbox_placeholder,
          tooltip: helptext.upload_iso_checkbox_tooltip,
          value: false,
        },
        {
          type: 'explorer',
          name: 'upload_iso_path',
          placeholder: helptext.upload_iso_path_placeholder,
          initial: '/mnt',
          tooltip: helptext.upload_iso_path_tooltip,
          explorerType: ExplorerType.Directory,
          isHidden: true,
        },
        {
          type: 'upload',
          name: 'upload_iso',
          placeholder: helptext.upload_iso_placeholder,
          tooltip: helptext.upload_iso_tooltip,
          isHidden: true,
          acceptedFiles: '.img,.iso',
          fileLocation: '',
          validation: helptext.upload_iso_validation,
          message: this.messageService,
        },
      ],
    },
    {
      label: this.translate.instant('GPU'),
      fieldConfig: [
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

  private nicAttach: FormSelectConfig;
  private nicType: FormSelectConfig;
  private bootloader: FormSelectConfig;

  private currentStep = 0;
  private maxVcpus = 16;
  private gpus: Device[];
  private isolatedGpuPciIds: string[];
  private productType = this.systemGeneralService.getProductType();
  private wasFormInitialized = false;

  constructor(
    protected ws: WebSocketService,
    public vmService: VmService,
    public networkService: NetworkService,
    protected loader: AppLoaderService,
    public messageService: MessageService,
    private dialogService: DialogService,
    private storageService: StorageService,
    private translate: TranslateService,
    protected modalService: ModalService,
    private store$: Store<AppState>,
    private systemGeneralService: SystemGeneralService,
  ) { }

  preInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;
    this.ws.call('vm.maximum_supported_vcpus').pipe(untilDestroyed(this)).subscribe((max) => {
      this.maxVcpus = max;
      const vcpuLimitConf = _.find(this.wizardConfig[1].fieldConfig, { name: 'vcpu_limit' }) as FormParagraphConfig;
      vcpuLimitConf.paraText = this.translate.instant(helptext.vcpus_warning, { maxVCPUs: this.maxVcpus });
    });
    this.ws.call('device.get_info', [DeviceType.Gpu]).pipe(untilDestroyed(this)).subscribe((gpus) => {
      this.gpus = gpus;
      const gpusConf = _.find(this.wizardConfig[5].fieldConfig, { name: 'gpus' }) as FormSelectConfig;
      for (const item of gpus) {
        gpusConf.options.push({ label: item.description, value: item.addr.pci_slot });
      }
    });

    this.store$.pipe(waitForAdvancedConfig, untilDestroyed(this)).subscribe((config) => {
      this.isolatedGpuPciIds = config.isolated_gpu_pci_ids;
    });
  }

  afterInit(entityWizard: EntityWizardComponent): void {
    this.wasFormInitialized = true;
    this.ws.call('vm.query').pipe(untilDestroyed(this)).subscribe((vms) => {
      vms.forEach((i) => this.namesInUse.push(i.name));
    });

    this.ws.call('vm.device.bind_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res && Object.keys(res).length > 0) {
        const bind = _.find(this.wizardConfig[0].fieldConfig, { name: 'bind' }) as FormSelectConfig;
        Object.keys(res).forEach((address) => {
          bind.options.push({ label: address, value: address });
        });
        this.getFormControlFromFieldName('bind').setValue(res['0.0.0.0']);
      }
    });

    if (this.productType === ProductType.Scale || this.productType === ProductType.ScaleEnterprise) {
      _.find(this.wizardConfig[0].fieldConfig, { name: 'wait' })['isHidden'] = true;
      _.find(this.wizardConfig[1].fieldConfig, { name: 'cpu_mode' })['isHidden'] = false;
      const cpuModel = _.find(this.wizardConfig[1].fieldConfig, { name: 'cpu_model' }) as FormSelectConfig;
      cpuModel.isHidden = false;

      this.vmService.getCpuModels().pipe(untilDestroyed(this)).subscribe((models) => {
        for (const model in models) {
          cpuModel.options.push(
            {
              label: model, value: model,
            },
          );
        }
      });
    }

    this.ws
      .call('pool.filesystem_choices', [[DatasetType.Filesystem]])
      .pipe(map(new EntityUtils().array1dToLabelValuePair))
      .pipe(untilDestroyed(this)).subscribe((options) => {
        const config = this.wizardConfig[2].fieldConfig.find((config) => config.name === 'datastore') as FormSelectConfig;
        config.options = options;
      });

    const diskConfig = _.find(this.wizardConfig[2].fieldConfig, { name: 'hdd_path' }) as FormSelectConfig;
    this.ws.call('vm.device.disk_choices').pipe(choicesToOptions(), untilDestroyed(this)).subscribe((zvols) => {
      diskConfig.options = zvols;
    });

    this.getFormControlFromFieldName('bootloader').valueChanges.pipe(untilDestroyed(this)).subscribe((bootloader) => {
      if (!this.productType.includes(ProductType.Scale) && bootloader !== VmBootloader.Uefi) {
        _.find(this.wizardConfig[0].fieldConfig, { name: 'enable_display' })['isHidden'] = true;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'wait' })['isHidden'] = true;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'bind' }).isHidden = true;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'display_type' }).isHidden = true;
      } else {
        _.find(this.wizardConfig[0].fieldConfig, { name: 'enable_display' })['isHidden'] = false;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'bind' }).isHidden = false;
        _.find(this.wizardConfig[0].fieldConfig, { name: 'display_type' }).isHidden = false;
        if (!this.productType.includes(ProductType.Scale)) {
          _.find(this.wizardConfig[0].fieldConfig, { name: 'wait' })['isHidden'] = false;
        }
      }
    });

    this.getFormControlFromFieldName('enable_display').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (!this.productType.includes(ProductType.Scale)) {
        _.find(this.wizardConfig[0].fieldConfig, { name: 'wait' }).isHidden = !res;
      }
      _.find(this.wizardConfig[0].fieldConfig, { name: 'display_type' }).isHidden = !res;
      _.find(this.wizardConfig[0].fieldConfig, { name: 'bind' }).isHidden = !res;
      if (res) {
        this.ws.call('vm.port_wizard').pipe(untilDestroyed(this)).subscribe(({ port }) => {
          this.displayPort = port;
        });
        if (!this.productType.includes(ProductType.Scale)) {
          this.getFormControlFromFieldName('wait').enable();
        }
        this.getFormControlFromFieldName('bind').enable();
        this.getFormControlFromFieldName('display_type').enable();
      } else {
        this.getFormControlFromFieldName('wait').disable();
        this.getFormControlFromFieldName('display_type').disable();
        this.getFormControlFromFieldName('bind').disable();
      }
    });

    this.getFormControlFromFieldName('os').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.summary[this.translate.instant('Guest Operating System')] = res;
      this.getFormControlFromFieldName('name').valueChanges.pipe(untilDestroyed(this)).subscribe((name) => {
        this.summary[this.translate.instant('Name')] = name;
      });
      this.getFormControlFromFieldName('vcpus').valueChanges.pipe(untilDestroyed(this)).subscribe((vcpus) => {
        this.vcpus = vcpus;
        this.summary[this.translate.instant('Number of CPUs')] = vcpus;
      });
      this.getFormControlFromFieldName('cores').valueChanges.pipe(untilDestroyed(this)).subscribe((cores) => {
        this.cores = cores;
        this.summary[this.translate.instant('Number of Cores')] = cores;
      });
      this.getFormControlFromFieldName('threads').valueChanges.pipe(untilDestroyed(this)).subscribe((threads) => {
        this.threads = threads;
        this.summary[this.translate.instant('Number of Threads')] = threads;
      });

      if (this.productType.includes(ProductType.Scale)) {
        this.getFormControlFromFieldName('cpu_mode').valueChanges.pipe(untilDestroyed(this)).subscribe((mode) => {
          this.mode = mode;
          this.summary[this.translate.instant('CPU Mode')] = mode;

          if (mode !== VmCpuMode.Custom) {
            delete this.summary[this.translate.instant('CPU Model')];
          }
        });
        this.getFormControlFromFieldName('cpu_model').valueChanges.pipe(untilDestroyed(this)).subscribe((model) => {
          this.model = model;
          this.summary[this.translate.instant('CPU Model')] = model !== '' ? model : 'null';
        });
      }

      this.getFormControlFromFieldName('memory').valueChanges.pipe(untilDestroyed(this)).subscribe((memory: string) => {
        this.summary[this.translate.instant('Memory')] = Number.isNaN(this.storageService.convertHumanStringToNum(memory))
          ? '0 MiB'
          : this.storageService.humanReadable;
      });

      this.getFormControlFromFieldName('volsize').valueChanges.pipe(untilDestroyed(this)).subscribe((volsize) => {
        this.summary[this.translate.instant('Disk Size')] = volsize;
      });

      this.getFormControlFromFieldName('disk_radio').valueChanges.pipe(untilDestroyed(this)).subscribe((createNewDisk) => {
        if (this.summary[this.translate.instant('Disk')] || this.summary[this.translate.instant('Disk Size')]) {
          delete this.summary[this.translate.instant('Disk')];
          delete this.summary[this.translate.instant('Disk Size')];
        }
        if (createNewDisk) {
          this.summary[this.translate.instant('Disk Size')] = this.getFormControlFromFieldName('volsize').value;
          this.getFormControlFromFieldName('volsize').valueChanges.pipe(untilDestroyed(this)).subscribe((volsize) => {
            this.summary[this.translate.instant('Disk Size')] = volsize;
          });
        } else {
          this.summary[this.translate.instant('Disk')] = this.getFormControlFromFieldName('hdd_path').value;
          this.getFormControlFromFieldName('hdd_path').valueChanges.pipe(untilDestroyed(this)).subscribe((existingHddPath) => {
            this.summary[this.translate.instant('Disk')] = existingHddPath;
          });
        }
      });

      const gpusFormControl = this.getFormControlFromFieldName('gpus');
      gpusFormControl.valueChanges.pipe(untilDestroyed(this)).subscribe((gpusValue: string[]) => {
        const finalIsolatedPciIds = [...this.isolatedGpuPciIds];
        for (const gpuValue of gpusValue) {
          if (finalIsolatedPciIds.findIndex((pciId) => pciId === gpuValue) === -1) {
            finalIsolatedPciIds.push(gpuValue);
          }
        }
        const gpusConf = _.find(this.wizardConfig[5].fieldConfig, { name: 'gpus' }) as FormSelectConfig;
        if (finalIsolatedPciIds.length && finalIsolatedPciIds.length >= gpusConf.options.length) {
          const prevSelectedGpus = [];
          for (const gpu of this.gpus) {
            if (this.isolatedGpuPciIds.find((igpi) => igpi === gpu.addr.pci_slot)) {
              prevSelectedGpus.push(gpu);
            }
          }
          const gpuListItems = prevSelectedGpus.map((gpu, index) => `${index + 1}. ${gpu.description}`);
          const listItems = '<li>' + gpuListItems.join('</li><li>') + '</li>';
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

      this.getFormControlFromFieldName('datastore').valueChanges.pipe(untilDestroyed(this)).subscribe((datastore) => {
        if (datastore !== undefined && datastore !== '' && datastore !== '/mnt') {
          _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).hasErrors = false;
          _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).errors = null;
          const volsize = this.storageService.convertHumanStringToNum(this.getFormControlFromFieldName('volsize').value as string);
          this.ws.call('filesystem.statfs', [`/mnt/${datastore}`]).pipe(untilDestroyed(this)).subscribe((stat) => {
            this.statSize = stat;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' })['hasErrors'] = false;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' })['errors'] = '';
            if (stat.free_bytes < volsize) {
              const volsize = Math.floor(stat.free_bytes / (1024 ** 3));
              this.getFormControlFromFieldName('volsize').setValue(`${volsize} GiB`);
            } else if (stat.free_bytes > 40 * 1073741824) {
              const vmOs = this.getFormControlFromFieldName('os').value;
              if (vmOs === 'Windows') {
                this.getFormControlFromFieldName('volsize').setValue(this.storageService.convertBytesToHumanReadable(volsize, 0));
              } else {
                this.getFormControlFromFieldName('volsize').setValue(this.storageService.convertBytesToHumanReadable(volsize, 0));
              }
            } else if (stat.free_bytes > 10 * 1073741824) {
              this.getFormControlFromFieldName('volsize').setValue((this.storageService.convertBytesToHumanReadable(volsize, 0)));
            }
          });
        } else {
          if (datastore === '/mnt') {
            this.getFormControlFromFieldName('datastore').setValue(null);
            _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).hasErrors = true;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).errors = this.translate.instant('Virtual machines cannot be stored in an unmounted mountpoint: {datastore}', { datastore });
          }
          if (datastore === '') {
            this.getFormControlFromFieldName('datastore').setValue(null);
            _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).hasErrors = true;
            _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).errors = this.translate.instant('Please select a valid path');
          }
        }
      });
      this.getFormControlFromFieldName('iso_path').valueChanges.pipe(untilDestroyed(this)).subscribe((isoPath) => {
        if (isoPath) {
          this.summary[this.translate.instant('Installation Media')] = isoPath;
        } else {
          delete this.summary[this.translate.instant('Installation Media')];
        }
      });
      this.messageService.messageSourceHasNewMessage$.pipe(untilDestroyed(this)).subscribe((message) => {
        this.getFormControlFromFieldName('iso_path').setValue(message);
      });
      const grub = this.bootloader.options.find((option) => option.value === VmBootloader.Grub);
      const grubIndex = this.bootloader.options.indexOf(grub);
      if (res === 'Windows') {
        if (grub) {
          this.bootloader.options.splice(grubIndex, 1);
        }
        this.getFormControlFromFieldName('vcpus').setValue(2);
        this.getFormControlFromFieldName('cores').setValue(1);
        this.getFormControlFromFieldName('threads').setValue(1);
        this.getFormControlFromFieldName('memory').setValue('4 GiB');
        this.getFormControlFromFieldName('volsize').setValue('40 GiB');
      } else {
        if (!grub && !this.productType.includes(ProductType.Scale)) {
          this.bootloader.options.push({ label: 'Grub bhyve (specify grub.cfg)', value: 'GRUB' });
        }
        this.getFormControlFromFieldName('vcpus').setValue(1);
        this.getFormControlFromFieldName('cores').setValue(1);
        this.getFormControlFromFieldName('threads').setValue(1);
        this.getFormControlFromFieldName('memory').setValue('512 MiB');
        this.getFormControlFromFieldName('volsize').setValue('10 GiB');
      }
    });
    this.getFormControlFromFieldName('disk_radio').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' }).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, { name: 'hdd_path' }).isHidden = true;
        entityWizard.setDisabled('datastore', false, '2');
      } else {
        _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' }).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, { name: 'datastore' }).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, { name: 'hdd_path' }).isHidden = false;
        entityWizard.setDisabled('datastore', true, '2');
      }
    });
    this.getFormControlFromFieldName('upload_iso_checkbox').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso' })['isHidden'] = false;
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso_path' })['isHidden'] = false;
      } else {
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso' })['isHidden'] = true;
        _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso_path' })['isHidden'] = true;
      }
    });
    this.getFormControlFromFieldName('upload_iso_path').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        const config = _.find(this.wizardConfig[4].fieldConfig, { name: 'upload_iso' }) as FormUploadConfig;
        config.fileLocation = res;
      }
    });

    this.networkService.getVmNicChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      this.nicAttach = _.find(this.wizardConfig[3].fieldConfig, { name: 'nic_attach' }) as FormSelectConfig;
      this.nicAttach.options = Object.keys(res || {}).map((nicId) => ({
        label: nicId,
        value: nicId,
      }));

      this.ws.call('vm.random_mac').pipe(untilDestroyed(this)).subscribe((mac) => {
        this.getFormControlFromFieldName('NIC_mac').setValue(mac);
      });
    });
    this.nicType = _.find(this.wizardConfig[3].fieldConfig, { name: 'NIC_type' }) as FormSelectConfig;
    this.vmService.getNicTypes().forEach((item) => {
      this.nicType.options.push({ label: item[1], value: item[0] });
    });

    this.bootloader = _.find(this.wizardConfig[0].fieldConfig, { name: 'bootloader' }) as FormSelectConfig;

    this.vmService.getBootloaderOptions().pipe(untilDestroyed(this)).subscribe((options) => {
      for (const option in options) {
        this.bootloader.options.push({ label: options[option], value: option });
      }
      this.getFormControlFromFieldName('bootloader').setValue(
        this.bootloader.options[0].label,
      );
    });

    setTimeout(() => {
      const globalLabel = this.translate.instant(helptext.global_label);
      const globalTooltip = this.translate.instant(helptext.global_tooltip);

      const memoryPlaceholder = this.translate.instant(helptext.memory_placeholder);
      const memoryTooltip = this.translate.instant(helptext.memory_tooltip);
      const memoryUnit = this.translate.instant(helptext.memory_unit);
      const memoryField = _.find(this.wizardConfig[1].fieldConfig, { name: 'memory' });
      memoryField.placeholder = `${memoryPlaceholder} ${globalLabel}`;
      memoryField.tooltip = `${memoryTooltip} ${globalTooltip} ${memoryUnit}`;

      const volsizePlaceholder = this.translate.instant(helptext.volsize_placeholder);
      const volsizeTooltip = this.translate.instant(helptext.volsize_tooltip);
      const volsizeTooltipB = this.translate.instant(helptext.volsize_tooltip_B);
      const volsizeField = _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' });
      volsizeField.placeholder = `${volsizePlaceholder} ${globalLabel}`;
      volsizeField.tooltip = `${volsizeTooltip} ${globalLabel} ${volsizeTooltipB}`;
    }, 2000);
  }

  memoryValidator(name: string): ValidatorFn {
    return (control: UntypedFormControl) => {
      const memoryConfig = this.wizardConfig[1].fieldConfig.find((config) => config.name === name);

      const errors = this.storageService.convertHumanStringToNum(control.value as string) < 268435456
        ? { validMem: true }
        : null;

      if (errors) {
        memoryConfig.hasErrors = true;
        memoryConfig.warnings = helptext.memory_size_err;
      } else {
        memoryConfig.hasErrors = false;
        memoryConfig.warnings = '';
      }

      return errors;
    };
  }

  cpuValidator(name: string): ValidatorFn {
    return () => {
      if (!this.wasFormInitialized) {
        return;
      }
      const cpuConfig = this.wizardConfig[1].fieldConfig.find((config) => config.name === name);
      const vcpus = this.getFormControlFromFieldName('vcpus').value;
      const cores = this.getFormControlFromFieldName('cores').value;
      const threads = this.getFormControlFromFieldName('threads').value;

      const errors = vcpus * cores * threads > this.maxVcpus
        ? { validCPU: true }
        : null;

      if (errors) {
        cpuConfig.hasErrors = true;
        cpuConfig.warnings = this.translate.instant(helptext.vcpus_warning, { maxVCPUs: this.maxVcpus });
      } else {
        cpuConfig.hasErrors = false;
        cpuConfig.warnings = '';
      }
      return errors;
    };
  }

  volSizeValidator(name: string): ValidatorFn {
    return (control: UntypedFormControl) => {
      const sizeConfig = this.wizardConfig[2].fieldConfig.find((config) => config.name === name);

      if (control.value && this.statSize) {
        const requestedSize = this.storageService.convertHumanStringToNum(control.value as string);
        const errors = this.statSize.free_bytes < requestedSize
          ? { validStorage: true }
          : null;

        if (errors) {
          sizeConfig.hasErrors = true;
          sizeConfig.warnings = this.translate.instant('Cannot allocate {size} to storage for this virtual machine.', { size: this.storageService.humanReadable });
        } else {
          sizeConfig.hasErrors = false;
          sizeConfig.warnings = '';
        }

        return errors;
      }
    };
  }

  blurEventForMemory(): void {
    const enteredVal = this.entityWizard.formGroup.value.formArray[1].memory as string;
    const vmMemoryRequested = this.storageService.convertHumanStringToNum(enteredVal);
    if (Number.isNaN(vmMemoryRequested)) {
      console.error(vmMemoryRequested); // leaves form in previous error state
    } else if (enteredVal.replace(/\s/g, '').match(/[^0-9]/g) === null) {
      this.entityWizard.formArray.get([1]).get('memory')
        .setValue(this.storageService.convertBytesToHumanReadable(enteredVal.replace(/\s/g, ''), 0));
    } else {
      this.entityWizard.formArray.get([1]).get('memory').setValue(this.storageService.humanReadable);
      _.find(this.wizardConfig[1].fieldConfig, { name: 'memory' })['hasErrors'] = false;
      _.find(this.wizardConfig[1].fieldConfig, { name: 'memory' })['errors'] = '';
    }
  }

  blueEventForVolSize(): void {
    const enteredVal = (this.entityWizard.formArray as UntypedFormArray).controls[2].value.volsize;
    const volsize = this.storageService.convertHumanStringToNum(enteredVal as string, false, 'mgtp');
    if (volsize >= 1048576) {
      this.entityWizard.formArray.get([2]).get('volsize').setValue(this.storageService.humanReadable);
      _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' })['hasErrors'] = false;
      _.find(this.wizardConfig[2].fieldConfig, { name: 'volsize' })['errors'] = '';
    } else if (Number.isNaN(volsize)) {
      console.error(volsize); // leaves form in previous error state
    } else {
      this.entityWizard.formArray.get([2]).get('volsize').setValue('1 MiB');
    }
  }

  getFormControlFromFieldName(fieldName: string, parent: VmWizardComponent = this): UntypedFormControl {
    return parent.entityWizard.formArray.get([parent.getFormArrayIndexFromFieldName(fieldName, parent)])
      .get(fieldName) as UntypedFormControl;
  }

  getFormArrayIndexFromFieldName(fieldName: string, parent: VmWizardComponent = this): number {
    return parent.wizardConfig.findIndex((conf: FormConfiguration) => {
      return conf.fieldConfig.findIndex((fieldConf: FieldConfig) => fieldConf.name === fieldName) >= 0;
    });
  }

  customSubmit(value: VmFormValues): void {
    let hdd;
    const vmPayload: any = {};

    if (value.datastore) {
      value.datastore = value.datastore.replace('/mnt/', '');
      hdd = value.datastore + '/' + value.name.replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(7);
    }

    // zvol_payload only applies if the user is creating one
    const zvolPayload = {
      create_zvol: true,
      zvol_name: hdd,
      zvol_volsize: this.storageService.convertHumanStringToNum(value.volsize),
    };

    if (this.productType.includes(ProductType.Scale)) {
      vmPayload['cpu_mode'] = value.cpu_mode;
      vmPayload['cpu_model'] = (value.cpu_model === '' || value.cpu_mode !== VmCpuMode.Custom) ? null : value.cpu_model;
    }

    vmPayload['memory'] = value.memory;
    vmPayload['name'] = value.name;
    vmPayload['description'] = value.description;
    vmPayload['time'] = value.time;
    vmPayload['vcpus'] = value.vcpus;
    vmPayload['cores'] = value.cores;
    vmPayload['threads'] = value.threads;
    vmPayload['cpuset'] = value.cpuset;
    vmPayload['nodeset'] = value.nodeset;
    vmPayload['pin_vcpus'] = value.pin_vcpus;
    vmPayload['memory'] = Math.ceil(this.storageService.convertHumanStringToNum(value.memory) / 1024 ** 2); // bytes -> mb
    vmPayload['hyperv_enlightenments'] = value.hyperv_enlightenments;
    vmPayload['bootloader'] = value.bootloader;
    vmPayload['shutdown_timeout'] = value.shutdown_timeout;
    vmPayload['autostart'] = value.autostart;
    if (value.iso_path && value.iso_path !== undefined) {
      vmPayload['devices'] = [
        {
          dtype: VmDeviceType.Nic,
          attributes: {
            type: value.NIC_type,
            mac: value.NIC_mac,
            nic_attach: value.nic_attach,
            trust_guest_rx_filters: value.trust_guest_rx_filters,
          },
        },
        {
          dtype: VmDeviceType.Disk,
          attributes: {
            path: hdd, type: value.hdd_type, physical_sectorsize: null, logical_sectorsize: null,
          },
        },
        { dtype: VmDeviceType.Cdrom, attributes: { path: value.iso_path } },
      ];
    } else {
      vmPayload['devices'] = [
        {
          dtype: VmDeviceType.Nic,
          attributes: {
            type: value.NIC_type,
            mac: value.NIC_mac,
            nic_attach: value.nic_attach,
            trust_guest_rx_filters: value.trust_guest_rx_filters,
          },
        },
        {
          dtype: VmDeviceType.Disk,
          attributes: {
            path: hdd, type: value.hdd_type, physical_sectorsize: null, logical_sectorsize: null,
          },
        },
      ];
    }

    if (value.gpus) {
      for (const gpuPciSlot of value.gpus) {
        const gpuIndex = this.gpus.findIndex((gpu) => gpu.addr.pci_slot === gpuPciSlot);
        vmPayload['devices'].push(...this.gpus[gpuIndex].devices.map((gpuDevice) => ({
          dtype: VmDeviceType.Pci,
          attributes: {
            pptdev: gpuDevice.vm_pci_slot,
          },
        })));
      }
    }

    if (value.enable_display) {
      if (this.productType.includes(ProductType.Scale)) {
        vmPayload['devices'].push({
          dtype: VmDeviceType.Display,
          attributes: {
            port: this.displayPort,
            bind: value.bind,
            password: '',
            web: true,
            type: value.display_type,
          },
        });
      } else if (value.bootloader === VmBootloader.Uefi) {
        vmPayload['devices'].push({
          dtype: VmDeviceType.Display,
          attributes: {
            wait: value.wait,
            port: this.displayPort,
            resolution: '1024x768',
            bind: value.bind,
            password: '',
            web: true,
            type: value.display_type,
          },
        });
      }
    }

    this.loader.open();
    if (value.gpus) {
      const finalIsolatedPciIds = [...this.isolatedGpuPciIds];
      for (const gpuValue of value.gpus) {
        if (finalIsolatedPciIds.findIndex((pciId) => pciId === gpuValue) === -1) {
          finalIsolatedPciIds.push(gpuValue);
        }
      }
      this.ws.call('system.advanced.update', [{ isolated_gpu_pci_ids: finalIsolatedPciIds }])
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => res,
          error: (err: Job<null, unknown[]>) => new EntityUtils().handleWsError(this.entityWizard, err),
        });
    }
    if (value.hdd_path) {
      for (const device of vmPayload['devices']) {
        if (device.dtype === VmDeviceType.Disk) {
          if (device.attributes.create_zvol) {
            delete device.attributes.path;
          } else {
            device.attributes.path = value.hdd_path;
          }
        }
      }

      const devices: VmDeviceUpdate[] = [...vmPayload['devices']];
      delete vmPayload['devices'];
      this.ws.call('vm.create', [vmPayload as VirtualMachineUpdate]).pipe(untilDestroyed(this)).subscribe({
        next: (newVm) => {
          const observables: Observable<unknown>[] = [];
          for (const device of devices) {
            device.vm = newVm.id;
            observables.push(this.ws.call('vm.device.create', [device]).pipe(
              map((res) => res),
              catchError((err) => {
                err.device = { ...device };
                throw err;
              }),
            ));
          }
          combineLatest(observables).pipe(untilDestroyed(this)).subscribe(
            {
              next: () => {
                this.loader.close();
                this.modalService.closeSlideIn();
              },
              error: (error: WebsocketError & { device: VmDevice }) => {
                setTimeout(() => {
                  this.deleteVm(newVm.id, error);
                }, 1000);
              },
            },
          );
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.errorReport(this.translate.instant('Error creating VM.'), error.reason, error.trace.formatted);
        },
      });
    } else {
      for (const device of vmPayload['devices']) {
        if (device.dtype === VmDeviceType.Disk) {
          const origHdd = device.attributes.path;
          const createZvol = zvolPayload['create_zvol'];
          const zvolName = zvolPayload['zvol_name'];
          const zvolVolsize = zvolPayload['zvol_volsize'];

          if (createZvol) {
            delete device.attributes.path;
          } else {
            device.attributes.path = origHdd;
          }
          device.attributes.type = value.hdd_type;
          device.attributes.create_zvol = createZvol;
          device.attributes.zvol_name = zvolName;
          device.attributes.zvol_volsize = zvolVolsize;
        }
      }

      const devices: VmDeviceUpdate[] = [...vmPayload['devices']];
      delete vmPayload['devices'];
      this.ws.call('vm.create', [vmPayload as VirtualMachineUpdate]).pipe(untilDestroyed(this)).subscribe({
        next: (newVm) => {
          const observables: Observable<unknown>[] = [];
          for (const device of devices) {
            device.vm = newVm.id;
            observables.push(this.ws.call('vm.device.create', [device]).pipe(
              map((res) => res),
              catchError((err) => {
                err.device = { ...device };
                throw err;
              }),
            ));
          }
          combineLatest(observables).pipe(untilDestroyed(this)).subscribe(
            {
              next: () => {
                this.loader.close();
                this.modalService.closeSlideIn();
              },
              error: (error: WebsocketError & { device: VmDevice }) => {
                setTimeout(() => {
                  this.deleteVm(newVm.id, error);
                }, 1000);
              },
            },
          );
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.errorReport(this.translate.instant('Error creating VM.'), error.reason, error.trace.formatted);
        },
      });
    }
  }

  deleteVm(id: number, error: WebsocketError & { device: VmDevice }): void {
    this.ws.call('vm.delete', [id, { zvols: false, force: false }]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.dialogService.errorReport(
          this.translate.instant('Error creating VM.'),
          this.translate.instant(
            'Error while creating the {device} device.\n {reason}',
            { device: error.device.dtype, reason: error.reason },
          ),
          error.trace.formatted,
        );
      },
      error: (err: Job<null, unknown[]> | WebsocketError) => {
        this.loader.close();
        this.dialogService.errorReport(
          this.translate.instant('Error creating VM.'),
          this.translate.instant(
            'Error while creating the {device} device.\n {reason}',
            { device: error.device.dtype, reason: error.reason },
          ),
          error.trace.formatted,
        );
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    });
  }
}
