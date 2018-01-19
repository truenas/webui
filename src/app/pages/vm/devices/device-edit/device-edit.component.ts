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
          name : 'CDROM_path',
          placeholder : 'CDROM Path',
          tooltip : 'Select the path to the CDROM. The image must be\
 present on an accessible portion of the FreeNAS storage.',
        },
      ];
    } else if (this.dtype === "NIC") {
      this.fieldConfig = [
        {
          name : 'NIC_type',
          placeholder : 'Adapter Type:',
          tooltip : 'The default emulates an Intel E1000 (82545) Ethernet\
 card for compatibility with most operating systems. If the operating\
 system installed in the VM supports VirtIO paravirtualized network\
 drivers, this can be changed to <i>VirtIO</i> to provide better\
 performace.',
          type: 'select',
          options : [],
        },
        {
          name : 'NIC_mac',
          placeholder : 'Mac Address',
          tooltip : 'By default, the VM receives an auto-generated\
 random MAC address. To override the default with a custom value,\
 enter the desired address into the field.',
          type: 'input',
          value : '',
        },
        {
          name : 'nic_attach',
          placeholder : 'Nic to attach:',
          tooltip : 'Can be used to specify which physical interface to\
 associate with the VM if the system has multiple physical network\
 cards.',
          type: 'select',
          options : [],
        },
      ];
    } else if (this.dtype === "VNC") {
      this.fieldConfig = [
        {
          name : 'VNC_port',
          placeholder : 'port',
          tooltip : 'Can be set to <i>0</i>, left empty for FreeNAS to\
 assign a port when the VM is stared, or set to a fixed,preferred port\
 number.',
          type : 'input',
          inputType: 'number'
        },
        {
          name : 'VNC_wait',
          placeholder : 'wait on boot',
          tooltip : 'When checked, VNC client should wait until the VM\
 has booted before attempting the connection.',
          type: 'checkbox'
        },
        {
          name : 'VNC_resolution',
          placeholder : 'Resolution:',
          tooltip : 'Used to modify the default screen resolution used\
 by the VNC session.',
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
          tooltip : 'By default, VNC binds to all available IP addresses\
 (<i>0.0.0.0). To specify the IP address to use, select it.',
          type: 'select',
          options : [],
        },
        {
          name : 'vnc_password',
          placeholder : 'password',
          tooltip : 'Enter the VNC password to automatically pass the\
 VNC. Note that the password is limited to 8 characters.',
          type : 'input',
          inputType : 'password',
        },
        {
          name : 'vnc_web',
          placeholder : 'VNC web',
          tooltip : 'When checked, uses the VNC web interface.',
          type: 'checkbox'
        },
      ];
    } else if (this.dtype === "DISK") {
      this.fieldConfig = [
        {
          name : 'DISK_zvol',
          placeholder : 'ZVol',
          tooltip : 'After <a\
 href="http://doc.freenas.org/11/storage.html#create-zvol"\
 target="_blank">creating a zvol</a>, select it from the list.',
          type: 'select',
          options: []
        },
        {
          name : 'DISK_mode',
          placeholder : 'Mode',
          tooltip : '<i>AHCI</i> emulates an AHCI hard disk for best\
 software compatibility. <i>VirtIO</i> uses paravirtualized drivers and\
 can provide better performance, but requires the operating system\
 installed in the VM to support VirtIO disk devices.',
          type: 'select',
          options : [
            {label : 'AHCI', value : 'AHCI'},
            {label : 'VirtIO', value : 'VIRTIO'},
          ],
        },
        {
          name : 'DISK_sectorsize',
          placeholder : 'Disk sectorsize',
          tooltip : 'If a specific sector size is required, enter the\
 number of bytes. The default of <i>0</i> leaves the sector size unset.',
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
          tooltip : 'Select the location of the RAW file being added.',
        },
        {
          type : 'input',
          name : 'RAW_sectorsize',
          placeholder : 'Disk sectorsize',
          tooltip : 'If a specific sector size is required, enter the\
 number of bytes. The default of <i>0</i> leaves the sector size unset.',
          inputType : 'number',
        },
        {
          name : 'RAW_mode',
          placeholder : 'Mode',
          tooltip : '<i>AHCI</i> emulates an AHCI hard disk for best\
 software compatibility. <i>VirtIO</i> uses paravirtualized drivers and\
 can provide better performance, but requires the operating system\
 installed in the VM to support VirtIO disk devices.',
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
    let self = this;
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    let vnc_lookup_table: Object = {
      'vnc_port' : 'VNC_port',
      'vnc_resolution' : 'VNC_resolution',
      'wait' : 'VNC_wait',
      'vnc_bind':'vnc_bind',
      'vnc_password':'vnc_password',
      'vnc_web':'vnc_web'
    };
    let nic_lookup_table: Object = {
      'mac' : 'NIC_mac',
      'type' : 'NIC_type',
      'nic_attach':'nic_attach'
    };
    let disk_lookup_table: Object = {
      'path' : "DISK_zvol",
      'type' : "DISK_mode",
      'sectorsize': "DISK_sectorsize",
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
            if (this.dtype === 'VNC') {  
            this.systemGeneralService.getIPChoices().subscribe((res) => {
              if (res.length > 0) {
                self.ipAddress = _.find(self.fieldConfig, {'name' : 'vnc_bind'});
                if (this.ipAddress ){
                  for(let i in res){
                    let item = res[i];
                    self.ipAddress.options.push({label : item[1], value : item[0]});
                  }
                }
              }
            })
          }
            break;
          };
          case 'NIC': {
            this.setgetValues(device.attributes, nic_lookup_table);
            if (this.dtype === 'NIC') {     
            this.networkService.getAllNicChoices().subscribe((res) => {
              self.nic_attach = _.find(self.fieldConfig, {'name' : 'nic_attach'});
              if (this.nic_attach ){
                for(let i in res){
                  let item = res[i];
                  self.nic_attach.options.push({label : item[1], value : item[0]});
                }
              }
            });
            this.ws.call('notifier.choices', [ 'VM_NICTYPES' ])
            .subscribe((res) => {
              self.nicType = _.find(self.fieldConfig, {name : "NIC_type"});
              if (this.nicType ){
                for(let i in res){
                  let item = res[i];
                  self.nicType.options.push({label : item[1], value : item[0]});
                }
              }
            });
          }
            break;
          };
          case 'CDROM': {
            if (this.dtype === 'CDROM') {
            this.setgetValues(device.attributes, cdrom_lookup_table);
            break;
            }
          };
          case 'DISK': {
            if (this.dtype === 'DISK') {
            this.setgetValues(device.attributes, disk_lookup_table);
              this.vmService.getStorageVolumes().subscribe((res) => {
                let data = new EntityUtils().flattenData(res.data);
                self.DISK_zvol = _.find(self.fieldConfig, {name:'DISK_zvol'});
                for (let dataset of data) {
                  if (dataset.type === 'zvol') {
                    self.DISK_zvol.options.push({label : dataset.name, value : dataset.path});
                  };
                };
              });
            }
            break;
          };
          case 'RAW': {
            if (this.dtype === 'RAW') {
            this.setgetValues(device.attributes, rawfile_lookup_table);
            break;
            }
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
    this.router.navigate(new Array('').concat(route));
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
    this.router.navigate(new Array('').concat(route));
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
                                              : device.attributes.type,
                  'mac' : formvalue.NIC_mac ? formvalue.NIC_mac
                                            : device.attributes.mac,
                  'nic_attach' : formvalue.nic_attach ? formvalue.nic_attach
                                            : device.attributes.nic_attach,
                }
              })
            }
          if (device.dtype === 'VNC') {
            devices.push({
              'dtype' : 'VNC',
              'attributes' : {
                'wait' : new EntityUtils().bool(formvalue.VNC_wait
                                                    ? formvalue.VNC_wait
                                                    : device.attributes.wait),
                'vnc_port' : formvalue.VNC_port ? formvalue.VNC_port
                                                : device.attributes.port,
                'vnc_resolution' : formvalue.VNC_resolution
                                        ? formvalue.VNC_resolution
                                        : device.attributes.vnc_resolution,
                'vnc_bind' : formvalue.vnc_bind 
                                      ? formvalue.vnc_bind
                                      : device.attributes.vnc_bind,
                'vnc_password' : formvalue.vnc_password 
                                      ? formvalue.vnc_password
                                      : device.attributes.vnc_password,
                'vnc_web' : formvalue.vnc_web 
                                      ? formvalue.vnc_web
                                      : device.attributes.vnc_web,
                }
            })
          }
          if (device.dtype === 'DISK') {
            devices.push({
              'dtype' : 'DISK',
              'attributes' : {
                'type' : formvalue.DISK_mode ? formvalue.DISK_mode
                                              : device.attributes.type,
                'path' : formvalue.DISK_zvol ? formvalue.DISK_zvol
                                              : device.attributes.path
              }
            })
          }
          if (device.dtype === 'CDROM') {
                devices.push({
                  'dtype' : 'CDROM',
                  'attributes' : {
                    'path' : formvalue.CDROM_path ? formvalue.CDROM_path
                                                  : device.attributes.path
                  }
              })
            }
          
          if (device.dtype === 'RAW') {
            devices.push({
              'dtype' : 'RAW',
              'attributes' : {
                'path' : formvalue.RAW_path ? formvalue.RAW_path
                                              : device.attributes.path,
                'sectorsize' : formvalue.RAW_sectorsize ? formvalue.RAW_sectorsize : device.attributes.sectorsize,
                'mode': formvalue.RAW_mode ? formvalue.RAW_mode : device.attributes.mode,
                }
              })
            }
          }
      payload['devices'] = devices;
      this.busy = this.ws.call('vm.update', [ this.vmid, payload ]).subscribe(
        (res) => { this.router.navigate(new Array('').concat(this.route_success));},
        (res) => { new EntityUtils().handleError(this, res);}
      );
    });
  }
}
