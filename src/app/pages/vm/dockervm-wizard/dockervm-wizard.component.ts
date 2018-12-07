import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService, NetworkService } from '../../../services';
import { FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';

import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import {VmService} from '../../../services/vm.service';
import {regexValidator} from '../../common/entity/entity-form/validators/regex-validation';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';

import { T } from '../../../translate-marker';
import { DialogService } from '../../../services/dialog.service';


@Component({
  selector: 'app-dockervm-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers : [ VmService ]
})
export class DockerVMWizardComponent {

  protected addWsCall = 'vm.create';
  public route_success: string[] = ['vm'];
  public summary = {};
  isLinear = true;
  firstFormGroup: FormGroup;
  protected dialogRef: any;
  objectKeys = Object.keys;
  summary_title = "Docker Summary";
  entityWizard: any;
  name: any;

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
          value: 'docker'
        },
      ]
    },
    {
      label: 'Docker VM details',
      fieldConfig: [
      { type: 'input',
        name : 'name',
        placeholder :  T ('Name'),
        tooltip : T('Enter a name for this Docker VM.'),
        validation : [ Validators.required ],
        required: true,
        blurStatus: true,
        blurEvent: this.blurEvent,
        parent: this
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : T ('Start on Boot'),
        tooltip : T('Set to start this VM when the system boots.'),
        value: true
      },
      ]
    },
    {
      label:  T ('CPU and Memory configuration.'),
      fieldConfig: [{
          type: 'input',
          name: 'vcpus',
          placeholder:  T('Virtual CPUs'),
          tooltip : T('Enter a number of virtual CPUs to allocate to the\
                      VM. The maximum is 16 unless the host CPU also\
                      limits the maximum. The VM operating system can\
                      also have operational or licensing restrictions on\
                      the number of CPUs.'),
          inputType: 'number',
          min: 1,
          validation : [ Validators.required, Validators.min(1), Validators.max(16) ],
          value: 1,
          required: true,
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: T('Memory Size (MiB)'),
          tooltip: T('Allocate a number of megabytes of RAM to the\
                      Docker VM.'),
          value: 2048,
          inputType: 'number',
          min: 2048,
          validation : [ Validators.required, Validators.min(2048)],
          required: true,
          blurStatus: true,
          blurEvent: this.blurEvent2,
          parent: this,
        },
      ]
    },
    {
      label: 'Network Interface',
      fieldConfig: [
        {
          name : 'NIC_type',
          placeholder : T('Adapter Type'),
          tooltip : T('<i>Intel e82545 (e1000)</i> emulates an\
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
          placeholder : T('MAC Address'),
          tooltip : T('A randomized MAC address is normally assigned. \
                       Enter a value here to set a specific MAC address.'),
          type: 'input',
          value : '00:a0:98:FF:FF:FF',
          validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i) ],
        },
        {
          name : 'nic_attach',
          placeholder : T('Attach NIC'),
          tooltip : T('Select the physical network interface to associate\
                       with the virtual machine.'),
          type: 'select',
          options : [],
          validation : [ Validators.required ],
          required: true,
        },
      ]
    },
    {
      label: 'Storage Files',
      fieldConfig: [
        {
          type: 'input',
          name: 'raw_filename',
          placeholder : T('Raw filename'),
          tooltip: T('Name the new raw file.'),
          validation : [ Validators.required ],
          required: true
        },
        {
          type: 'input',
          name: 'size',
          placeholder : T('Raw file size (GiB)'),
          tooltip: T('Allocate a number of gigabytes (GiB) to the new\
                      raw file.'),
          value: 20,
          inputType: 'number',
          min: 20,
          required: true,
          isHidden: false,
          blurStatus: true,
          blurEvent: this.blurEvent3,
          parent: this,
          validation: [Validators.required, Validators.min(20)]
        },
        {
          type: 'explorer',
          name: 'raw_file_directory',
          placeholder: T('Raw file location'),
          tooltip: T('Browse to an existing directory to store the new\
                      raw file.'),
          explorerType: "directory",
          initial: '/mnt',
          validation : [ Validators.required ],
          required: true
        },
        {
          type : 'select',
          name : 'sectorsize',
          placeholder : 'Disk sector size',
          tooltip : 'Select a sector size in bytes. <i>Default/i> leaves the\
                     sector size unset.',
          options: [
            { label: 'Default', value:0 },
            { label: '512', value:512 },
            { label: '4096', value:4096 },
                  ],
          value: 0
        },
      ]
    },
  ]

  protected releaseField: any;
  protected currentServerVersion: any;
  private raw_filename: any;
  private raw_file_directory: any;
  private raw_file: any;
  private nic_attach: any;
  private nicType:  any;
  private bootloader: any;

  constructor(protected rest: RestService, protected ws: WebSocketService,
    public vmService: VmService, public networkService: NetworkService,
    protected loader: AppLoaderService, protected dialog: MatDialog,
    private router: Router, private dialogService: DialogService) {

  }
  preInit(entityWizard: EntityWizardComponent){
    this.entityWizard = entityWizard;
  }


  afterInit(entityWizard: EntityWizardComponent) {

    ( < FormGroup > entityWizard.formArray.get([0]).get('wizard_type')).valueChanges.subscribe((res) => {
      if (res === 'vm') {
        this.router.navigate(new Array('/').concat(['vm','wizard']))
      }
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('name').valueChanges.subscribe((name) => {
      this.name = name;
      this.summary[T('Name')] = name;
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

      this.ws.call('vm.random_mac').subscribe((mac_res)=>{
        ( < FormGroup > entityWizard.formArray.get([3])).controls['NIC_mac'].setValue(mac_res);
      });

    ( < FormGroup > entityWizard.formArray.get([1]).get('name')).valueChanges.subscribe((name) => {
      this.summary[T('Name')] = name;
      this.summary[T('Number of CPUs')] = ( < FormGroup > entityWizard.formArray.get([2])).get('vcpus').value;
    });
    
      ( < FormGroup > entityWizard.formArray.get([2])).get('vcpus').valueChanges.subscribe((vcpus) => {
        this.summary[T('Number of CPUs')] = vcpus;
      });
      this.summary[T('Memory')] = ( < FormGroup > entityWizard.formArray.get([2])).get('memory').value + ' MiB';
      ( < FormGroup > entityWizard.formArray.get([2])).get('memory').valueChanges.subscribe((memory) => {
        this.summary[T('Memory')] = memory + ' MiB';
      });


      this.ws.call('vm.get_available_memory').subscribe((available_memory)=>{
        const vm_memory_requested = 2147483648;
        if (available_memory > vm_memory_requested) {
          ( < FormGroup > entityWizard.formArray.get([2])).controls['memory'].setValue(2048);
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'memory'})['hasErrors'] = false;
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = '';
        } else {
          ( < FormGroup > entityWizard.formArray.get([2])).controls['memory'].setValue(0);
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'memory'})['hasErrors'] = true;
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = `Docker Container needs at least 2048 MiBs Memory to operate.`
        }
      });
      ( < FormGroup > entityWizard.formArray.get([4])).get('raw_filename').valueChanges.subscribe((raw_filename) => {
        ( < FormGroup > entityWizard.formArray.get([4])).get('raw_file_directory').valueChanges.subscribe((raw_file_directory)=>{
          if(raw_file_directory !== undefined || raw_file_directory !== ""){
            this.summary[T('Raw file location')] = raw_file_directory + "/" +raw_filename+"_"+this.name;
          };
        })
      });
      this.summary[T('Raw file size')] = ( < FormGroup > entityWizard.formArray.get([4])).get('size').value + ' GiB';
      ( < FormGroup > entityWizard.formArray.get([4])).get('size').valueChanges.subscribe((size) => {
        this.summary[T('Raw file size')] = size + ' GiB';
      });
      ( < FormGroup > entityWizard.formArray.get([4])).get('raw_file_directory').valueChanges.subscribe((raw_file_directory)=>{
        if(raw_file_directory !== undefined || raw_file_directory !== "") {
        const volsize = ( < FormGroup > entityWizard.formArray.get([4])).controls['size'].value * 1073741824;
        this.ws.call('filesystem.statfs',[raw_file_directory]).subscribe((stat)=> {
         if (stat.free_bytes < volsize && stat.free_bytes <= 21474836480) {
          ( < FormGroup > entityWizard.formArray.get([4])).controls['size'].setValue(Math.floor(stat.free_bytes / (1073741824)));
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['hasErrors'] = true;
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['errors'] = 'Docker Container needs at least 20 Gibs';
         } else if(stat.free_bytes >= 21474836480) {
          ( < FormGroup > entityWizard.formArray.get([4])).controls['size'].setValue(20);
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['hasErrors'] = false;
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['errors'] = '';
         } else {
          ( < FormGroup > entityWizard.formArray.get([4])).controls['size'].setValue(Math.floor(stat.free_bytes / (1073741824)));
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['hasErrors'] = true;
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['errors'] = 'Docker Container needs at least 20 Gibs';
         }
        })
      }
      });
    
  }
  getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
blurEvent(parent){
  const vm_name = parent.entityWizard.formGroup.value.formArray[1].name
  parent.ws.call('vm.query', [[["name","=",vm_name]]]).subscribe((vm_wizard_res)=>{
    if(vm_wizard_res.length > 0){

      _.find(parent.wizardConfig[0].fieldConfig, {'name' : 'name'})['hasErrors'] = true;
      _.find(parent.wizardConfig[0].fieldConfig, {'name' : 'name'})['errors'] = `Docker Container: ${vm_wizard_res[0].name} already exists.`;
      parent.entityWizard.formArray.get([0]).get('name').setValue("");
      
    }
  })
}
blurEvent2(parent){
  const vm_memory_requested = parent.entityWizard.formGroup.value.formArray[2].memory
  const vm_name = parent.entityWizard.formGroup.value.formArray[1].name
  parent.ws.call('vm.get_available_memory').subscribe((vm_memory_available)=>{
    if( vm_memory_requested * 1048576 > vm_memory_available){
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['hasErrors'] = true;
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = `Cannot allocate ${vm_memory_requested} Mib to docker: ${vm_name}.`;
      parent.entityWizard.formArray.get([2]).get('memory').setValue(0);

    } else if (vm_memory_requested * 1048576 < 2147483648) {
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['hasErrors'] = true;
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = `Docker Container: "${vm_name}" needs at least 2048 MiBs Memory to operate.`;
      parent.entityWizard.formArray.get([2]).get('memory').setValue(0);

    } else {
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['hasErrors'] = false;
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = '';

    }
  })
}
blurEvent3(parent){
  if(parent.entityWizard.formArray.controls[4].value.size > 0 ) {
    const size = parent.entityWizard.formArray.controls[4].value.size * 1073741824;
    const raw_file_directory = parent.entityWizard.formArray.controls[4].value.raw_file_directory;
    const vm_name = parent.entityWizard.formGroup.value.formArray[1].name;
    if(raw_file_directory !== undefined && raw_file_directory !== "") {
      parent.ws.call('filesystem.statfs',[raw_file_directory]).subscribe((stat)=> {
        if (stat.free_bytes < size ) {
          _.find(parent.wizardConfig[4].fieldConfig, {'name' : 'size'})['hasErrors'] = true;
          _.find(parent.wizardConfig[4].fieldConfig, {'name' : 'size'})['errors'] = `Cannot allocate ${size / (1073741824)} Gib to for storage docker machine: ${vm_name}.`;
          parent.entityWizard.formArray.get([4]).get('size').setValue(0);
          
         };
      });
    };
  };
};

async customSubmit(value) {
  const path = value.raw_file_directory+ '/' + value.raw_filename+ '_'+ value.name;
    const payload = {}
    const vm_payload = {}
    vm_payload["type"]= "RancherOS";
    vm_payload["memory"]= String(value.memory);
    vm_payload["name"] = value.name;
    vm_payload["vcpus"] = String(value.vcpus);
    vm_payload["autostart"] = value.autostart;
    vm_payload["root_password"] = "docker"
    vm_payload["devices"] = [
      {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
      {"dtype": "RAW", "attributes": {"path": path,exists: false, "type": "AHCI", "size": value.size, sectorsize: 0}},
    ]
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Docker VM") }, disableClose: true });
    this.dialogRef.componentInstance.setCall('vm.create_container', [vm_payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.entityWizard.success = true;
      this.dialogRef.close(true);
      this.entityWizard.snackBar.open(T("Docker VM successfully Created"), T("Success"),{ duration: 5000 });
      this.router.navigate(['/vm']);
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
    });

  }

}
