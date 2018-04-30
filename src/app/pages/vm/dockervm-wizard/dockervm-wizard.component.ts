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
        tooltip : T('Enter a descriptive name for the Docker VM.'),
        validation : [ Validators.required ],
        required: true,
      },
      { type: 'checkbox',
        name : 'autostart',
        placeholder : T ('Start on Boot'),
        tooltip : T('Check to start this VM at system boot.'),
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
          tooltip : T('Allocate up to 16 virtual CPUs to the VM. The\
           host CPU or VM operating system can impose limitations on\
           the number of allowed CPUs.'),
          inputType: 'number',
          min: 1,
          validation : [ Validators.required,  Validators.min(1)],
          value: 1,
          required: true,
        },
        {
          type: 'input',
          name: 'memory',
          placeholder: T('Memory Size (MiB)'),
          tooltip: T('Allocate RAM in MiB to the VM.'),
          value: 2048,
          inputType: 'number',
          min: 2048,
          validation : [ Validators.required],
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
          tooltip : T('The default emulates an Intel E1000 (82545)\
           Ethernet card for compatibility with most operating\
           systems. When available, the <i>VirtIO</i> option can\
           provide better performance.'),
          type: 'select',
          options : [],
          validation : [ Validators.required ],
          required: true,
        },
        {
          name : 'NIC_mac',
          placeholder : T('MAC Address'),
          tooltip : T('The VM receives an auto-generated random MAC\
           address. Enter a different address to override this default.'),
          type: 'input',
          value : '00:a0:98:FF:FF:FF',
          validation : [ regexValidator(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i) ],
        },
        {
          name : 'nic_attach',
          placeholder : T('Attach NIC'),
          tooltip : T('Specify the physical interface to associate with\
           the VM.'),
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
          placeholder : T('RAW filename'),
          tooltip: T('Enter a name for a new RAW file. This file is\
           created at the user designated location.'),
          validation : [ Validators.required ],
          required: true
        },
        {
          type: 'input',
          name: 'size',
          placeholder : T('RAW file size'),
          tooltip: T('Allocate a number of GiB to the new RAW file.'),
          value: 10,
          inputType: 'number',
          min: 10,
          validation : [ Validators.required ],
          required: true
        },
        {
          type: 'explorer',
          name: 'raw_file_directory',
          placeholder: T('RAW file location'),
          tooltip: T('Define the path to an existing directory to store\
           the new RAW file.'),
          explorerType: "directory",
          initial: '/mnt',
          validation : [ Validators.required ],
          required: true
        },
        {
          type: 'input',
          name: 'sectorsize',
          placeholder : T('Disk sector size'),
          tooltip: T('Define the disk sector size in bytes. Enter\
           <i>0</i> to leave the sector size unset.'),
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
