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
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';

import {WebSocketService, NetworkService, SystemGeneralService} from '../../../../services';
import {VmService} from '../../../../services/vm.service';
import {EntityUtils} from '../../../common/entity/utils';
import {EntityFormService} from '../../../common/entity/entity-form/services/entity-form.service';
import { EntityFormComponent, Formconfiguration } from '../../../common/entity/entity-form/entity-form.component';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import {EntityTemplateDirective} from '../../../common/entity/entity-template.directive';
import {regexValidator} from '../../../common/entity/entity-form/validators/regex-validation';

@Component({
  selector : 'device-edit',
  //templateUrl : '../../../common/entity/entity-form/entity-form.component.html',
  //template:'<entity-form [conf]="conf"></entity-form>',
  templateUrl : './device-edit.component.html',
  styleUrls: ['./device-edit.component.scss'],
  providers : [ VmService ]
})

export class DeviceEditComponent implements OnInit {

  saveSubmitText = "Save";
  public resource_name = 'vm/device';
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
  public fieldSets: FieldSet[] = [{
    name: 'Config',
    class: 'config',
    config: []
  }];
  public conf: Formconfiguration = {};
  public hasConf = true;
  public success = false;
  private nic_attach: any;
  private nicType:  any;
  private vnc_bind: any;
  private RAW_boot: any;
  private RAW_rootpwd: any;
  private RAW_size: any;
  public custActions: any[];

  templateTop: TemplateRef<any>;
  @ContentChildren(EntityTemplateDirective)
  templates: QueryList<EntityTemplateDirective>;


  constructor(protected router: Router, protected route: ActivatedRoute,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected networkService: NetworkService,
              protected systemGeneralService: SystemGeneralService,
              private entityFormService: EntityFormService,
              public vmService: VmService,
              public translate: TranslateService) {}
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
      this.fieldSets[0].config = [
        {
          type : 'explorer',
          initial: '/mnt',
          name : 'CDROM_path',
          placeholder : 'CD-ROM Path',
          tooltip : 'Browse to a CD-ROM file present on the system\
                     storage.',
        },
      ];
    } else if (this.dtype === "NIC") {
      this.fieldSets[0].config = [
        {
          name : 'NIC_type',
          placeholder : 'Adapter Type:',
          tooltip : 'Emulating an <i>Intel e82545 (e1000)</i> ethernet\
                     card has compatibility with most operating systems.\
                     Change to <i>VirtIO</i> to provide better\
                     performance on systems with VirtIO paravirtualized\
                     network driver support.',
          type: 'select',
          options : [],
          required: true,
          validation : [Validators.required]
        },
        {
          name : 'NIC_mac',
          placeholder : 'MAC Address',
          tooltip : 'By default, the VM receives an auto-generated\
                     random MAC address. Enter a custom address into the\
                     field to override the default. Click <b>Generate\
                     MAC Address</b> to add a new randomized address\
                     into this field.',
          type: 'input',
          value : '',
          validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i)],
          required: true,
        },
        {
          name : 'nic_attach',
          placeholder : 'NIC to attach:',
          tooltip : 'Select a physical interface to associate with the\
                     VM.',
          type: 'select',
          options : [],
          required: true,
          validation : [Validators.required]
        },
      ];
    } else if (this.dtype === "VNC") {
      this.fieldSets[0].config = [
        {
          name : 'VNC_port',
          placeholder : 'Port',
          tooltip : 'Can be set to <i>0</i>, left empty for FreeNAS to\
                     assign a port when the VM is started, or set to a\
                     fixed, preferred port number.',
          type : 'input',
          inputType: 'number'
        },
        {
          name : 'VNC_wait',
          placeholder : 'Wait to boot',
          tooltip : 'Set for the VNC client to wait until the VM has\
                     booted before attempting the connection.',
          type: 'checkbox'
        },
        {
          name : 'VNC_resolution',
          placeholder : 'Resolution',
          tooltip : 'Select a screen resolution to use for VNC sessions.',
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
          placeholder : 'Bind',
          tooltip : 'Select an IP address to use for VNC sessions.',
          type: 'select',
          options : [],
        },
        {
          name : 'vnc_password',
          placeholder : 'Password',
          tooltip : 'Enter a VNC password to automatically pass to the\
                     VNC session. Passwords cannot be longer than 8\
                     characters.',
          type : 'input',
          inputType : 'password',
        },
        {
          name : 'vnc_web',
          placeholder : 'Web Interface',
          tooltip : 'Set to enable connecting to the VNC web interface.',
          type: 'checkbox'
        },
      ];
    } else if (this.dtype === "DISK") {
      this.fieldSets[0].config = [
        {
          name : 'DISK_zvol',
          placeholder : 'Zvol',
          tooltip : 'Browse to an existing <a\
                     href="..//docs/storage.html#adding-zvols"\
                     target="_blank">Zvol</a>.',
          type: 'explorer',
          explorerType: "zvol",
          initial: '/mnt',
          required: true,
          validation : [Validators.required]
        },
        {
          name : 'DISK_mode',
          placeholder : 'Mode',
          tooltip : '<i>AHCI</i> emulates an AHCI hard disk for better\
                     software compatibility. <i>VirtIO</i> uses\
                     paravirtualized drivers and can provide better\
                     performance, but requires the operating system\
                     installed in the VM to support VirtIO disk devices.',
          type: 'select',
          options : [
            {label : 'AHCI', value : 'AHCI'},
            {label : 'VirtIO', value : 'VIRTIO'},
          ],
        },
        {
          name : 'DISK_sectorsize',
          placeholder : 'Disk sector size',
          tooltip : 'Enter the sector size in bytes. The default <i>0</i>\
                     leaves the sector size unset.',
          type: 'input',
        },
      ];
    } else if (this.dtype === "RAW") {
      this.fieldSets[0].config = [
        {
          type : 'explorer',
          initial: '/mnt',
          name : 'RAW_path',
          placeholder : 'Raw File',
          tooltip : 'Browse to a storage location and add the name of\
                     the new raw file on the end of the path.',
          required: true,
          validation : [Validators.required]
        },
        {
          type : 'input',
          name : 'RAW_sectorsize',
          placeholder : 'Disk sector size',
          tooltip : 'Enter a sector size in bytes. <i>0</i> leaves the\
                     sector size unset.',
          inputType : 'number',
        },
        {
          name : 'RAW_mode',
          placeholder : 'Mode',
          tooltip : '<i>AHCI</i> emulates an AHCI hard disk for best\
                     software compatibility. <i>VirtIO</i> uses\
                     paravirtualized drivers and can provide better\
                     performance, but requires the operating system\
                     installed in the VM to support VirtIO disk devices.',
          type: 'select',
          options : [
            {label : 'AHCI', value : 'AHCI'},
            {label : 'VirtIO', value : 'VIRTIO'},
          ],
        },
        {
          type : 'checkbox',
          name : 'RAW_boot',
          placeholder : 'Boot',
          tooltip : 'Set to boot the VM from this device.',
          isHidden: true
        },
        {
          type : 'input',
          name : 'RAW_rootpwd',
          placeholder : 'password',
          tooltip : 'Enter a password for the <i>rancher</i> user. This\
                     is used to log in to the VM from the serial shell.',
          inputType : 'password',
          isHidden: true
        },
        {
          type : 'input',
          name : 'RAW_size',
          placeholder : 'Raw filesize',
          tooltip : 'Define the size of the raw file in GiB.',
          inputType : 'number',
          isHidden: true
        },
      ];
    }
    this.afterInit();
  }

  afterInit(){
    this.formGroup = this.entityFormService.createFormGroup(this.fieldSets[0].config);
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
      'type':'RAW_mode',
      'boot': 'RAW_boot',
      'rootpwd': 'RAW_rootpwd',
      'size': 'RAW_size'
    };
    this.ws.call('datastore.query', ['vm.device', [["id", "=", this.pk]]]).subscribe((device)=>{
      if (device[0].dtype === 'CDROM'){
        this.setgetValues(device[0].attributes, cdrom_lookup_table);
      }
      else if(device[0].dtype === 'VNC'){
        this.systemGeneralService.getIPChoices().subscribe((ipchoices) => {
          this.vnc_bind = _.find(this.fieldSets[0].config, {'name' : 'vnc_bind'});
          for(const ipchoice of ipchoices){
            this.vnc_bind.options.push({label : ipchoice[1], value : ipchoice[0]});
          }
        });
        this.setgetValues(device[0].attributes, vnc_lookup_table);
      }
      else if(device[0].dtype === 'NIC'){
        this.networkService.getAllNicChoices().subscribe((nics) => {
          this.nic_attach = _.find(this.fieldSets[0].config, {'name' : 'nic_attach'});
          if (this.nic_attach ){
            for(const nic of nics){
              this.nic_attach.options.push({label : nic[1], value : nic[0]});
            };
          }
        });
        this.ws.call('notifier.choices', [ 'VM_NICTYPES' ])
        .subscribe((NIC_types) => {
          this.nicType = _.find(this.fieldSets[0].config, {name : "NIC_type"});
          if (this.nicType ){
            for(const NIC_type of NIC_types){
              this.nicType.options.push({label : NIC_type[1], value : NIC_type[0]});
            };
          }
        });
        this.setgetValues(device[0].attributes, nic_lookup_table);
        this.custActions = [
          {
            id: 'generate_mac_address',
            name: 'Generate MAC Address',
            function: () => {
              this.ws.call('vm.random_mac').subscribe((random_mac) => {
                this.formGroup.controls['NIC_mac'].setValue(random_mac);
              })
            }
          }
        ];
      }
      else if (device[0].dtype === 'DISK'){
        this.DISK_zvol = _.find(this.fieldSets[0].config, {name:'DISK_zvol'});
        this.setgetValues(device[0].attributes, disk_lookup_table);
      }
      else {
        if (device[0].vm.vm_type==="Container Provider"){
          this.RAW_boot = _.find(this.fieldSets[0].config, {name:'RAW_boot'})
          this.RAW_rootpwd = _.find(this.fieldSets[0].config, {name:'RAW_rootpwd'})
          this.RAW_size = _.find(this.fieldSets[0].config, {name:'RAW_size'})
          this.RAW_boot.isHidden = false
          this.RAW_rootpwd.isHidden = false
          this.RAW_size.isHidden = false
        }

        this.setgetValues(device[0].attributes, rawfile_lookup_table);
        }

    })
  }

  setgetValues(data, lookupTable) {
    let fg: any
    for (const i in data) {
      if(this.formGroup.controls[lookupTable[i]]){
        fg = this.formGroup.controls[lookupTable[i]];
      } else if(this.formGroup.controls[i]){
        fg = this.formGroup.controls[i];
      }
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
                'path' : formvalue.DISK_zvol,
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
              'mode': formvalue.RAW_mode,
              }
            if (formvalue.RAW_boot || formvalue.RAW_rootpwd || formvalue.RAW_size ){
              Object.assign(
                payload['attributes'],
                { "boot": formvalue.RAW_boot},
                {"rootpwd" :formvalue.RAW_rootpwd},
                {"size":formvalue.RAW_size}
               )
            }
            }
          this.ws.call(
            'datastore.update', ['vm.device', this.pk, payload]).subscribe(
              (res) => { this.router.navigate(new Array('').concat(this.route_success));
            },

            );
          }

}
