import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService, NetworkService } from '../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';
// import { JailService } from '../../../services/';
import { EntityUtils } from '../../common/entity/utils';
import {VmService} from '../../../services/vm.service';
import {regexValidator} from '../../common/entity/entity-form/validators/regex-validation';

@Component({
  selector: 'vm-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers : [ VmService ]
})
export class VMWizardComponent {

  protected addWsCall = 'vm.create';
  public route_success: string[] = ['vm'];

  isLinear = true;
  firstFormGroup: FormGroup;

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
          type: 'select',
          name: 'zvol',
          placeholder : 'please select a zvol',
          tooltip: '',
          options: []
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
          name: 'path',
          placeholder : 'What ISO do you want to boot?',
          initial: '/mnt',
          tooltip: '',
        },
      ]
    },
  ]

  protected releaseField: any;
  protected currentServerVersion: any;
  private zvol: any;
  private nic_attach: any;
  private nicType:  any;

  constructor(protected rest: RestService, protected ws: WebSocketService, 
    public vmService: VmService, public networkService: NetworkService) {

  }

  preInit() {
  }

  afterInit(entityWizard: EntityWizardComponent) {
    
    ( < FormGroup > entityWizard.formArray.get([0]).get('os')).valueChanges.subscribe((res) => {
      if (res === 'windows') {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(2);
        ( < FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue(4096);
      }
      else {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vcpus'].setValue(1);
        ( < FormGroup > entityWizard.formArray.get([1])).controls['memory'].setValue(512);
      }
    });
    this.vmService.getStorageVolumes().subscribe((res) => {
      const data = new EntityUtils().flattenData(res.data);
      this.zvol = _.find(this.wizardConfig[2].fieldConfig, {name:'zvol'});
     
      for (const dataset of data) {
        if (dataset.type === 'zvol') {
          this.zvol.options.push({label : dataset.name, value : '/dev/zvol/' + dataset.path});
        };
      };
    });
    this.networkService.getAllNicChoices().subscribe((res) => {
      this.nic_attach = _.find(this.wizardConfig[3].fieldConfig, {'name' : 'nic_attach'});
      res.forEach((item) => {
        this.nic_attach.options.push({label : item[1], value : item[0]});
      });
    });
    this.ws.call('notifier.choices', [ 'VM_NICTYPES' ])
        .subscribe((res) => {
          this.nicType = _.find(this.wizardConfig[3].fieldConfig, {name : "NIC_type"});
          res.forEach((item) => {
            this.nicType.options.push({label : item[1], value : item[0]});
          });
        });
  }

  beforeSubmit(value) {
    console.log(value);
    // let property: any = [];

    // for (let i in value) {
    //   if (value.hasOwnProperty(i)) {
    //     if (value[i] == undefined) {
    //       delete value[i];
    //     } else {
    //       if (i == 'dhcp' || i == 'vnet') {
    //         if (i == 'dhcp') {
    //           property.push('bpf=yes');
    //         }

    //         if (value[i]) {
    //           property.push(i + '=on');
    //         } else {
    //           property.push(i + '=off');
    //         }
    //         delete value[i];
    //       } else {
    //         if (i != 'uuid' && i != 'release') {
    //           property.push(i + '=' + value[i]);
    //           delete value[i];
    //         }
    //       }
    //     }
    //   }
    // }
    // value['props'] = property;

    // return value;
  }
}
