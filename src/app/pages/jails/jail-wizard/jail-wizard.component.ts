import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from '../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';
import { JailService } from '../../../services/';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'jail-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers: [JailService]
})
export class JailWizardComponent {

  protected addWsCall = 'jail.create';
  public route_success: string[] = ['jails'];

  isLinear = true;
  firstFormGroup: FormGroup;

  protected wizardConfig: Wizard[] = [{
      label: 'Plese fill jail Info',
      fieldConfig: [{
          type: 'input',
          name: 'uuid',
          required: true,
          placeholder: 'Jails Name',
          tooltip: 'Mandatory. Can only contain letters, numbers, dashes,\
 or the underscore character.',
        },
        {
          type: 'select',
          name: 'release',
          required: true,
          placeholder: 'Release',
          tooltip: 'Select the release for the jail.',
          options: [],
        },
      ]
    },
    {
      label: 'Plese config jail network',
      fieldConfig: [{
          type: 'checkbox',
          name: 'dhcp',
          placeholder: 'IPv4 DHCP',
        },
        {
          type: 'input',
          name: 'ip4_addr',
          placeholder: 'IPv4 Address',
          tooltip: 'This and the other IPv4 settings are grayed out if\
 <b>IPv4 DHCP</b> is checked. Enter a unique IP address that is in the\
 local network and not already used by any other computer.',
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'dhcp',
              value: true,
            }]
          }]
        },
        {
          type: 'input',
          name: 'defaultrouter',
          placeholder: 'Default Router For IPv4',
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'dhcp',
              value: true,
            }]
          }]
        },
        {
          type: 'input',
          name: 'ip6_addr',
          placeholder: 'IPv6 Address',
          tooltip: 'This and other IPv6 settings are grayed out if\
 <b>IPv6 Autoconfigure</b> is checked; enter a unique IPv6 address that\
 is in the local network and not already used by any other computer',
        },
        {
          type: 'input',
          name: 'defaultrouter6',
          placeholder: 'Default Router For IPv6',
        },
        {
          type: 'checkbox',
          name: 'vnet',
          placeholder: 'Vnet',
        }
      ]
    },
  ]

  protected releaseField: any;
  protected currentServerVersion: any;

  constructor(protected rest: RestService, protected ws: WebSocketService, protected jailService: JailService, ) {

  }

  preInit() {
    this.releaseField = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'release' });
    this.ws.call('system.info').subscribe((res) => {
        this.currentServerVersion = Number(_.split(res.version, '-')[1]);
        this.jailService.getLocalReleaseChoices().subscribe((res_local) => {
          for (let j in res_local) {
            let rlVersion = Number(_.split(res_local[j], '-')[0]);
            if (this.currentServerVersion >= Math.floor(rlVersion)) {
              this.releaseField.options.push({ label: res_local[j] + '(fetched)', value: res_local[j] });
            }
          }
          this.jailService.getRemoteReleaseChoices().subscribe((res_remote) => {
            for (let i in res_remote) {
              if (_.indexOf(res_local, res_remote[i]) < 0) {
                let rmVersion = Number(_.split(res_remote[i], '-')[0]);
                if (this.currentServerVersion >= Math.floor(rmVersion)) {
                  this.releaseField.options.push({ label: res_remote[i], value: res_remote[i] });
                }
              }
            }
          });
        });
      },
      (res) => {
        new EntityUtils().handleError(this, res);
      });
  }

  afterInit(entityWizard: EntityWizardComponent) {
    ( < FormGroup > entityWizard.formArray.get([1]).get('dhcp')).valueChanges.subscribe((res) => {
      if (res) {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vnet'].setValue(true);
      }
    })
  }

  beforeSubmit(value) {
    let property: any = [];

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (value[i] == undefined) {
          delete value[i];
        } else {
          if (i == 'dhcp' || i == 'vnet') {
            if (i == 'dhcp') {
              property.push('bpf=yes');
            }

            if (value[i]) {
              property.push(i + '=on');
            } else {
              property.push(i + '=off');
            }
            delete value[i];
          } else {
            if (i != 'uuid' && i != 'release') {
              property.push(i + '=' + value[i]);
              delete value[i];
            }
          }
        }
      }
    }
    value['props'] = property;

    return value;
  }
}
