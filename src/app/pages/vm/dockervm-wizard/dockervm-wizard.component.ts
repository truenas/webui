import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService, NetworkService } from '../../../services';
import { FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';

import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { VmService } from '../../../services/vm.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';

import { T } from '../../../translate-marker';
import { DialogService } from '../../../services/dialog.service';
import helptext from '../../../helptext/vm/docker-vm-wizard/docker-vm-wizard';
import globalHelptext from  '../../../helptext/global-helptext';

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
  summary_title = globalHelptext.dockerhost + " Summary";
  entityWizard: any;
  name: any;

  protected wizardConfig: Wizard[] = [
    {
      label: helptext.wizard_type_label,
      fieldConfig: [

        {
          type: 'select',
          name: 'wizard_type',
          required: true,
          placeholder: helptext.wizard_type_placeholder,
          tooltip: helptext.wizard_type_tooltip,
          options: helptext.wizard_type_options,
          validation : helptext.wizard_type_validation,
          value: helptext.wizard_type_value
        },
      ]
    },
    {
      label: helptext.docker_vm_label,
      fieldConfig: [
      { type: 'input',
        name : 'name',
        placeholder :  helptext.docker_vm_placeholder,
        tooltip : helptext.docker_vm_tooltip,
        validation : [Validators.required,Validators.pattern('^[a-zA-Z0-9_]*$')],
        required: true,
        blurStatus: true,
        blurEvent: this.blurEvent,
        parent: this
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : helptext.autostart_placeholder,
        tooltip : helptext.autostart_tooltip,
        value: helptext.autostart_value
      },
      ]
    },
    {
      label:  helptext.vcpus_label,
      fieldConfig: [{
          type: 'input',
          name: 'vcpus',
          placeholder:  helptext.vcpus_placeholder,
          tooltip : helptext.vcpus_tooltip,
          inputType: 'number',
          min: 1,
          validation : helptext.vcpus_validation,
          value: 1,
          required: true,
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: helptext.memory_placeholder,
          tooltip: helptext.memory_tooltip,
          value: 2048,
          inputType: 'number',
          min: 2048,
          validation : helptext.memory_validation,
          required: true,
          blurStatus: true,
          blurEvent: this.blurEvent2,
          parent: this,
        },
      ]
    },
    {
      label: helptext.NIC_type_label,
      fieldConfig: [
        {
          name : 'NIC_type',
          placeholder : helptext.NIC_type_placeholder,
          tooltip : helptext.NIC_type_tooltip,
          type: 'select',
          options : [],
          validation : helptext.NIC_type_validation,
          required: true,
        },
        {
          name : 'NIC_mac',
          placeholder : helptext.NIC_mac_placeholder,
          tooltip : helptext.NIC_mac_tooltip,
          type: 'input',
          value : helptext.NIC_mac_value,
          validation : helptext.NIC_mac_validation,
        },
        {
          name : 'nic_attach',
          placeholder : helptext.nic_attach_placeholder,
          tooltip : helptext.nic_attach_tooltip,
          type: 'select',
          options : [],
          validation : helptext.nic_attach_validation,
          required: true,
        },
      ]
    },
    {
      label: helptext.files_label,
      fieldConfig: [
        {
          type: 'input',
          name: 'raw_filename',
          placeholder : helptext.raw_filename_placeholder,
          tooltip: helptext.raw_filename_tooltip,
          validation : helptext.raw_filename_validation,
          required: true
        },
        {
          type: 'input',
          name: 'raw_filename_password',
          placeholder : helptext.raw_filename_password_placeholder,
          tooltip: helptext.raw_filename_password_tooltip,
          validation : helptext.raw_filename_password_validation,
          inputType: 'password',
          value: 'docker'
        },
        {
          type: 'input',
          name: 'size',
          placeholder : helptext.raw_filesize_placeholder,
          tooltip: helptext.raw_filesize_tooltip,
          value: 20,
          inputType: 'number',
          min: 20,
          required: true,
          isHidden: false,
          blurStatus: true,
          blurEvent: this.blurEvent3,
          parent: this,
          validation: helptext.raw_filesize_validation
        },
        {
          type: 'explorer',
          name: 'raw_file_directory',
          placeholder: helptext.raw_file_directory_placeholder,
          tooltip: helptext.raw_file_directory_tooltip,
          explorerType: "directory",
          initial: '/mnt',
          validation : helptext.raw_file_directory_validation,
          required: true
        },
        {
          type : 'select',
          name : 'sectorsize',
          placeholder : helptext.sectorsize_placeholder,
          tooltip : helptext.sectorsize_tooltip,
          options: helptext.sectorsize_options,
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
          _.find(this.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = `${globalHelptext.dockerhost} needs at least 2048 MiB memory.`
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
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['errors'] = `${globalHelptext.dockerhost} needs at least 20 GiB.`;
         } else if(stat.free_bytes >= 21474836480) {
          ( < FormGroup > entityWizard.formArray.get([4])).controls['size'].setValue(20);
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['hasErrors'] = false;
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['errors'] = '';
         } else {
          ( < FormGroup > entityWizard.formArray.get([4])).controls['size'].setValue(Math.floor(stat.free_bytes / (1073741824)));
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['hasErrors'] = true;
          _.find(this.wizardConfig[4].fieldConfig, {'name' : 'size'})['errors'] = `${globalHelptext.dockerhost} needs at least 20 GiB.`;
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
      _.find(parent.wizardConfig[0].fieldConfig, {'name' : 'name'})['errors'] = `${globalHelptext.dockerhost} "${vm_wizard_res[0].name}" already exists.`;
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
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = `Cannot allocate ${vm_memory_requested} MiB to ${globalHelptext.dockerhost} "${vm_name}".`;
      parent.entityWizard.formArray.get([2]).get('memory').setValue(0);

    } else if (vm_memory_requested * 1048576 < 2147483648) {
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['hasErrors'] = true;
      _.find(parent.wizardConfig[2].fieldConfig, {'name' : 'memory'})['errors'] = `${globalHelptext.dockerhost} "${vm_name}" needs at least 2048 MiB memory.`;
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
          _.find(parent.wizardConfig[4].fieldConfig, {'name' : 'size'})['errors'] = `Cannot allocate ${size / (1073741824)} GiB for ${globalHelptext.dockerhost} "${vm_name}" storage.`;
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
    vm_payload["root_password"] = value.raw_filename_password;
    vm_payload["devices"] = [
      {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
      {"dtype": "RAW", "attributes": {"path": path,exists: false, "type": "AHCI", "size": value.size, sectorsize: 0}},
    ]
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T(globalHelptext.dockerhost) }, disableClose: true });
    this.dialogRef.componentInstance.setCall('vm.create_container', [vm_payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.entityWizard.success = true;
      this.dialogRef.close(true);
      this.entityWizard.snackBar.open(T(globalHelptext.dockerhost + " successfully created"), T("Success"),{ duration: 5000 });
      this.router.navigate(['/vm']);
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
    });

  }

}
