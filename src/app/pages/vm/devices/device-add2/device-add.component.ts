import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductType } from '../../../../enums/product-type.enum';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../../translate-marker';

import {
  RestService, WebSocketService, SystemGeneralService, NetworkService, VmService, StorageService,
} from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../services/dialog.service';
import helptext from '../../../../helptext/vm/devices/device-add-edit';
import { ModalService } from 'app/services/modal.service';
import { ZvolWizardComponent } from 'app/pages/storage/volumes/zvol/zvol-wizard';
import { CoreEvent, CoreService } from 'app/core/services/core.service';

@Component({
  selector: 'app-device-add2',
  templateUrl: './device-add.component.html',
  styleUrls: ['../../../common/entity/entity-form/entity-form.component.scss'],
})
export class DeviceAddComponent implements OnInit, OnDestroy {
  protected addCall: 'vm.device.create' = 'vm.device.create';
  protected route_success: string[];
  vmid: any;
  vmname: any;
  fieldSets: any;
  isCustActionVisible = false;
  selectedType = 'CDROM';
  formGroup: any;
  activeFormGroup: any;
  cdromFormGroup: any;
  diskFormGroup: any;
  nicFormGroup: any;
  rawfileFormGroup: any;
  pciFormGroup: any;
  displayFormGroup: any;
  rootpwd: any;
  vminfo: any;
  boot: any;
  custActions: any[];
  error: string;
  private productType = window.localStorage.getItem('product_type') as ProductType;

  protected addZvolComponent: ZvolWizardComponent;

  fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'dtype',
      placeholder: helptext.dtype_placeholder,
      options: [
        {
          label: T('CD-ROM'),
          value: 'CDROM',
        }, {
          label: T('NIC'),
          value: 'NIC',
        }, {
          label: T('Disk'),
          value: 'DISK',
        }, {
          label: T('Raw File'),
          value: 'RAW',
        }, {
          label: T('PCI Passthru Device'),
          value: 'PCI',
        }, {
          label: T('Display'),
          value: 'DISPLAY',
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
      updater: this.updateZvolSearchOptions,
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
  protected nic_attach: any;
  protected nicType: any;
  protected nicMac: any;

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
  protected pptdev: any;

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
  protected ipAddress: any = [];

  constructor(protected router: Router,
    protected core: CoreService,
    protected aroute: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    public translate: TranslateService,
    protected loader: AppLoaderService,
    protected systemGeneralService: SystemGeneralService,
    protected dialogService: DialogService,
    protected networkService: NetworkService,
    protected vmService: VmService,
    private modalService: ModalService,
    private storageService: StorageService) {}

  preInit(): void {
    // Display
    this.ws.call('vm.device.bind_choices').subscribe((res) => {
      if (res && Object.keys(res).length > 0) {
        this.ipAddress = _.find(this.displayFieldConfig, { name: 'bind' });
        Object.keys(res).forEach((address) => {
          this.ipAddress.options.push({ label: address, value: address });
        });
      }
    });

    this.ws.call('vm.resolution_choices').subscribe((res) => {
      const resolution = _.find(this.displayFieldConfig, { name: 'resolution' });
      for (const key in res) {
        resolution.options.push({ label: key, value: res[key] });
      }
      this.displayFormGroup.controls['resolution'].setValue(res[Object.keys(res)[0]]);
    });

    this.ws.call('vm.get_display_devices', [this.vmid]).subscribe((devices) => {
      if (devices.length > 1) {
        this.fieldConfig[0].options.splice(this.fieldConfig[0].options.findIndex((o) => o.value === 'DISPLAY'));
      }
    }, (err) => {
      new EntityUtils().handleWSError(this, err, this.dialogService);
    });

    this.core.register({ observerClass: this, eventName: 'zvolCreated' }).subscribe((evt: CoreEvent) => {
      const newZvol = {
        label: evt.data.id, value: '/dev/zvol/' + evt.data.id,
      };
      const pathField = _.find(this.diskFieldConfig, { name: 'path' });
      pathField.options.splice(pathField.options.findIndex((o) => o.value === 'new'), 0, newZvol);

      this.diskFormGroup.controls['path'].setValue(newZvol.value);
    });
    // nic
    this.networkService.getVmNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.nicFieldConfig, { name: 'nic_attach' });
      this.nic_attach.options = Object.keys(res || {}).map((nicId) => ({
        label: nicId,
        value: nicId,
      }));
    });

    this.nicType = _.find(this.nicFieldConfig, { name: 'type' });
    this.vmService.getNICTypes().forEach((item) => {
      this.nicType.options.push({ label: item[1], value: item[0] });
    });

    // pci
    this.ws.call('vm.device.passthrough_device_choices').subscribe((res) => {
      this.pptdev = _.find(this.pciFieldConfig, { name: 'pptdev' });
      this.pptdev.options = Object.keys(res || {}).map((pptdevId) => ({
        label: pptdevId,
        value: pptdevId,
      }));
    });
  }

  ngOnInit(): void {
    this.aroute.params.subscribe((params) => {
      this.vmid = params['pk'];
      this.vmname = params['name'];
      this.route_success = ['vm', this.vmid, 'devices', this.vmname];
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
    this.diskFormGroup.controls['path'].valueChanges.subscribe((res: string) => {
      if (res === 'new') {
        this.diskFormGroup.controls['path'].setValue('');
        this.addZvol();
      }
    });
    this.formGroup.controls['dtype'].valueChanges.subscribe((res: any) => {
      this.selectedType = res;
      if (res === 'CDROM') {
        this.activeFormGroup = this.cdromFormGroup;
        this.isCustActionVisible = false;
      } else if (res === 'NIC') {
        this.activeFormGroup = this.nicFormGroup;
        this.isCustActionVisible = true;
      } else if (res === 'DISK') {
        this.activeFormGroup = this.diskFormGroup;
        this.isCustActionVisible = false;
      } else if (res === 'RAW') {
        this.activeFormGroup = this.rawfileFormGroup;
        this.isCustActionVisible = false;
      } else if (res === 'PCI') {
        this.activeFormGroup = this.pciFormGroup;
        this.isCustActionVisible = false;
      } else if (res === 'DISPLAY') {
        this.activeFormGroup = this.displayFormGroup;
        this.isCustActionVisible = false;
      }
    });

    if (!this.productType.includes(ProductType.Scale)) {
      _.find(this.displayFieldConfig, { name: 'wait' }).isHidden = false;
      _.find(this.displayFieldConfig, { name: 'resolution' }).isHidden = false;
    }
    this.addZvolComponent = new ZvolWizardComponent(this.core, this.router, this.aroute, this.rest, this.ws, this.loader,
      this.dialogService, this.storageService, this.translate, this.modalService);

    this.afterInit();
  }

  async afterInit(): Promise<void> {
    this.ws.call('pool.dataset.query', [[['type', '=', 'VOLUME']]]).subscribe((zvols: any[]) => {
      zvols.forEach((zvol) => {
        _.find(this.diskFieldConfig, { name: 'path' }).options.push(
          {
            label: zvol.id, value: '/dev/zvol/' + zvol.id,
          },
        );
      });
      _.find(this.diskFieldConfig, { name: 'path' }).options.push({
        label: 'Add New', value: 'new', sticky: 'bottom',
      });
    });
    // if bootloader == 'GRUB' or bootloader == "UEFI_CSM" or if VM has existing Display device, hide Display option.
    await this.ws.call('vm.query', [[['id', '=', parseInt(this.vmid, 10)]]]).subscribe((vm) => {
      const dtypeField = _.find(this.fieldConfig, { name: 'dtype' });
      const vmDisplayDevices = _.filter(vm[0].devices, { dtype: 'DISPLAY' });
      if (vm[0].bootloader === 'GRUB' || vm[0].bootloader === 'UEFI_CSM' || vmDisplayDevices) {
        if (vmDisplayDevices.length) {
          if (vmDisplayDevices.length > 1) {
            for (const i in dtypeField.options) {
              if (dtypeField.options[i].label === 'DISPLAY') {
                _.pull(dtypeField.options, dtypeField.options[i]);
              }
            }
          } else {
            const typee = _.find(this.displayFieldConfig, { name: 'type' });
            _.pull(typee.options, _.find(typee.options, { value: vmDisplayDevices[0].attributes.type }));
            this.displayFormGroup.controls['type'].setValue(typee.options[0].value);
          }
        }
      }
      // if type == 'Container Provider' and rawfile boot device exists, hide rootpwd and boot fields.
      if (_.find(vm[0].devices, { dtype: 'RAW' }) && vm[0].type === 'Container Provider') {
        vm[0].devices.forEach((element: any) => {
          if (element.dtype === 'RAW') {
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
        name: 'Generate MAC Address',
        function: () => {
          this.ws.call('vm.random_mac').subscribe((random_mac) => {
            this.nicFormGroup.controls['mac'].setValue(random_mac);
          });
        },
      },
    ];
    this.displayFormGroup.controls['bind'].setValue('0.0.0.0');
  }

  goBack(): void {
    this.router.navigate(new Array('/').concat(this.route_success));
  }

  onSubmit(event: Event): void {
    this.error = '';
    this.aroute.params.subscribe((params) => {
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
      this.ws.call(this.addCall, [payload]).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (e_res) => {
        this.loader.close();
        console.log(e_res);
        new EntityUtils().handleWSError(this, e_res, this.dialogService);
      });
    });
  }

  addZvol(): void {
    this.modalService.open('slide-in-form', this.addZvolComponent);
  }

  updateZvolSearchOptions(value = '', parent: any): void {
    parent.ws.call('pool.dataset.query', [[['type', '=', 'VOLUME'], ['id', '^', value]]]).subscribe((zvols: any[]) => {
      const searchedZvols = [];
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
      _.find(parent.diskFieldConfig, { name: 'path' }).searchOptions = searchedZvols;
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }
}
