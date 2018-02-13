import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService, NetworkService } from '../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';

import { EntityUtils } from '../../common/entity/utils';
import {VmService} from '../../../services/vm.service';
import {regexValidator} from '../../common/entity/entity-form/validators/regex-validation';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';
import { validateBasis } from '@angular/flex-layout';


@Component({
  selector: 'app-vm-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers : [ VmService ]
})
export class VMWizardComponent {

  protected addWsCall = 'vm.create';
  public route_success: string[] = ['vm'];

  isLinear = true;
  firstFormGroup: FormGroup;
  protected dialogRef: any;

  protected wizardConfig: Wizard[] = [{
      label: 'OS category',
      fieldConfig: [
        {
          type: 'select',
          name: 'os',
          required: true,
          placeholder: 'Guest Operating System.',
          tooltip: 'What OS do you want to create? (Windows/Linux/FreeBSD)',
          options: [
            {label: 'windows', value: 'windows'},
            {label: 'linux', value: 'linux'},
            {label: 'freeBSD', value: 'freeBSD'},
          ],
        },
      { type: 'input',
        name : 'name',
        placeholder : 'Name of the VM',
        validation : [ Validators.required ]
      },
      { type: 'select',
        name : 'bootloader',
        placeholder : 'Boot Loader Type',
        options: []
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : 'Start on Boot',
        value: true
      },
      { type: 'checkbox',
      name : 'enable_vnc',
      placeholder : 'Enanble VNC',
      value: true
    }
      ]
    },
    {
      label: 'CPU and Memory configuration.',
      fieldConfig: [{
          type: 'input',
          name: 'vcpus',
          placeholder: 'Virtual CPUs',
          tooltip: '',
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: 'Memory Size (MiB)',
          tooltip: '',
        },
      ]
    },
    {
      label: 'Hard Disk Drive',
      fieldConfig: [
        {
          type: 'radio',
          name: 'disk_radio',
          placeholder : 'Create New Disk',
          tooltip: '',
          options:[{label:"yes", value: true}, 
                   {label:"no", value: false}],
          value: true,
        },
        {
          type: 'input',
          name: 'volsize',
          placeholder : 'please specify size for zvol\'s (GB\'s)',
          tooltip: '',
          isHidden: false
        },
        {
          type: 'select',
          name: 'datastore',
          placeholder : 'please select a datastore.',
          tooltip: '',
          options: [],
          isHidden: false
        },
        {
          type: 'explorer',
          name: 'hdd_path',
          placeholder: 'select an existing disk',
          tooltip: '',
          explorerType: "zvol",
          initial: '/mnt',
          isHidden: true
        },
      ]
    },
    {
      label: 'Network Interface',
      fieldConfig: [
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
          validation : [ Validators.required ]
        },
        {
          name : 'NIC_mac',
          placeholder : 'Mac Address',
          tooltip : 'By default, the VM receives an auto-generated random\
     MAC address. To override the default with a custom value, enter the\
     desired address into the field.',
          type: 'input',
          value : '00:a0:98:FF:FF:FF',
          validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i) ],
        },
        {
          name : 'nic_attach',
          placeholder : 'Nic to attach:',
          tooltip : 'Can be used to specify which physical interface to\
     associate with the VM if the system has multiple physical network\
     cards.',
          type: 'select',
          options : [],
          validation : [ Validators.required ]
        },
      ]
    },
    {
      label: 'Installation Media',
      fieldConfig: [{
          type: 'explorer',
          name: 'iso_path',
          placeholder : 'What ISO do you want to boot?',
          initial: '/mnt',
          tooltip: '',
          validation : [ Validators.required ]
        },
      ]
    },
  ]

  protected releaseField: any;
  protected currentServerVersion: any;
  private datastore: any;
  private nic_attach: any;
  private nicType:  any;
  private bootloader: any;

  constructor(protected rest: RestService, protected ws: WebSocketService, 
    public vmService: VmService, public networkService: NetworkService,
    protected loader: AppLoaderService, protected dialog: MatDialog, 
    private router: Router) {

  }

  preInit() {
  }

  afterInit(entityWizard: EntityWizardComponent) {
    
    ( < FormGroup > entityWizard.formArray.get([0]).get('os')).valueChanges.subscribe((res) => {
      if (res === 'windows') {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(2);
        ( < FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue(4096);
        ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(40);
      }
      else {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(1);
        ( < FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue(512);
        ( < FormGroup > entityWizard.formArray.get([2])).controls['volsize'].setValue(10);
      }
    });
    ( < FormGroup > entityWizard.formArray.get([2]).get('disk_radio')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[2].fieldConfig, {name : 'volsize'}).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'datastore'}).isHidden = false;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'hdd_path'}).isHidden = true;
      } else {
        _.find(this.wizardConfig[2].fieldConfig, {name : 'volsize'}).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'datastore'}).isHidden = true;
        _.find(this.wizardConfig[2].fieldConfig, {name : 'hdd_path'}).isHidden = false;
      }
      
    });
    this.ws.call('pool.dataset.query').subscribe((filesystem_res)=>{
      this.datastore = _.find(this.wizardConfig[2].fieldConfig, { name : 'datastore' });
      for (const idx in filesystem_res) {
        if(!filesystem_res[idx].name.includes("/") && !filesystem_res[idx].name.includes("freenas-boot")){
          this.datastore.options.push(
            {label : filesystem_res[idx].name, value : filesystem_res[idx].name});
        }
      };
    ( < FormGroup > entityWizard.formArray.get([2])).controls['datastore'].setValue(
      this.datastore.options[0].value
    )
    });

    this.networkService.getAllNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.wizardConfig[3].fieldConfig, {'name' : 'nic_attach'});
      res.forEach((item) => {
        this.nic_attach.options.push({label : item[1], value : item[0]});
      });
      ( < FormGroup > entityWizard.formArray.get([3])).controls['nic_attach'].setValue(
        this.nic_attach.options[0].value
      )

    });
    this.ws.call('notifier.choices', [ 'VM_NICTYPES' ]).subscribe((res) => {
          this.nicType = _.find(this.wizardConfig[3].fieldConfig, {name : "NIC_type"});
          res.forEach((item) => {
            this.nicType.options.push({label : item[1], value : item[0]});
          });
        ( < FormGroup > entityWizard.formArray.get([3])).controls['NIC_type'].setValue(
          this.nicType.options[0].value
        )
        });

        this.ws.call('notifier.choices', [ 'VM_BOOTLOADER' ]).subscribe((res) => {
          this.bootloader = _.find(this.wizardConfig[0].fieldConfig, {name : 'bootloader'});
          res.forEach((item) => {
            this.bootloader.options.push({label : item[1], value : item[0]})
          });
        ( < FormGroup > entityWizard.formArray.get([0])).controls['bootloader'].setValue(
          this.bootloader.options[0].value
        )
        });

  }
  getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

  customSubmit(value) {
    const hdd = value.datastore+"/"+value.name.replace(/\s+/g, '-')+"-"+Math.random().toString(36).substring(7);
    const payload = {}
    const vm_payload = {}
    payload["name"] = hdd
    payload["type"] = "VOLUME";
    payload["volsize"] = value.volsize * 1024 * 1000 * 1000;
    payload["volblocksize"] = "512";
    vm_payload["vm_type"]= "Bhyve";
    vm_payload["memory"]= value.memory;
    vm_payload["name"] = value.name;
    vm_payload["vcpus"] = value.vcpus;
    vm_payload["memory"] = value.memory;
    vm_payload["bootloader"] = value.bootloader;
    vm_payload["autoloader"] = value.autoloader;
    vm_payload["devices"] = [
      {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
      {"dtype": "DISK", "attributes": {"path": hdd, "type": "AHCI", "sectorsize": 0}},
      {"dtype": "CDROM", "attributes": {"path": value.iso_path}},
    ]
    if(value.enable_vnc){
      this.ws.call('interfaces.ipv4_in_use').subscribe((res)=>{
        vm_payload["devices"].push(
          {
            "dtype": "VNC", "attributes": {
              "wait": true, 
              "vnc_port": String(this.getRndInteger(5553,6553)), 
              "vnc_resolution": "1024x768",
              "vnc_bind": res[0], 
              "vnc_password": "", 
              "vnc_web": true 
            }
          }
      )
      })

    }
    this.loader.open();
    if( value.hdd_path ){
      for (const device of vm_payload["devices"]){
        if (device.dtype === "DISK"){
          device.attributes.path = '/dev/zvol/'+ value.hdd_path.substring(5);
        };
      };
      this.ws.call('vm.create', [vm_payload]).subscribe(vm_res => {
        this.loader.close();
        this.router.navigate(['/vm']);
    },(error) => {
      this.loader.close();
    });

    } else {
      this.ws.call('pool.dataset.create', [payload]).subscribe(res => {
        for (const device of vm_payload["devices"]){
          if (device.dtype === "DISK"){
            const orig_hdd = device.attributes.path;
            device.attributes.path = '/dev/zvol/' + orig_hdd
          };
        };
        this.ws.call('vm.create', [vm_payload]).subscribe(vm_res => {
          this.loader.close();
          this.router.navigate(['/vm']);
        });
      },(error) => {
        this.loader.close();
      });
    }

  }
}
