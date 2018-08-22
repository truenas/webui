import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService, NetworkService } from '../../../services';
import { FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import {MessageService} from '../../common/entity/entity-form/services/message.service';
import * as _ from 'lodash';

import {VmService} from '../../../services/vm.service';
import {regexValidator} from '../../common/entity/entity-form/validators/regex-validation';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';
import { T } from '../../../translate-marker';
import { DialogService } from '../../../services/dialog.service';


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

  entityWizard: any;

  protected wizardConfig: Wizard[] = [

    {
      label: T('Select VM wizard type'),
      fieldConfig: [

        {
          type: 'select',
          name: 'wizard_type',
          required: true,
          placeholder: T('Virtual Machine (VM) Wizard type.'),
          tooltip: T('Select the Virtual Machine (VM) Wizard type.'),
          options: [
            {label: 'Virtual Machine (VM)', value: 'vm'},
            {label: 'Docker Host', value: 'docker'},
          ],
          validation : [ Validators.required ],
          value: 'vm'
        },
      ]
    },


    {
      label: T('Operating System'),
      fieldConfig: [
        {
          type: 'select',
          name: 'os',
          required: true,
          placeholder: T('Guest Operating System'),
          tooltip: T('Choose the VM operating system type.'),
          options: [
            {label: 'Windows', value: 'Windows'},
            {label: 'Linux', value: 'Linux'},
            {label: 'FreeBSD', value: 'FreeBSD'},
          ],
          validation : [ Validators.required ],
        },
      { type: 'input',
        name : 'name',
        placeholder : T('Name'),
        tooltip : T('Enter an alphanumeric name for the virtual machine.'),
        validation : [ Validators.required ],
        required: true,
        blurStatus: true,
        blurEvent: this.blurEvent,
        parent: this
      },
      { type: 'select',
        name : 'bootloader',
        placeholder : T('Boot Method'),
        tooltip : T('Select <i>UEFI</i> for newer operating systems or\
                     <i>UEFI-CSM</i> (Compatibility Support Mode) for\
                     older operating systems that only support BIOS\
                     booting.'),
        options: []
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : T('Start on Boot'),
        tooltip : T('Set to start this VM when the system boots.'),
        value: true
      },
      { type: 'checkbox',
      name : 'enable_vnc',
      placeholder : T('Enable VNC'),
      tooltip : T('Enable a VNC (Virtual Network Computing) remote\
                   connection. Requires <i>UEFI</i> booting.'),
      value: true,
      isHidden: false
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
          validation : [ Validators.required, Validators.min(1), Validators.max(16) ],
          tooltip: T('Number of virtual CPUs to allocate to the virtual\
                      machine. The maximum is 16, or fewer if the host\
                      CPU limits the maximum. The VM operating system\
                      might also have operational or licensing\
                      restrictions on the number of CPUs.'),
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: T('Memory Size (MiB)'),
          inputType: 'number',
          min: 128,
          validation : [ Validators.required, Validators.min(128)],
          required: true,
          blurStatus: true,
          blurEvent: this.blurEvent2,
          parent: this,
          tooltip: T('Allocate a number of megabytes of RAM for the VM.'),
        },
      ]
    },
    {
      label: T('Hard Disks'),
      fieldConfig: [
        {
          type: 'radio',
          name: 'disk_radio',
          tooltip: 'Select <i>Create new disk image</i> to create a new\
                    zvol on an existing dataset. This is used as a\
                    virtual hard drive for the VM. Select <i>Use\
                    existing disk image</i> to use an existing zvol or\
                    file for the VM.',
          options:[{label:T("Create new disk image"), value: true},
                   {label:T("Use existing disk image"), value: false}],
          value: true,
        },
        {
          type: 'input',
          name: 'volsize',
          placeholder : T('Define the size (GiB) for the zvol'),
          tooltip: T('Allocate a number of gigabytes of space for the\
                      new zvol.'),
          isHidden: false
        },
        {
          type: 'paragraph',
          name: 'pool_detach_warning',
          paraText: T("Select a pool or dataset"),
        },
        {
          type: 'explorer',
          name: 'datastore',
          tooltip: T('Choose a pool or dataset for the new zvol.'),
          options: [],
          isHidden: false,
          initial: '/mnt',
          explorerType: 'directory'
        },
        {
          type: 'select',
          name: 'hdd_path',
          placeholder: T('Select an existing disk'),
          tooltip: T('Browse to the desired pool or dataset on the disk.'),
          isHidden: true,
          options:[]
        },
      ]
    },
    {
      label: T('Network Interface'),
      fieldConfig: [
        {
          name : 'NIC_type',
          placeholder : T('Adapter Type'),
          tooltip : T('<i>Intel e82545 (e1000)</i> emulates the same\
                       Intel Ethernet card. This provides compatibility\
                       with most operating systems. <i>VirtIO</i>\
                       provides better performance when the operating\
                       system installed in the VM supports VirtIO\
                       paravirtualized network drivers.'),
          type: 'select',
          options : [],
          validation : [ Validators.required ],
          required: true,
        },
        {
          name : 'NIC_mac',
          placeholder : T('Mac Address'),
          tooltip : T('Enter the desired address into the field to\
                       override the randomized MAC address.'),
          type: 'input',
          value : '00:a0:98:FF:FF:FF',
          validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i) ],
        },
        {
          name : 'nic_attach',
          placeholder : T('Attach NIC'),
          tooltip : T('Select the physical interface to associate with\
                       the VM.'),
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
          placeholder : T('Choose installation media image'),
          initial: '/mnt',
          tooltip: T('Browse to the operating system installer image file.'),
          validation : [ Validators.required ],
          required: true,
        },
        {
          type: 'checkbox',
          name: 'upload_iso_checkbox',
          placeholder : T('Upload an installer image file'),
          tooltip: T('Set to display image upload options.'),
          value: false,
        },
        {
          type: 'explorer',
          name: 'upload_iso_path',
          placeholder : 'ISO save location',
          initial: '/mnt',
          tooltip: T('Choose a location to store the installer image file.'),
          explorerType: 'directory',
          isHidden: true,
          validation : [],
        },
        {
          type: 'upload',
          name: 'upload_iso',
          placeholder : 'ISO upload location',
          tooltip: 'Browse to the installer image file and click <b>Upload</b>.',
          isHidden: true,
          acceptedFiles: '.img,.iso',
          fileLocation: '',
          validation : [  ],
          message: this.messageService
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
    public messageService: MessageService,private router: Router,
    private dialogService: DialogService) {

  }

  preInit(entityWizard: EntityWizardComponent){
    this.entityWizard = entityWizard;
  }
  afterInit(entityWizard: EntityWizardComponent) {

    this.ws.call("pool.dataset.query",[[["type", "=", "VOLUME"]]]).subscribe((zvols)=>{
      zvols.forEach(zvol => {
        _.find(this.wizardConfig[3].fieldConfig, {name : 'hdd_path'}).options.push(
          {
            label : zvol.id, value : zvol.id
          }
        );   
      });
    });

    ( < FormGroup > entityWizard.formArray.get([0]).get('wizard_type')).valueChanges.subscribe((res) => {
      if (res === 'docker') {
        this.router.navigate(new Array('/').concat(['vm','dockerwizard']))
      }
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('bootloader')).valueChanges.subscribe((bootloader) => {
      if(bootloader === "UEFI_CSM"){
        _.find(this.wizardConfig[1].fieldConfig, {name : 'enable_vnc'}).isHidden = true;
      } else {
        _.find(this.wizardConfig[1].fieldConfig, {name : 'enable_vnc'}).isHidden = false;
      }


    });


    ( < FormGroup > entityWizard.formArray.get([1]).get('os')).valueChanges.subscribe((res) => {
      this.summary[T('Guest Operating System')] = res;
      ( < FormGroup > entityWizard.formArray.get([1])).get('name').valueChanges.subscribe((name) => {
        this.summary[T('Name')] = name;
      });
      ( < FormGroup > entityWizard.formArray.get([2])).get('vcpus').valueChanges.subscribe((vcpus) => {
        this.summary[T('Number of CPUs')] = vcpus;
      });
      ( < FormGroup > entityWizard.formArray.get([2])).get('memory').valueChanges.subscribe((memory) => {
        this.summary[T('Memory')] = memory + ' MiB';
      });

      ( < FormGroup > entityWizard.formArray.get([3])).get('volsize').valueChanges.subscribe((volsize) => {
        this.summary[T('Hard Disk Size')] = volsize + ' GiB';
      });

      ( < FormGroup > entityWizard.formArray.get([3])).get('disk_radio').valueChanges.subscribe((disk_radio)=>{
        if(this.summary[T('Hard Disk')] || this.summary[T('Hard Disk Size')]){
          delete this.summary[T('Hard Disk')];
          delete this.summary[T('Hard Disk Size')];
        }
        if(disk_radio) {
          this.summary[T('Hard Disk Size')] = ( < FormGroup > entityWizard.formArray.get([3])).controls['volsize'].value + ' Gib';
            ( < FormGroup > entityWizard.formArray.get([3])).get('volsize').valueChanges.subscribe((volsize) => {
              this.summary[T('Hard Disk Size')] = volsize + ' GiB';
            });
        } else {
          this.summary[T('Hard Disk')] = ( < FormGroup > entityWizard.formArray.get([3])).controls['hdd_path'].value;
            ( < FormGroup > entityWizard.formArray.get([3])).get('hdd_path').valueChanges.subscribe((existing_hdd_path)=>{
              this.summary[T('Hard Disk')] = existing_hdd_path;
            })
        }
      });

      ( < FormGroup > entityWizard.formArray.get([5]).get('iso_path')).valueChanges.subscribe((iso_path) => {
        this.summary[T('Installation Media')] = iso_path;
      });
      this.messageService.messageSourceHasNewMessage$.subscribe((message)=>{
        ( < FormGroup > entityWizard.formArray.get([5]).get('iso_path')).setValue(message);
      })
      this.ws.call('vm.get_available_memory').subscribe((available_memory)=>{
        if (available_memory > 512 * 1024* 1024) {
          if (res === 'Windows') {
            ( < FormGroup > entityWizard.formArray.get([2])).controls['vcpus'].setValue(2);
            ( < FormGroup > entityWizard.formArray.get([2])).controls['memory'].setValue(4096);
            ( < FormGroup > entityWizard.formArray.get([3])).controls['volsize'].setValue(40);
          }
          else {
            ( < FormGroup > entityWizard.formArray.get([2])).controls['vcpus'].setValue(1);
            ( < FormGroup > entityWizard.formArray.get([2])).controls['memory'].setValue(512);
            ( < FormGroup > entityWizard.formArray.get([3])).controls['volsize'].setValue(10);
          }

        } else {
          if (res === 'Windows') {
            ( < FormGroup > entityWizard.formArray.get([2])).controls['vcpus'].setValue(2);
            ( < FormGroup > entityWizard.formArray.get([2])).controls['memory'].setValue(0);
            ( < FormGroup > entityWizard.formArray.get([3])).controls['volsize'].setValue(40);
          }
          else {
            ( < FormGroup > entityWizard.formArray.get([2])).controls['vcpus'].setValue(1);
            ( < FormGroup > entityWizard.formArray.get([2])).controls['memory'].setValue(0);
            ( < FormGroup > entityWizard.formArray.get([3])).controls['volsize'].setValue(10);
          }

        }
      })

    });
    ( < FormGroup > entityWizard.formArray.get([3]).get('disk_radio')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[3].fieldConfig, {name : 'volsize'}).isHidden = false;
        _.find(this.wizardConfig[3].fieldConfig, {name : 'datastore'}).isHidden = false;
        _.find(this.wizardConfig[3].fieldConfig, {name : 'hdd_path'}).isHidden = true;
      } else {
        _.find(this.wizardConfig[3].fieldConfig, {name : 'volsize'}).isHidden = true;
        _.find(this.wizardConfig[3].fieldConfig, {name : 'datastore'}).isHidden = true;
        _.find(this.wizardConfig[3].fieldConfig, {name : 'hdd_path'}).isHidden = false;
      }

    });
    ( < FormGroup > entityWizard.formArray.get([5]).get('upload_iso_checkbox')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[5].fieldConfig, {name : 'upload_iso'}).isHidden = false;
        _.find(this.wizardConfig[5].fieldConfig, {name : 'upload_iso_path'}).isHidden = false;
      } else {
        _.find(this.wizardConfig[5].fieldConfig, {name : 'upload_iso'}).isHidden = true;
        _.find(this.wizardConfig[5].fieldConfig, {name : 'upload_iso_path'}).isHidden = true;
      }

    });
    ( < FormGroup > entityWizard.formArray.get([5]).get('upload_iso_path')).valueChanges.subscribe((res) => {
      if (res){
        _.find(this.wizardConfig[5].fieldConfig, {name : 'upload_iso'}).fileLocation = res;
      }

    });
    this.ws.call('pool.dataset.query').subscribe((filesystem_res)=>{
      this.datastore = _.find(this.wizardConfig[3].fieldConfig, { name : 'datastore' });
      for (const idx in filesystem_res) {
        if(!filesystem_res[idx].name.includes("/") && !filesystem_res[idx].name.includes("freenas-boot")){
          this.datastore.options.push(
            {label : filesystem_res[idx].name, value : filesystem_res[idx].name});
        }
      };
    ( < FormGroup > entityWizard.formArray.get([3])).controls['datastore'].setValue(
      '/mnt/'+this.datastore.options[0].value
    )
    });

    this.networkService.getAllNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.wizardConfig[4].fieldConfig, {'name' : 'nic_attach'});
      res.forEach((item) => {
        this.nic_attach.options.push({label : item[1], value : item[0]});
      });
      ( < FormGroup > entityWizard.formArray.get([4])).controls['nic_attach'].setValue(
        this.nic_attach.options[0].value
      )
      this.ws.call('vm.random_mac').subscribe((mac_res)=>{
        ( < FormGroup > entityWizard.formArray.get([4])).controls['NIC_mac'].setValue(mac_res);
      });

    });
    this.ws.call('notifier.choices', [ 'VM_NICTYPES' ]).subscribe((res) => {
          this.nicType = _.find(this.wizardConfig[4].fieldConfig, {name : "NIC_type"});
          res.forEach((item) => {
            this.nicType.options.push({label : item[1], value : item[0]});
          });
        ( < FormGroup > entityWizard.formArray.get([4])).controls['NIC_type'].setValue(
          this.nicType.options[0].value
        )
        });

      this.ws.call('notifier.choices', [ 'VM_BOOTLOADER' ]).subscribe((res) => {
        this.bootloader = _.find(this.wizardConfig[1].fieldConfig, {name : 'bootloader'});
        res.forEach((item) => {
          this.bootloader.options.push({label : item[1], value : item[0]})
        });
      ( < FormGroup > entityWizard.formArray.get([1])).controls['bootloader'].setValue(
        this.bootloader.options[0].value
      )
      });
  }
  getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
blurEvent(parent){
  const vm_name = parent.entityWizard.formGroup.value.formArray[1].name
  parent.ws.call('vm.query', [[["name","=",vm_name]]]).subscribe((vm_wizard_res)=>{
    if(vm_wizard_res.length > 0){
      parent.dialogService.Info("Error", `Virtual machine ${vm_wizard_res[0].name} already exists.`).subscribe(()=>{
        parent.entityWizard.formArray.get([1]).get('name').setValue("");
      })

    }
  })
}

blurEvent2(parent){
  const vm_memory_requested = parent.entityWizard.formGroup.value.formArray[2].memory
  const vm_name = parent.entityWizard.formGroup.value.formArray[1].name
  parent.ws.call('vm.get_available_memory').subscribe((vm_memory_available)=>{
    if( vm_memory_requested *1024*1024> vm_memory_available){
      parent.dialogService.Info("Error", `Cannot allocate ${vm_memory_requested} Mib to virtual machine: ${vm_name}.`).subscribe(()=>{
        parent.entityWizard.formArray.get([2]).get('memory').setValue(0);
      })

    }
  })
}

async customSubmit(value) {
    value.datastore = value.datastore.replace('/mnt/','')
    const hdd = value.datastore+"/"+value.name.replace(/\s+/g, '-')+"-"+Math.random().toString(36).substring(7);
    const vm_payload = {}
    const zvol_payload = {}

    // zvol_payload only applies if the user is creating one
    zvol_payload['create_zvol'] = true
    zvol_payload["zvol_name"] = hdd
    zvol_payload["zvol_type"] = "VOLUME";
    zvol_payload["zvol_volsize"] = value.volsize * 1024 * 1000 * 1000;

    vm_payload["vm_type"]= "Bhyve";
    vm_payload["memory"]= value.memory;
    vm_payload["name"] = value.name;
    vm_payload["vcpus"] = value.vcpus;
    vm_payload["memory"] = value.memory;
    vm_payload["bootloader"] = value.bootloader;
    vm_payload["autoloader"] = value.autoloader;
    vm_payload["autostart"] = value.autostart;
    vm_payload["devices"] = [
      {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
      {"dtype": "DISK", "attributes": {"path": hdd, "type": "AHCI", "sectorsize": 0}},
      {"dtype": "CDROM", "attributes": {"path": value.iso_path}},
    ]
    if(value.enable_vnc &&value.bootloader !== "UEFI_CSM"){
      await this.create_vnc_device(vm_payload);
    };
    this.loader.open();
    if( value.hdd_path ){
      for (const device of vm_payload["devices"]){
        if (device.dtype === "DISK"){
          device.attributes.path = '/dev/zvol/'+ value.hdd_path;
        };
      };
      this.ws.call('vm.create', [vm_payload]).subscribe(vm_res => {
        this.loader.close();
        this.router.navigate(['/vm']);
    },(error) => {
      this.loader.close();
      this.dialogService.errorReport(T("Error creating VM."), error.reason, error.trace.formatted);
    });

    } else {
      for (const device of vm_payload["devices"]){
        if (device.dtype === "DISK"){          
          const orig_hdd = device.attributes.path;
          const create_zvol = zvol_payload['create_zvol']
          const zvol_name = zvol_payload['zvol_name']
          const zvol_type = zvol_payload['zvol_type']
          const zvol_volsize = zvol_payload['zvol_volsize']

          device.attributes.path = '/dev/zvol/' + orig_hdd
          device.attributes.create_zvol = create_zvol
          device.attributes.zvol_name = zvol_name
          device.attributes.zvol_type = zvol_type
          device.attributes.zvol_volsize = zvol_volsize
        };
      };
      this.ws.call('vm.create', [vm_payload]).subscribe(vm_res => {
        this.loader.close();
        this.router.navigate(['/vm']);
      },(error) => {
        this.loader.close();
        this.dialogService.errorReport(T("Error creating VM."), error.reason, error.trace.formatted);
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
