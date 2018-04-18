import { Component, Input, Output, EventEmitter } from '@angular/core';
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
import { T } from '../../../translate-marker';


@Component({
  selector: 'app-vm-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers : [ VmService ]
})
export class VMWizardComponent {

  protected addWsCall = 'vm.create';
  public route_success: string[] = ['vm'];
  public summary = {};
  isLinear = true;
  firstFormGroup: FormGroup;
  protected dialogRef: any;
  objectKeys = Object.keys;
  summary_title = "VM Summary";

  protected wizardConfig: Wizard[] = [{
      label: T('Operating System'),
      fieldConfig: [
        {
          type: 'select',
          name: 'os',
          required: true,
          placeholder: T('Guest Operating System.'),
          tooltip: T('Select an operating system for the new Virtual\
 Machine.'),
          options: [
            {label: 'Windows', value: 'windows'},
            {label: 'Linux', value: 'linux'},
            {label: 'FreeBSD', value: 'freeBSD'},
          ],
          validation : [ Validators.required ],
        },
      { type: 'input',
        name : 'name',
        placeholder : T('VM Name'),
        tooltip : T('Type an alphanumeric name to identify the VM.'),
        validation : [ Validators.required ],
        required: true,
      },
      { type: 'select',
        name : 'bootloader',
        placeholder : T('Boot Method'),
        tooltip : T('Select <i>UEFI</i> for newer operating systems, or\
 <i>UEFI-CSM</i> (Compatibility Support Mode) for older operating\
 systems that only understand BIOS booting.'),
        options: []
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : T('Start on Boot'),
        tooltip : T('Start this VM when the system boots.'),
        value: true
      },
      { type: 'checkbox',
      name : 'enable_vnc',
      placeholder : T('Enable VNC'),
      tooltip : T('Activate a Virtual Network Computing (VNC)\
 remote connection for a VM set to <i>UEFI</i> booting.'),
      value: true
    }
      ]
    },
    {
      label: T('CPU and Memory'),
      fieldConfig: [{
          type: 'input',
          name: 'vcpus',
          placeholder: T('Virtual CPUs'),
          inputType: 'number',
          min: 1,
          validation : [ Validators.required, Validators.min(1) ],
          tooltip: T('Type the quantity of virtual CPUs allocated to the\
 VM, up to 16. Although these are virtual and not strictly related to\
 host processor cores, the CPU may limit the maximum number. The VM\
 operating system may also have operational or licensing restrictions on\
 the number of CPUs allowed.'),
          required: true,
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: T('Memory Size (MiB)'),
          inputType: 'number',
          min: 128,
          validation : [ Validators.required, Validators.min(128)],
          tooltip: T('Type the number of megabytes of system RAM to\
 allocate to the VM.'),
        },
      ]
    },
    {
      label: T('Hard Disks'),
      fieldConfig: [
        {
          type: 'radio',
          name: 'disk_radio',
//           tooltip: 'Select <i>Yes</i> to create a new Zvol on an\
//  existing datastore to be used as a virtual hard drive. Select <i>No</i>\
//  to use an existing disk for the VM.',
          options:[{label:T("Create new disk image"), value: true},
                   {label:T("Use existing disk image"), value: false}],
          value: true,
        },
        {
          type: 'input',
          name: 'volsize',
          placeholder : T('Define the size (in GiB) for the Zvol.'),
          tooltip: T('Type a number of GiB to allocate to the new Zvol.'),
          isHidden: false
        },
        {
          type: 'select',
          name: 'datastore',
          placeholder : T('Select a datastore.'),
          tooltip: T('Choose an existing datastore for the new Zvol.'),
          options: [],
          isHidden: false
        },
        {
          type: 'explorer',
          name: 'hdd_path',
          placeholder: T('Select an existing disk'),
          tooltip: T('Enter the path to a datastore on the existing disk.'),
          explorerType: "zvol",
          initial: '/mnt',
          isHidden: true
        },
      ]
    },
    {
      label: T('Network Interface'),
      fieldConfig: [
        {
          name : 'NIC_type',
          placeholder : T('Adapter Type'),
          tooltip : T('The default emulates an Intel E1000 (82545) Ethernet\
     card for compatibility with most operating systems. If the operating\
     system installed in the VM supports VirtIO paravirtualized network\
     drivers, this can be changed to <i>VirtIO</i> to provide better\
     performance.'),
          type: 'select',
          options : [],
          validation : [ Validators.required ],
          required: true,
        },
        {
          name : 'NIC_mac',
          placeholder : T('Mac Address'),
          tooltip : T('By default, the VM receives an auto-generated random\
     MAC address. To override the default with a custom value, enter the\
     desired address into the field.'),
          type: 'input',
          value : '00:a0:98:FF:FF:FF',
          validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i) ],
        },
        {
          name : 'nic_attach',
          placeholder : T('Nic to attach'),
          tooltip : T('Can be used to specify which physical interface to\
     associate with the VM if the system has multiple physical network\
     cards.'),
          type: 'select',
          options : [],
          validation : [ Validators.required ],
          required: true,
        },
      ]
    },
    {
      label: T('Installation Media'),
      fieldConfig: [
        {
          type: 'explorer',
          name: 'iso_path',
          placeholder : T('Choose an installation media'),
          initial: '/mnt',
          tooltip: T('Click <b>Browse</b> to select the path to the\
 installation media.'),
          validation : [ Validators.required ],
          required: true,
        },
        {
          type: 'checkbox',
          name: 'upload_iso_checkbox',
          placeholder : T('Upload an ISO?'),
          tooltip: T('Check to display upload options.'),
          value: false,
        },
        {
          type: 'explorer',
          name: 'upload_iso_path',
          placeholder : 'ISO save location',
          initial: '/mnt',
          tooltip: T('Click <b>Browse</b> to select a location to store\
 the uploaded ISO.'),
          explorerType: 'directory',
          isHidden: true,
          validation : [],
        },
        {
          type: 'upload',
          name: 'upload_iso',
          placeholder : '',
          tooltip: '',
          isHidden: true,
          acceptedFiles: ',.iso',
          fileLocation: '',
          validation : [  ],
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


  afterInit(entityWizard: EntityWizardComponent) {

    ( < FormGroup > entityWizard.formArray.get([0]).get('os')).valueChanges.subscribe((res) => {
      this.summary[T('guest operating system')] = res;
      ( < FormGroup > entityWizard.formArray.get([1])).get('vcpus').valueChanges.subscribe((vcpus) => {
        this.summary[T('Number of CPU')] = vcpus;
      });
      ( < FormGroup > entityWizard.formArray.get([1])).get('memory').valueChanges.subscribe((memory) => {
        this.summary[T('Memory')] = memory + ' Mib';
      });
      ( < FormGroup > entityWizard.formArray.get([2])).get('volsize').valueChanges.subscribe((volsize) => {
        this.summary[T('Hard Disk Size')] = volsize + ' Gib';
      });
      ( < FormGroup > entityWizard.formArray.get([4]).get('iso_path')).valueChanges.subscribe((iso_path) => {
        this.summary[T('Installation Media')] = iso_path;
      });
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
    ( < FormGroup > entityWizard.formArray.get([4]).get('upload_iso_checkbox')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'}).isHidden = false;
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso_path'}).isHidden = false;
      } else {
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'}).isHidden = true;
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso_path'}).isHidden = true;
      }

    });
    ( < FormGroup > entityWizard.formArray.get([4]).get('upload_iso_path')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[4].fieldConfig, {name : 'upload_iso'}).fileLocation = res;
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
      this.ws.call('vm.random_mac').subscribe((mac_res)=>{
        ( < FormGroup > entityWizard.formArray.get([3])).controls['NIC_mac'].setValue(mac_res);
      });

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

async customSubmit(value) {

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
      await this.create_vnc_device(vm_payload);
    };
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
  async create_vnc_device(vm_payload: any) {
    await this.ws.call('interfaces.ip_in_use', [{"ipv4": true}]).toPromise().then( res=>{
      vm_payload["devices"].push(
        {
          "dtype": "VNC", "attributes": {
            "wait": true,
            "vnc_port": String(this.getRndInteger(5553,6553)),
            "vnc_resolution": "1024x768",
            "vnc_bind": res[0].address,
            "vnc_password": "",
            "vnc_web": true
          }
        }
    );
    });
  }
}
