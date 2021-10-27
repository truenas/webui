import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { CoreService } from 'app/core/services/core-service/core.service';
import { DatasetType } from 'app/enums/dataset-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { VmDeviceType } from 'app/enums/vm.enum';
import helptext from 'app/helptext/vm/devices/device-add-edit';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { VmDeviceFieldSet } from 'app/pages/vm/vm-device-field-set.interface';
import { WebSocketService, NetworkService, VmService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-device-edit',
  templateUrl: './device-edit.component.html',
  styleUrls: ['./device-edit.component.scss'],
})
export class DeviceEditComponent implements OnInit {
  protected updateCall = 'vm.device.update' as const;
  route_success: string[];
  deviceid: number;
  vmname: string;
  fieldSets: VmDeviceFieldSet[];
  isCustActionVisible = false;
  protected ipAddress: FormSelectConfig;
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
  vminfo: any;
  vmId: number;
  boot: FieldConfig;
  error: string;
  private productType = window.localStorage.getItem('product_type') as ProductType;

  custActions: { id?: string; name: string; function: () => void }[];

  fieldConfig: FieldConfig[] = [
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
      isHidden: true,
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
      disabled: false,
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
      name: 'path',
      placeholder: helptext.zvol_path_placeholder,
      tooltip: helptext.zvol_path_tooltip,
      type: 'select',
      required: true,
      validation: helptext.zvol_path_validation,
      options: [],
      disabled: false,
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
      disabled: false,
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
  protected nic_attach: FormSelectConfig;
  protected nicType: FormSelectConfig;

  // rawfile
  rawfileFieldConfig: FieldConfig[] = [
    {
      type: 'explorer',
      initial: '/mnt',
      name: 'path',
      placeholder: helptext.raw_file_path_placeholder,
      tooltip: helptext.raw_file_path_tooltip,
      required: true,
      validation: helptext.raw_file_path_validation,
      disabled: false,
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
      required: true,
      disabled: false,
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
        { label: this.translate.instant('VNC'), value: 'VNC' },
        { label: this.translate.instant('SPICE'), value: 'SPICE' },
      ],
    },
    {
      name: 'web',
      placeholder: helptext.web_placeholder,
      tooltip: helptext.web_tooltip,
      type: 'checkbox',
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

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    protected networkService: NetworkService,
    protected dialogService: DialogService,
    private core: CoreService,
    protected vmService: VmService,
    protected translate: TranslateService,
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
    });

    // nic
    this.networkService.getVmNicChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      this.nic_attach = _.find(this.nicFieldConfig, { name: 'nic_attach' }) as FormSelectConfig;
      this.nic_attach.options = Object.keys(res || {}).map((nicId) => ({
        label: nicId,
        value: nicId,
      }));
    });

    this.nicType = _.find(this.nicFieldConfig, { name: 'type' }) as FormSelectConfig;
    this.vmService.getNICTypes().forEach((item) => {
      this.nicType.options.push({ label: item[1], value: item[0] });
    });

    // pci
    this.ws.call('vm.device.passthrough_device_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      this.pptdev = _.find(this.pciFieldConfig, { name: 'pptdev' }) as FormSelectConfig;
      this.pptdev.options = Object.keys(res || {}).map((pptdevId) => ({
        label: pptdevId,
        value: pptdevId,
      }));
    });
  }
  // Setting values coming from backend and populating formgroup with it.
  setgetValues(activeformgroup: FormGroup, deviceInformation: any): void {
    for (const value in deviceInformation) {
      const fg = activeformgroup.controls[value];
      if (typeof fg !== 'undefined') {
        fg.setValue(deviceInformation[value]);
      }
    }
  }

  ngOnInit(): void {
    this.preInit();
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.deviceid = parseInt(params['pk'], 10);
      this.vmname = params['name'];
      this.vmId = params['vmid'];
      this.route_success = ['vm', params['vmid'], 'devices', this.vmname];
    });

    this.core.emit({ name: 'SysInfoRequest' });

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
    this.ws.call('vm.device.query', [[['id', '=', this.deviceid]]])
      .pipe(untilDestroyed(this))
      .subscribe((device) => {
        if (
          (device[0] as any).attributes.physical_sectorsize !== undefined
          && (device[0] as any).attributes.logical_sectorsize !== undefined
        ) {
          (device[0] as any).attributes['sectorsize'] = (device[0] as any).attributes.logical_sectorsize === null
            ? 0
            : (device[0] as any).attributes.logical_sectorsize;
        }
        const deviceInformation = { ...device[0].attributes, ...{ order: device[0].order } };
        this.vminfo = device[0];
        const deviceType = device[0].dtype;
        this.selectedType = deviceType;
        switch (deviceType) {
          case VmDeviceType.Cdrom:
            this.activeFormGroup = this.cdromFormGroup;
            this.isCustActionVisible = false;
            break;
          case VmDeviceType.Nic:
            this.activeFormGroup = this.nicFormGroup;
            this.isCustActionVisible = true;
            break;
          case VmDeviceType.Disk:
            this.activeFormGroup = this.diskFormGroup;
            this.isCustActionVisible = false;
            break;
          case VmDeviceType.Raw:
            this.activeFormGroup = this.rawfileFormGroup;
            this.isCustActionVisible = false;
            // special case where RAW file device is used as a BOOT device.
            if (this.vminfo.attributes.boot && this.vminfo.attributes.rootpwd) {
              this.rootpwd = _.find(this.rawfileFieldConfig, { name: 'rootpwd' });
              this.rootpwd['isHidden'] = false;
              this.boot = _.find(this.rawfileFieldConfig, { name: 'boot' });
              this.boot['isHidden'] = false;
            }
            break;
          case VmDeviceType.Pci:
            this.activeFormGroup = this.pciFormGroup;
            this.isCustActionVisible = false;
            break;
          case VmDeviceType.Display:
            this.activeFormGroup = this.displayFormGroup;
            this.isCustActionVisible = false;
            this.ws.call('vm.get_display_devices', [this.vmId]).pipe(untilDestroyed(this)).subscribe((devices) => {
              if (devices.length > 1) {
                _.find(this.displayFieldConfig, { name: 'type' }).isHidden = true;
              }
            }, (err) => {
              new EntityUtils().handleWSError(this, err, this.dialogService);
            });
            break;
        }

        this.setgetValues(this.activeFormGroup, deviceInformation);
      });
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.ws.call('vm.query', [[['id', '=', parseInt(params['vmid'], 10)]]]).pipe(untilDestroyed(this)).subscribe((vms) => {
        if (vms[0].status.state === ServiceStatus.Running) {
          this.activeFormGroup.setErrors({ invalid: true });
        }
      });
    });

    if (!this.productType.includes(ProductType.Scale)) {
      _.find(this.displayFieldConfig, { name: 'wait' }).isHidden = false;
    }

    this.afterInit();
  }

  afterInit(): void {
    this.ws.call('pool.dataset.query', [[['type', '=', DatasetType.Volume]], { extra: { properties: ['id'] } }]).pipe(untilDestroyed(this)).subscribe((zvols) => {
      zvols.forEach((zvol) => {
        const config = _.find(this.diskFieldConfig, { name: 'path' }) as FormSelectConfig;
        config.options.push(
          {
            label: zvol.id, value: '/dev/zvol/' + zvol.id,
          },
        );
      });
    });

    this.custActions = [
      {
        id: 'generate_mac_address',
        name: this.translate.instant('Generate MAC Address'),
        function: () => {
          this.ws.call('vm.random_mac').pipe(untilDestroyed(this)).subscribe((random_mac) => {
            this.nicFormGroup.controls['mac'].setValue(random_mac);
          });
        },
      },
    ];
  }

  goBack(): void {
    this.router.navigate(new Array('/').concat(this.route_success));
  }

  onSubmit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      const deviceValue = _.cloneDeep(this.activeFormGroup.value);
      const deviceOrder = deviceValue['order'];
      delete deviceValue.order;
      deviceValue['physical_sectorsize'] = deviceValue['sectorsize'] === 0 ? null : deviceValue['sectorsize'];
      deviceValue['logical_sectorsize'] = deviceValue['sectorsize'] === 0 ? null : deviceValue['sectorsize'];
      delete deviceValue['sectorsize'];
      const payload = {
        dtype: this.vminfo.dtype,
        attributes: deviceValue,
        order: deviceOrder,
      };

      this.loader.open();
      this.ws.call(this.updateCall, [params.pk, payload]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (e_res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, e_res, this.dialogService);
      });
    });
  }
}
