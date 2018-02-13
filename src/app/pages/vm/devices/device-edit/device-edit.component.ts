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
import {regexValidator} from '../../../common/entity/entity-form/validators/regex-validation';

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
  public hasConf:  boolean = true;
  public success: boolean = false;
  private nic_attach: any;
  private nicType:  any;
  private vnc_bind: any;
  
  templateTop: TemplateRef<any>;
  @ContentChildren(EntityTemplateDirective)
  templates: QueryList<EntityTemplateDirective>;
  

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected networkService: NetworkService,
              protected systemGeneralService: SystemGeneralService,
              private entityFormService: EntityFormService,
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
          validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i)],
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

  afterInit(){
    const self = this;
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    const vnc_lookup_table: Object = {
      'vnc_port' : 'VNC_port',
      'vnc_resolution' : 'VNC_resolution',
      'wait' : 'VNC_wait',
      'vnc_bind':'vnc_bind',
      'vnc_password':'vnc_password',
      'vnc_web':'vnc_web'
    };
    const nic_lookup_table: Object = {
      'mac' : 'NIC_mac',
      'type' : 'NIC_type',
      'nic_attach':'nic_attach'
    };
    const disk_lookup_table: Object = {
      'path' : "DISK_zvol",
      'type' : "DISK_mode",
      'sectorsize': "DISK_sectorsize",
    };
    const cdrom_lookup_table: Object = {
      'path' : "CDROM_path",
    };
    const rawfile_lookup_table: Object = {
      'path' : 'RAW_path',
      'sectorsize': 'RAW_sectorsize',
      'type':'RAW_mode'
    };
    this.ws.call('datastore.query', ['vm.device', [["id", "=", this.pk]]]).subscribe((device)=>{
      if (device[0].dtype === 'CDROM'){
        this.setgetValues(device[0].attributes, cdrom_lookup_table);
      }
      else if(device[0].dtype === 'VNC'){
        this.systemGeneralService.getIPChoices().subscribe((ipchoices) => {
          this.vnc_bind = _.find(this.fieldConfig, {'name' : 'vnc_bind'});
          for(const ipchoice of ipchoices){
            this.vnc_bind.options.push({label : ipchoice[1], value : ipchoice[0]});
          }
        });
        this.setgetValues(device[0].attributes, vnc_lookup_table);
      }
      else if(device[0].dtype === 'NIC'){
        this.networkService.getAllNicChoices().subscribe((nics) => {
          this.nic_attach = _.find(self.fieldConfig, {'name' : 'nic_attach'});
          if (this.nic_attach ){
            for(const nic of nics){
              this.nic_attach.options.push({label : nic[1], value : nic[0]});
            };
          }
        });
        this.ws.call('notifier.choices', [ 'VM_NICTYPES' ])
        .subscribe((NIC_types) => {
          this.nicType = _.find(self.fieldConfig, {name : "NIC_type"});
          if (this.nicType ){
            for(const NIC_type of NIC_types){
              self.nicType.options.push({label : NIC_type[1], value : NIC_type[0]});
            };
          }
        });
        this.setgetValues(device[0].attributes, nic_lookup_table);
      }
      else if (device[0].dtype === 'DISK'){
        this.vmService.getStorageVolumes().subscribe((res) => {
          const disks = new EntityUtils().flattenData(res.data);
          self.DISK_zvol = _.find(self.fieldConfig, {name:'DISK_zvol'});
          for (const disk of disks) {
            if (disk.type === 'zvol') {
              self.DISK_zvol.options.push({label : disk.name, value : disk.path});
            };
          };
        });
        this.setgetValues(device[0].attributes, disk_lookup_table);
      }
      else {
        this.setgetValues(device[0].attributes, rawfile_lookup_table);
        }
      
    })
  }
  
  setgetValues(data, lookupTable) {
    for (const i in data) {
      const fg = this.formGroup.controls[lookupTable[i]];
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
    const formvalue = _.cloneDeep(this.formGroup.value);
    const payload = {};

        if (this.dtype === 'NIC') {
            payload['dtype'] = 'NIC'
            payload['attributes'] = {
            'type' : formvalue.NIC_type,
            'mac' : formvalue.NIC_mac,
            'nic_attach' : formvalue.nic_attach
            }
          }

          if (this.dtype === 'VNC') {
            payload['dtype'] = 'VNC'
            payload['attributes'] = {
              'wait' : new EntityUtils().bool(formvalue.VNC_wait),
              'vnc_port' : formvalue.VNC_port,
              'vnc_resolution' : formvalue.VNC_resolution,
              'vnc_bind' : formvalue.vnc_bind,
              'vnc_password' : formvalue.vnc_password,
              'vnc_web' : formvalue.vnc_web,
          }
        }

        if (this.dtype  === 'DISK') {
            payload['dtype'] = 'DISK'
            payload['attributes'] = {
                'type' : formvalue.DISK_mode, 
                'path' : "/dev/zvol/"+formvalue.DISK_zvol,
              }
            }
        if (this.dtype === 'CDROM') {
            payload['dtype'] = 'CDROM'
            payload['attributes'] = {
              'path' : formvalue.CDROM_path
            }
            }
        if (this.dtype === 'RAW') {
            payload['dtype'] ='RAW'
            payload['attributes'] = {
              'path' : formvalue.RAW_path,
              'sectorsize' : formvalue.RAW_sectorsize,
              'mode': formvalue.RAW_mode 
              }
            }
          this.ws.call(
            'datastore.update', ['vm.device', this.pk, payload]).subscribe(
              (res) => { this.router.navigate(new Array('').concat(this.route_success));
            },

            );
          }
 
}
