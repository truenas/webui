import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DatasetType } from 'app/enums/dataset-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { VmBootloader, VmDeviceType } from 'app/enums/vm.enum';
import helptext from 'app/helptext/vm/devices/device-add-edit';
import { CoreEvent } from 'app/interfaces/events';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import {
  FieldConfig,
  FormSelectConfig,
  FormComboboxConfig,
  FormComboboxOption,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { ZvolWizardComponent } from 'app/pages/storage/volumes/zvol/zvol-wizard/zvol-wizard.component';
import { VmDeviceFieldSet } from 'app/pages/vm/vm-device-field-set.interface';
import {
  WebSocketService, NetworkService, VmService, StorageService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-device-add',
  templateUrl: './device-add.component.html',
  styleUrls: ['../../../../modules/entity/entity-form/entity-form.component.scss'],
})
export class DeviceAddComponent implements OnInit, OnDestroy {
  protected addCall = 'vm.device.create' as const;
  routeSuccess: string[];
  vmid: number;
  vmname: string;
  fieldSets: VmDeviceFieldSet[];
  isCustActionVisible = false;
  selectedType = VmDeviceType.Cdrom;
  formGroup: FormGroup;
  activeFormGroup: FormGroup;
  cdromFormGroup: FormGroup;
  diskFormGroup: FormGroup;
  nicFormGroup: FormGroup;
  rawfileFormGroup: FormGroup;
  pciFormGroup: FormGroup;
  displayFormGroup: FormGroup;
  rootpwd: FieldConfig;
  boot: FieldConfig;
  custActions: { id?: string; name: string; function: () => void }[];
  error: string;
  private productType = window.localStorage.getItem('product_type') as ProductType;

  fieldConfig: FormSelectConfig[] = [
    {
      type: 'select',
      name: 'dtype',
      placeholder: helptext.dtype_placeholder,
      options: [
        {
          label: this.translate.instant('CD-ROM'),
          value: VmDeviceType.Cdrom,
        }, {
          label: this.translate.instant('NIC'),
          value: VmDeviceType.Nic,
        }, {
          label: this.translate.instant('Disk'),
          value: VmDeviceType.Disk,
        }, {
          label: this.translate.instant('Raw File'),
          value: VmDeviceType.Raw,
        }, {
          label: this.translate.instant('PCI Passthru Device'),
          value: VmDeviceType.Pci,
        }, {
          label: this.translate.instant('Display'),
          value: VmDeviceType.Display,
        },
      ],
      value: helptext.dtype_value,
      required: true,
      validation: helptext.dtype_validation,
    },
  ];

  // cd-rom
  cdromFieldConfig: FieldConfig[] = [
    {
      type: 'explorer',
      initial: '/mnt',
      name: 'path',
      placeholder: helptext.cd_path_placeholder,
      tooltip: helptext.cd_path_tooltip,
      validation: helptext.cd_path_validation,
      required: true,
    },
    {
      name: 'order',
      placeholder: helptext.order_placeholder,
      tooltip: helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number',
    },
  ];
  // disk
  diskFieldConfig: FieldConfig[] = [
    {
      type: 'combobox',
      name: 'path',
      placeholder: helptext.zvol_path_placeholder,
      tooltip: helptext.zvol_path_tooltip,
      options: [],
      value: '',
      searchOptions: [],
      parent: this,
      updater: (value: string) => this.updateZvolSearchOptions(value),
    },
    {
      name: 'type',
      placeholder: helptext.mode_placeholder,
      tooltip: helptext.mode_tooltip,
      type: 'select',
      options: helptext.mode_options,
    },
    {
      name: 'sectorsize',
      placeholder: helptext.sectorsize_placeholder,
      tooltip: helptext.sectorsize_tooltip,
      type: 'select',
      options: helptext.sectorsize_options,
      value: 0,
    },
    {
      name: 'order',
      placeholder: helptext.order_placeholder,
      tooltip: helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number',
    },
  ];
  // nic
  nicFieldConfig: FieldConfig[] = [
    {
      name: 'type',
      placeholder: helptext.adapter_type_placeholder,
      tooltip: helptext.adapter_type_tooltip,
      type: 'select',
      options: [],
      validation: helptext.adapter_type_validation,
      required: true,
    },
    {
      name: 'mac',
      placeholder: helptext.mac_placeholder,
      tooltip: helptext.mac_tooltip,
      type: 'input',
      value: helptext.mac_value,
      validation: helptext.mac_validation,
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
      name: 'order',
      placeholder: helptext.order_placeholder,
      tooltip: helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number',
    },
  ];
  protected nicAttachField: FormSelectConfig;
  protected nicType: FormSelectConfig;

  // rawfile
  rawfileFieldConfig: FieldConfig[] = [
    {
      type: 'explorer',
      initial: '/mnt',
      name: 'path',
      placeholder: helptext.raw_file_path_placeholder,
      tooltip: helptext.raw_file_path_placeholder,
      required: true,
      validation: helptext.raw_file_path_validation,
    },
    {
      type: 'select',
      name: 'sectorsize',
      placeholder: helptext.sectorsize_placeholder,
      tooltip: helptext.sectorsize_tooltip,
      options: helptext.sectorsize_options,
      value: 0,
    },
    {
      name: 'type',
      placeholder: helptext.mode_placeholder,
      tooltip: helptext.mode_tooltip,
      type: 'select',
      options: helptext.mode_options,
    },
    {
      name: 'order',
      placeholder: helptext.order_placeholder,
      tooltip: helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number',
    },
    {
      type: 'input',
      name: 'size',
      placeholder: helptext.raw_size_placeholder,
      tooltip: helptext.raw_size_tooltip,
      inputType: 'number',
    },
    {
      type: 'input',
      name: 'rootpwd',
      placeholder: helptext.rootpwd_placeholder,
      tooltip: helptext.rootpwd_tooltip,
      inputType: 'password',
      isHidden: true,
    },
    {
      type: 'checkbox',
      name: 'boot',
      placeholder: helptext.boot_placeholder,
      tooltip: helptext.boot_tooltip,
      isHidden: true,
    },
  ];

  // pci
  pciFieldConfig: FieldConfig[] = [
    {
      name: 'pptdev',
      placeholder: helptext.pptdev_placeholder,
      tooltip: helptext.pptdev_tooltip,
      type: 'select',
      options: [],
      required: true,
    },
    {
      name: 'order',
      placeholder: helptext.order_placeholder,
      tooltip: helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number',
    },
  ];
  protected pptdev: FormSelectConfig;

  // Display
  displayFieldConfig: FieldConfig[] = [
    {
      name: 'port',
      placeholder: helptext.port_placeholder,
      tooltip: helptext.port_tooltip,
      type: 'input',
      inputType: 'number',
    },
    {
      name: 'wait',
      placeholder: helptext.wait_placeholder,
      tooltip: helptext.wait_tooltip,
      type: 'checkbox',
      isHidden: true,
    },
    {
      name: 'resolution',
      placeholder: helptext.resolution_placeholder,
      tooltip: helptext.resolution_tooltip,
      type: 'select',
      options: [],
    },
    {
      name: 'bind',
      placeholder: helptext.bind_placeholder,
      tooltip: helptext.bind_tooltip,
      type: 'select',
      options: [],
    },
    {
      name: 'password',
      placeholder: helptext.password_placeholder,
      tooltip: helptext.password_tooltip,
      type: 'input',
      togglePw: true,
      inputType: 'password',
      validation: helptext.password_validation,
    },
    {
      name: 'type',
      placeholder: helptext.type_placeholder,
      type: 'select',
      options: [
        { label: 'VNC', value: 'VNC' },
        { label: 'SPICE', value: 'SPICE' },
      ],
      value: 'VNC',
    },
    {
      name: 'web',
      placeholder: helptext.web_placeholder,
      tooltip: helptext.web_tooltip,
      type: 'checkbox',
      value: true,
    },
    {
      name: 'order',
      placeholder: helptext.order_placeholder,
      tooltip: helptext.order_tooltip,
      type: 'input',
      value: null,
      inputType: 'number',
    },
  ];

  readonly VmDeviceType = VmDeviceType;

  protected ipAddress: FormSelectConfig;

  isLoadingPci = false;

  constructor(
    protected router: Router,
    protected core: CoreService,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    public translate: TranslateService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected networkService: NetworkService,
    protected vmService: VmService,
    private modalService: ModalService,
    private storageService: StorageService,
  ) {}

  preInit(): void {
    // Display
    this.ws.call('vm.device.bind_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res && Object.keys(res).length > 0) {
        this.ipAddress = _.find(this.displayFieldConfig, { name: 'bind' }) as FormSelectConfig;
        Object.keys(res).forEach((address) => {
          this.ipAddress.options.push({ label: address, value: address });
        });
      }
    });

    this.ws.call('vm.resolution_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      const resolution = _.find(this.displayFieldConfig, { name: 'resolution' }) as FormSelectConfig;
      for (const key in res) {
        resolution.options.push({ label: key, value: res[key] });
      }
      this.displayFormGroup.controls['resolution'].setValue(res[Object.keys(res)[0]]);
    });

    this.ws.call('vm.get_display_devices', [this.vmid]).pipe(untilDestroyed(this)).subscribe((devices) => {
      if (devices.length > 1) {
        this.fieldConfig[0].options.splice(
          this.fieldConfig[0].options.findIndex((option) => option.value === VmDeviceType.Display),
        );
      }
    }, (err) => {
      new EntityUtils().handleWsError(this, err, this.dialogService);
    });

    this.core.register({ observerClass: this, eventName: 'zvolCreated' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const newZvol = {
        label: evt.data.id, value: '/dev/zvol/' + evt.data.id,
      };
      const pathField = _.find(this.diskFieldConfig, { name: 'path' }) as FormSelectConfig;
      pathField.options.splice(pathField.options.findIndex((o) => o.value === 'new'), 0, newZvol);

      this.diskFormGroup.controls['path'].setValue(newZvol.value);
    });
    // nic
    this.networkService.getVmNicChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      this.nicAttachField = _.find(this.nicFieldConfig, { name: 'nic_attach' }) as FormSelectConfig;
      this.nicAttachField.options = Object.keys(res || {}).map((nicId) => ({
        label: nicId,
        value: nicId,
      }));
    });

    this.nicType = _.find(this.nicFieldConfig, { name: 'type' }) as FormSelectConfig;
    this.vmService.getNicTypes().forEach((item) => {
      this.nicType.options.push({ label: item[1], value: item[0] });
    });

    // pci
    this.isLoadingPci = true;
    this.ws.call('vm.device.passthrough_device_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      this.pptdev = _.find(this.pciFieldConfig, { name: 'pptdev' }) as FormSelectConfig;
      this.pptdev.options = Object.keys(res || {}).map((pptdevId) => ({
        label: pptdevId,
        value: pptdevId,
      }));
      this.isLoadingPci = false;
    }, (err) => {
      this.isLoadingPci = false;
      new EntityUtils().handleWsError(this, err, this.dialogService);
    });
  }

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.vmid = Number(params['pk']);
      this.vmname = params['name'];
      this.routeSuccess = ['vm', String(this.vmid), 'devices', this.vmname];
    });

    this.preInit();

    this.fieldSets = [
      {
        name: 'FallBack',
        class: 'fallback',
        width: '100%',
        divider: false,
        fieldConfig: this.fieldConfig,
        cdromFieldConfig: this.cdromFieldConfig,
        diskFieldConfig: this.diskFieldConfig,
        nicFieldConfig: this.nicFieldConfig,
        rawfileFieldConfig: this.rawfileFieldConfig,
        pciFieldConfig: this.pciFieldConfig,
        displayFieldConfig: this.displayFieldConfig,
      },
      {
        name: 'divider',
        divider: true,
        width: '100%',
      },
    ];

    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.cdromFormGroup = this.entityFormService.createFormGroup(this.cdromFieldConfig);
    this.diskFormGroup = this.entityFormService.createFormGroup(this.diskFieldConfig);
    this.nicFormGroup = this.entityFormService.createFormGroup(this.nicFieldConfig);
    this.rawfileFormGroup = this.entityFormService.createFormGroup(this.rawfileFieldConfig);
    this.pciFormGroup = this.entityFormService.createFormGroup(this.pciFieldConfig);
    this.displayFormGroup = this.entityFormService.createFormGroup(this.displayFieldConfig);

    this.activeFormGroup = this.cdromFormGroup;
    this.diskFormGroup.controls['path'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      if (res === 'new') {
        this.diskFormGroup.controls['path'].setValue('');
        this.addZvol();
      }
    });
    this.formGroup.controls['dtype'].valueChanges.pipe(untilDestroyed(this)).subscribe((deviceType: VmDeviceType) => {
      this.selectedType = deviceType;
      switch (deviceType) {
        case VmDeviceType.Cdrom:
          this.activeFormGroup = this.cdromFormGroup;
          this.isCustActionVisible = false;
          break;
        case VmDeviceType.Nic:
          this.activeFormGroup = this.nicFormGroup;
          this.isCustActionVisible = true;
          this.generateRandomMac();
          break;
        case VmDeviceType.Disk:
          this.activeFormGroup = this.diskFormGroup;
          this.isCustActionVisible = false;
          break;
        case VmDeviceType.Raw:
          this.activeFormGroup = this.rawfileFormGroup;
          this.isCustActionVisible = false;
          break;
        case VmDeviceType.Pci:
          this.activeFormGroup = this.pciFormGroup;
          this.isCustActionVisible = false;
          break;
        case VmDeviceType.Display:
          this.activeFormGroup = this.displayFormGroup;
          this.isCustActionVisible = false;
          break;
      }
    });

    if (!this.productType.includes(ProductType.Scale)) {
      _.find(this.displayFieldConfig, { name: 'wait' }).isHidden = false;
      _.find(this.displayFieldConfig, { name: 'resolution' }).isHidden = false;
    }

    this.afterInit();
  }

  afterInit(): void {
    this.ws.call('pool.dataset.query', [[['type', '=', DatasetType.Volume]]]).pipe(untilDestroyed(this)).subscribe((zvols) => {
      zvols.forEach((zvol) => {
        const config = _.find(this.diskFieldConfig, { name: 'path' }) as FormSelectConfig;
        config.options.push(
          {
            label: zvol.id, value: '/dev/zvol/' + zvol.id,
          },
        );
      });
      const config = _.find(this.diskFieldConfig, { name: 'path' }) as FormComboboxConfig;
      config.options.push({
        label: 'Add New', value: 'new', sticky: 'bottom',
      });
    });
    // if bootloader == 'GRUB' or bootloader == "UEFI_CSM" or if VM has existing Display device, hide Display option.
    this.ws.call('vm.query', [[['id', '=', this.vmid]]]).pipe(untilDestroyed(this)).subscribe((vm) => {
      const dtypeField = _.find(this.fieldConfig, { name: 'dtype' });
      const vmDisplayDevices = _.filter(vm[0].devices, { dtype: VmDeviceType.Display });
      if (vm[0].bootloader === VmBootloader.Grub || vm[0].bootloader === VmBootloader.UefiCsm || vmDisplayDevices) {
        if (vmDisplayDevices.length) {
          dtypeField.options.forEach((option) => {
            if (option.label === 'DISPLAY') {
              _.pull(dtypeField.options, option);
            }
          });
        } else {
          const typeField = _.find(this.displayFieldConfig, { name: 'type' }) as FormSelectConfig;
          _.pull(typeField.options, _.find(typeField.options, { value: (vmDisplayDevices[0].attributes as any).type }));
          this.displayFormGroup.controls['type'].setValue(typeField.options[0].value);
        }
      }
      // if type === 'Container Provider' and rawfile boot device exists, hide rootpwd and boot fields.
      if (_.find(vm[0].devices, { dtype: VmDeviceType.Raw }) && (vm[0] as any).type === 'Container Provider') {
        vm[0].devices.forEach((element) => {
          if (element.dtype === VmDeviceType.Raw) {
            if (element.attributes.boot) {
              this.rootpwd = _.find(this.rawfileFieldConfig, { name: 'rootpwd' });
              this.rootpwd['isHidden'] = false;
              this.boot = _.find(this.rawfileFieldConfig, { name: 'boot' });
              this.boot['isHidden'] = false;
            }
          }
        });
      }
    });

    this.custActions = [
      {
        id: 'generate_mac_address',
        name: this.translate.instant('Generate MAC Address'),
        function: () => this.generateRandomMac(),
      },
    ];
    this.displayFormGroup.controls['bind'].setValue('0.0.0.0');
  }

  goBack(): void {
    this.router.navigate(new Array('/').concat(this.routeSuccess));
  }

  onSubmit(): void {
    this.error = '';
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      const device = _.cloneDeep(this.formGroup.value);
      const deviceValue = _.cloneDeep(this.activeFormGroup.value);
      const deviceOrder = deviceValue['order'];
      delete deviceValue.order;
      // ui use sectorsize field for both physical_sectorsize and logical_sectorsize prop
      deviceValue['physical_sectorsize'] = deviceValue['sectorsize'] === 0 ? null : deviceValue['sectorsize'];
      deviceValue['logical_sectorsize'] = deviceValue['sectorsize'] === 0 ? null : deviceValue['sectorsize'];
      delete deviceValue['sectorsize'];

      const payload = {
        vm: parseInt(params['pk'], 10),
        dtype: device.dtype,
        attributes: deviceValue,
        order: deviceOrder,
      };

      this.loader.open();
      this.ws.call(this.addCall, [payload]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.routeSuccess));
      },
      (error) => {
        this.loader.close();
        console.error(error);
        new EntityUtils().handleWsError(this, error, this.dialogService);
      });
    });
  }

  addZvol(): void {
    this.modalService.openInSlideIn(ZvolWizardComponent);
  }

  updateZvolSearchOptions(value = ''): void {
    this.ws.call('pool.dataset.query', [[['type', '=', DatasetType.Volume], ['id', '^', value]]]).pipe(untilDestroyed(this)).subscribe((zvols) => {
      const searchedZvols: FormComboboxOption[] = [];
      zvols.forEach((zvol) => {
        searchedZvols.push(
          {
            label: zvol.id, value: '/dev/zvol/' + zvol.id,
          },
        );
      });
      searchedZvols.push({
        label: 'Add New', value: 'new', sticky: 'bottom',
      });
      const config = _.find(this.diskFieldConfig, { name: 'path' }) as FormComboboxConfig;
      config.searchOptions = searchedZvols;
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  private generateRandomMac(): void {
    this.ws.call('vm.random_mac').pipe(untilDestroyed(this)).subscribe((randomMac) => {
      this.nicFormGroup.controls['mac'].setValue(randomMac);
    });
  }
}
