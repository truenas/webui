import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ContentChildren,
  TemplateRef,
  ViewContainerRef,
  QueryList
} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';


import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {WebSocketService, NetworkService, SystemGeneralService} from '../../../../services/';
import {VmService} from '../../../../services/vm.service';
import {EntityUtils} from '../../../common/entity/utils';
import {EntityFormService} from '../../../../pages/common/entity/entity-form/services/entity-form.service';
import {EntityTemplateDirective} from '../../../common/entity/entity-template.directive';

@Component({
  selector : 'device-edit',
  templateUrl : '../../../common/entity/entity-form/entity-form.component.html',
  styleUrls : [ '../../../common/entity/entity-form/entity-form.component.scss' ],
  providers : [ VmService ]
})

export class DeviceEditComponent implements OnInit {

  
  public resource_name: string = 'vm/device';
  public route_cancel: string[];
  public route_success: string[];
  public vmid: any;
  public vm: string;
  public dtype: string;
  public formGroup: FormGroup;
  public sub: any;
  public error: string;
  public data: Object = {};
  public pk: any;
  public busy: Subscription;
  public DISK_zvol: any;
  public fieldConfig: FieldConfig[] = [];
  public conf: any = {};
  public hasConf: boolean = true;
  public success: boolean = false;
  
  templateTop: TemplateRef<any>;
  @ContentChildren(EntityTemplateDirective)
  templates: QueryList<EntityTemplateDirective>;
  

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected networkService: NetworkService,
              protected systemGeneralService: SystemGeneralService,
              private entityFormService : EntityFormService,
              public vmService: VmService) {}
  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.vmid = params['vmid'];
      this.vm = params['name'];
      this.route_success = [ 'vm', this.vmid, 'devices', this.vm ];
      this.conf.route_success = this.route_success;
      this.route_cancel = [ 'vm', this.vmid, 'devices', this.vm ];
      this.conf.route_cancel = this.route_cancel;
      this.dtype = params['dtype'];
      this.pk = params['pk'];
    });
    if (this.dtype === "CDROM") {
      this.fieldConfig = [
        {
          type : 'explorer',
          initial: '/mnt',
          name : 'path',
          placeholder : 'CDROM Path',
        },
      ];
    } else if (this.dtype === "NIC") {
      this.fieldConfig = [
        {
          name : 'NIC_type',
          placeholder : 'Adapter Type:',
          type: 'select',
          options : [],
        },
        {
          name : 'NIC_mac',
          placeholder : 'Mac Address',
          type: 'input',
          value : '',
        },
        {
          name : 'nic_attach',
          placeholder : 'Nic to attach:',
          type: 'select',
          options : [],
        },
      ];
    } else if (this.dtype === "VNC") {
      this.fieldConfig = [
        {
          name : 'VNC_port',
          placeholder : 'port',
          type : 'input',
          inputType: 'number'
        },
        {
          name : 'VNC_wait',
          placeholder : 'wait on boot',
          type: 'checkbox'
        },
        {
          name : 'VNC_resolution',
          placeholder : 'Resolution:',
          type: 'select',
          options : [
            {label : '1920x1080', value : "1920x1080"},
            {label : '1400x1050', value : "1400x1050"},
            {label : '1280x1024', value : "1280x1024"},
            {label : '1280x960', value : "1280x960"},
            {label : '1024x768', value : '1024x768'},
            {label : '800x600', value : '800x600'},
            {label : '640x480', value : '640x480'},
          ],
        },
        {
          name : 'vnc_bind',
          placeholder : 'Bind:',
          type: 'select',
          options : [],
        },
        {
          name : 'vnc_password',
          placeholder : 'password',
          type : 'input',
          inputType : 'password',
        },
      ];
    } else if (this.dtype === "DISK") {
      this.fieldConfig = [
        {
          name : 'DISK_zvol',
          placeholder : 'ZVol',
          type: 'select',
          options: []
        },
        {
          name : 'DISK_mode',
          placeholder : 'Mode',
          type: 'select',
          options : [
            {label : 'AHCI', value : 'AHCI'},
            {label : 'VirtIO', value : 'VIRTIO'},
          ],
        },
        {
          name : 'sectorsize',
          placeholder : 'Disk sectorsize',
          type: 'input',
        },
      ];
    } else if (this.dtype === "RAW") {
      this.fieldConfig = [
        {
          type : 'explorer',
          initial: '/mnt',
          name : 'RAW_path',
          placeholder : 'Raw File',
        },
        {
          type : 'input',
          name : 'RAW_sectorsize',
          placeholder : 'Disk sectorsize',
          inputType : 'number',
        },
        {
          name : 'RAW_mode',
          placeholder : 'Mode',
          type: 'select',
          options : [
            {label : 'AHCI', value : 'AHCI'},
            {label : 'VirtIO', value : 'VIRTIO'},
          ],
        },
      ];
    }
    this.afterInit();
  }
  private nic_attach: any;
  private nicType:  any;
  private ipAddress: any;

  afterInit(){
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    let vnc_lookup_table: Object = {
      'vnc_port' : 'VNC_port',
      'vnc_resolution' : 'VNC_resolution',
      'wait' : 'VNC_wait',
      'vnc_bind':'vnc_bind',
      'vnc_password':'vnc_password'
    };
    let nic_lookup_table: Object = {
      'mac' : 'NIC_mac',
      'type' : 'NIC_type',
      'nic_attach':'nic_attach'
    };
    let disk_lookup_table: Object = {
      'path' : "DISK_zvol",
      'type' : "DISK_mode",
      'sectorsize': "sectorsize",
    };
    let cdrom_lookup_table: Object = {
      'path' : "CDROM_path",
    };
    let rawfile_lookup_table: Object = {
      'path' : 'RAW_path',
      'sectorsize': 'RAW_sectorsize',
      'type':'RAW_mode'
    };
    this.vmService.getVM(this.vm).subscribe((vm) => {
      for (let device of vm.devices) {
        switch (device.dtype) {
          case 'VNC': {
            this.setgetValues(device.attributes, vnc_lookup_table);
            this.systemGeneralService.getIPChoices().subscribe((res) => {
              if (res.length > 0) {
                this.ipAddress = _.find(this.fieldConfig, {'name' : 'vnc_bind'});
                if (this.ipAddress ){
                  for(let i in res){
                    let item = res[i];
                    this.ipAddress.options.push({label : item[1], value : item[0]});
                  }
                }
              }
            })
            break;
          };
          case 'NIC': {
            this.setgetValues(device.attributes, nic_lookup_table);           
            this.networkService.getAllNicChoices().subscribe((res) => {
              this.nic_attach = _.find(this.fieldConfig, {'name' : 'nic_attach'});
              if (this.nic_attach ){
                for(let i in res){
                  let item = res[i];
                  this.nic_attach.options.push({label : item[1], value : item[0]});
                }
              }
            });
            this.ws.call('notifier.choices', [ 'VM_NICTYPES' ])
            .subscribe((res) => {
              this.nicType = _.find(this.fieldConfig, {name : "NIC_type"});
              if (this.nicType ){
                for(let i in res){
                  let item = res[i];
                  this.nicType.options.push({label : item[1], value : item[0]});
                }
              }
            });
            break;
          };
          case 'CDROM': {
            this.setgetValues(device.attributes, cdrom_lookup_table);
            break;
          };
          case 'DISK': {
            this.setgetValues(device.attributes, disk_lookup_table);
            this.vmService.getStorageVolumes().subscribe((res) => {
              let data = new EntityUtils().flattenData(res.data);
              this.DISK_zvol = _.find(this.fieldConfig, {name:'DISK_zvol'});
              for (let dataset of data) {
                if (dataset.type === 'zvol') {
                  this.DISK_zvol.add({label : dataset.name, value : dataset.path});
                };
              };
            });
            break;
          };
          case 'RAW': {
            this.setgetValues(device.attributes, rawfile_lookup_table);
            break;
          };
        }
      }
    });
  }
  
  setgetValues(data, lookupTable) {
    for (let i in data) {
      let fg = this.formGroup.controls[lookupTable[i]];
      if (fg) {
        fg.setValue(data[i]);
      }
    }
  }
  goBack() {
    let route = this.route_cancel;
    if (!route) {
      route = this.route_success;
    }
    this.router.navigate(new Array('/pages').concat(route));
  }

  isShow(id: any): any {
    if (this.conf.isBasicMode) {
      if (this.conf.advanced_field.indexOf(id) > -1) {
        return false;
      }
    }
    return true;
  }

  goConf() {
    let route = this.conf.route_conf;
    if (!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/pages').concat(route));
  }

  onSubmit(event: Event) {
    this.vmService.getVM(this.vm).subscribe((vm) => {
      this.error = null;
      let payload = {};
      let devices = [];
      let formvalue = _.cloneDeep(this.formGroup.value);
          for (let device of vm.devices) {
            if (device.dtype === 'NIC') {
              devices.push({
                'dtype' : 'NIC',
                'attributes' : {
                  'type' : formvalue.NIC_type ? formvalue.NIC_type
                                              : vm.attributes.type,
                  'mac' : formvalue.NIC_mac ? formvalue.NIC_mac
                                            : vm.attributes.mac
                }
              })
            }
          if (device.dtype === 'VNC') {
            devices.push({
              'dtype' : 'VNC',
              'attributes' : {
                'wait' : new EntityUtils().bool(formvalue.VNC_wait
                                                    ? formvalue.VNC_wait
                                                    : vm.attributes.wait),
                'vnc_port' : formvalue.VNC_port ? formvalue.VNC_port
                                                : vm.attributes.port,
                'vnc_resolution' : formvalue.VNC_resolution
                                        ? formvalue.VNC_resolution
                                        : vm.attributes.vnc_resolution
              }
            })
          }
          if (device.dtype === 'DISK') {
            devices.push({
              'dtype' : 'DISK',
              'attributes' : {
                'type' : formvalue.DISK_mode ? formvalue.DISK_mode
                                              : vm.attributes.type,
                'path' : formvalue.DISK_zvol ? formvalue.DISK_zvol
                                              : vm.attributes.path
              }
            })
          }
          if (device.dtype === 'CDROM') {
            devices.push({
              'dtype' : 'CDROM',
              'attributes' : {
                'path' : formvalue.CDROM_path ? formvalue.CDROM_path
                                              : vm.attributes.path
              }
            })
          }
          if (device.dtype === 'RAW') {
            devices.push({
              'dtype' : 'RAW',
              'attributes' : {
                'path' : formvalue.RAW_path ? formvalue.RAW_path
                                              : vm.attributes.path,
                'sectorsize' : formvalue.RAW_sectorsize ? formvalue.RAW_sectorsize : vm.attributes.sectorsize,
                'mode': formvalue.RAW_mode ? formvalue.RAW_mode : vm.attributes.mode,
                }
              })
            }
          }
      payload['devices'] = devices;
      this.busy = this.ws.call('vm.update', [ this.vmid, payload ]).subscribe(
        (res) => { this.router.navigate(new Array('/pages').concat(this.route_success));},
        (res) => { new EntityUtils().handleError(this, res);}
      );
    });
  }
}
