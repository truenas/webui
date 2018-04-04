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

  protected wizardConfig: Wizard[] = [{
      label: 'Docker VM Details',
      fieldConfig: [
      { type: 'input',
        name : 'name',
        placeholder :  T ('Name of the VM'),
        validation : [ Validators.required ],
        required: true,
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : 'Start on Boot',
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
          inputType: 'number',
          min: 1,
          validation : [ Validators.required,  Validators.min(1)],
          value: 1
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: T('Memory Size (MiB)'),
          tooltip: '',
          value: 2048,
          inputType: 'number',
          min: 2048,
          required: true,
        },
      ]
    },
    {
      label: 'Network Interface',
      fieldConfig: [
        {
          name : 'NIC_type',
          placeholder : T('Adapter Type'),
          tooltip : T('The default emulates an Intel E1000 (82545) Ethernet\
     card for compatibility with most operating systems. If the operating\
     system installed in the VM supports VirtIO paravirtualized network\
     drivers, this can be changed to <i>VirtIO</i> to provide better\
     performace.'),
          type: 'select',
          options : [],
          validation : [ Validators.required ]
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
          placeholder : T('filename'),
          tooltip: T('Provide a filename, this file will be created at user specific location'),
          validation : [ Validators.required ],
          required: true
        },
        {
          type: 'input',
          name: 'size',
          placeholder : T('Define the size (in GiB) for the raw file.'),
          tooltip: T('Type a number of GiB to allocate to the new RAW file.'),
          value: 10,
          inputType: 'number',
          min: 10,
          validation : [ Validators.required ],
          required: true
        },
        {
          type: 'explorer',
          name: 'raw_file_directory',
          placeholder: T('Select a directory'),
          tooltip: T('please select a path for existing directory'),
          explorerType: "directory",
          initial: '/mnt',
          validation : [ Validators.required ],
          required: true
        },
        {
          type: 'input',
          name: 'sectorsize',
          placeholder : T('sectorsize'),
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

      this.ws.call('vm.random_mac').subscribe((mac_res)=>{
        ( < FormGroup > entityWizard.formArray.get([2])).controls['NIC_mac'].setValue(mac_res);
      });
      
    ( < FormGroup > entityWizard.formArray.get([0]).get('name')).valueChanges.subscribe((name) => {
      this.summary[T('Name')] = name;
      this.summary[T('Number of CPU')] = ( < FormGroup > entityWizard.formArray.get([1])).get('vcpus').value;

      ( < FormGroup > entityWizard.formArray.get([1])).get('vcpus').valueChanges.subscribe((vcpus) => {
        this.summary[T('Number of CPU')] = vcpus;
      });
      this.summary[T('Memory')] = ( < FormGroup > entityWizard.formArray.get([1])).get('memory').value + ' Mib';
      ( < FormGroup > entityWizard.formArray.get([1])).get('memory').valueChanges.subscribe((memory) => {
        this.summary[T('Memory')] = memory + ' Mib';
      });
      ( < FormGroup > entityWizard.formArray.get([3])).get('raw_filename').valueChanges.subscribe((raw_filename) => {
        ( < FormGroup > entityWizard.formArray.get([3])).get('raw_file_directory').valueChanges.subscribe((raw_file_directory)=>{
          this.summary[T('RAW file location')] = raw_file_directory + "/" +raw_filename+"_"+name;
        })
      });
      ( < FormGroup > entityWizard.formArray.get([3])).get('raw_file_directory').valueChanges.subscribe((raw_file_directory) => {
        ( < FormGroup > entityWizard.formArray.get([3])).get('raw_filename').valueChanges.subscribe((raw_filename)=>{
          this.summary[T('RAW file location')] = raw_file_directory + "/" +raw_filename+"_"+name;
        })
      });
      this.summary[T('RAW file size')] = ( < FormGroup > entityWizard.formArray.get([3])).get('size').value + ' Gib';
    });
  }
  getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

async customSubmit(value) {
  const path = value.raw_file_directory+ '/' + value.raw_filename+ '_'+ value.name;
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
