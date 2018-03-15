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
  summary_title = "VM Summary";

  protected wizardConfig: Wizard[] = [{
      label: 'Docker VM Details',
      fieldConfig: [
      { type: 'input',
        name : 'name',
        placeholder : 'Name of the VM',
        validation : [ Validators.required ]
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : 'Start on Boot',
        value: true
      },
      ]
    },
    {
      label: 'CPU and Memory configuration.',
      fieldConfig: [{
          type: 'input',
          name: 'vcpus',
          placeholder: 'Virtual CPUs',
          value: 1,
          inputType: 'number',
          min: 1
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: 'Memory Size (MiB)',
          tooltip: '',
          value: 2048,
          inputType: 'number',
          min: 2048
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
      label: 'Storage Files',
      fieldConfig: [
        {
          type: 'input',
          name: 'raw_filename',
          placeholder : 'filename',
          tooltip: 'Provide a filename, this file will be created at user specific location ',
          validation : [ Validators.required ]
        },
        {
          type: 'input',
          name: 'size',
          placeholder : 'Define the size (in GiB) for the raw file.',
          tooltip: 'Type a number of GiB to allocate to the new RAW file.',
          value: 10,
          inputType: 'number',
          min: 10,
          validation : [ Validators.required ]
        },
        {
          type: 'explorer',
          name: 'raw_file_directory',
          placeholder: 'Select a directory',
          tooltip: 'please select a path for existing directory',
          explorerType: "directory",
          initial: '/mnt',
          validation : [ Validators.required ]
        },
        {
          type: 'input',
          name: 'sectorsize',
          placeholder : 'sectorsize',
          tooltip: '.',
          value: 0,
          inputType: 'number',
          min: 0
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
    private router: Router) {

  }


  afterInit(entityWizard: EntityWizardComponent) {

    this.networkService.getAllNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.wizardConfig[2].fieldConfig, {'name' : 'nic_attach'});
      res.forEach((item) => {
        this.nic_attach.options.push({label : item[1], value : item[0]});
      });
      ( < FormGroup > entityWizard.formArray.get([2])).controls['nic_attach'].setValue(
        this.nic_attach.options[0].value
      )

    });
    this.ws.call('notifier.choices', [ 'VM_NICTYPES' ]).subscribe((res) => {
          this.nicType = _.find(this.wizardConfig[2].fieldConfig, {name : "NIC_type"});
          res.forEach((item) => {
            this.nicType.options.push({label : item[1], value : item[0]});
          });
        ( < FormGroup > entityWizard.formArray.get([2])).controls['NIC_type'].setValue(
          this.nicType.options[0].value
        )
        });
  
  }
  getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

async customSubmit(value) {
  const path = value.raw_file_directory+ '/' + value.raw_filename+ '_'+ value.name;
  console.log(path);
    const payload = {}
    const vm_payload = {}
    vm_payload["vm_type"]= "Container Provider";
    vm_payload["memory"]= String(value.memory);
    vm_payload["name"] = value.name;
    vm_payload["vcpus"] = String(value.vcpus);
    vm_payload["bootloader"] = 'GRUB';
    vm_payload["devices"] = [
      {"dtype": "NIC", "attributes": {"type": value.NIC_type, "mac": value.NIC_mac, "nic_attach":value.nic_attach}},
      {"dtype": "RAW", "attributes": {"path": path, "type": "AHCI", "rootpwd":"docker", "boot": true, "size": value.size, sectorsize: 0}},
    ]
    this.loader.open();
    this.ws.call('vm.get_sharefs').subscribe((get_sharefs)=>{
      if(!get_sharefs){
        this.ws.call('vm.activate_sharefs').subscribe((sharefs)=>{
          this.ws.call('vm.create', [vm_payload]).subscribe(vm_res => {
            this.loader.close();
            this.router.navigate(['/vm']);
          },(error) => {
            this.loader.close();
          });
        })

      }
      else {
        this.ws.call('vm.create', [vm_payload]).subscribe(vm_res => {
          this.loader.close();
          this.router.navigate(['/vm']);
        },(error) => {
          this.loader.close();
        });
      }
    },
    (error_res) => { 
      new EntityUtils().handleError(this, error_res);
      this.loader.close();
    })
  }

}
