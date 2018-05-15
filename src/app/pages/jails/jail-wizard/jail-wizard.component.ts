import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from '../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';
import { JailService } from '../../../services/';
import { EntityUtils } from '../../common/entity/utils';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
import { T } from '../../../translate-marker'

@Component({
  selector: 'jail-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers: [JailService]
})
export class JailWizardComponent {

  protected addWsCall = 'jail.create';
  public route_success: string[] = ['jails'];
  public summary = {};
  summary_title = "Jail Summary";
  objectKeys = Object.keys;

  isLinear = true;
  firstFormGroup: FormGroup;

  protected wizardConfig: Wizard[] = [{
      label: T('Name the jail and choose a FreeBSD release.'),
      fieldConfig: [{
          type: 'input',
          name: 'uuid',
          required: true,
          placeholder: T('Jail Name'),
          tooltip: T('Mandatory. Can only contain alphanumeric characters,\
 dashes (-), or underscores (_).'),
          validation: [ regexValidator(/^[a-zA-Z0-9-_]+$/) ],
      },
                    {
          type: 'select',
          name: 'release',
          required: true,
          placeholder: T('Release'),
          tooltip: T('Select the FreeBSD release to use as the jail\
 operating system.'),
          options: [],
        },
      ]
    },
    {
      label: T('Configure jail networking'),
      fieldConfig: [{
          type: 'checkbox',
          name: 'dhcp',
          placeholder: T('DHCP autoconfigure IPv4'),
          tooltip: T('Check this to automatically configure IPv4 settings\
 for the jail. <b>VirtIO</b> must also be enabled.'),
        },
        {
          type: 'checkbox',
          name: 'vnet',
          placeholder: T('VirtIO Virtual Networking'),
          tooltip: T('Check to use VirtIO to emulate network devices for\
 this jail. See <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=virtio&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">VIRTIO(4)</a> for more details.'),
          required: false,
          hasErrors: false,
          errors: '',
        },
        {
          type: 'input',
          name: 'ip4_addr',
          placeholder: T('IPv4 Address'),
          tooltip: T('Type the IPv4 address for VNET and shared IP jails.\
 Single interface format: <b>interface|ip-address/netmask</b>. Multiple\
 interface format:\
 <b>interface|ip-address/netmask,interface|ip-address/netmask</b>.\
 Example: <b>vnet0|192.168.0.10/24</b>'),
          validation : [ regexValidator(/^(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(.(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})){3}$/) ],
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
          placeholder: T('Default Router For IPv4'),
          tooltip: T('Type <i>none</i> or a valid IP address. Setting\
 this property to anything other than <i>none</i> configures a default\
 route inside a <b>VNET</b> jail.'),
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
          placeholder: T('IPv6 Address'),
          tooltip: T('Type the IPv6 address for VNET and shared IP jails.\
 Single interface format: <i>interface|ip-address/netmask</i>. Multiple\
 interface format:\
 <i>interface|ip-address/netmask,interface|ip-address/netmask</i>.\
 Example: <b>re0|2001:0db8:85a3:0000:0000:8a2e:0370:7334/24</b>'),
          validation : [ regexValidator(/^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}$/i) ],
        },
        {
          type: 'input',
          name: 'defaultrouter6',
          placeholder: T('Default Router For IPv6'),
      tooltip: T('Type <i>none</i> or a valid IP address. Setting this\
 property to anything other than <i>none</i> configures a default route\
 inside a <b>VNET</b> jail.'),
        },
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
    ( < FormGroup > entityWizard.formArray.get([0]).get('uuid')).valueChanges.subscribe((res) => {
      this.summary[T('Jail Name')] = res;
    });
    ( < FormGroup > entityWizard.formArray.get([0])).get('release').valueChanges.subscribe((res) => {
      this.summary[T('Release')] = res;
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip4_addr').valueChanges.subscribe((res) => {
      this.summary[T('IPv4 Address')] = res;
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('defaultrouter')).valueChanges.subscribe((res) => {
      this.summary[T('Default Router For IPv4')] = res;
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip6_addr').valueChanges.subscribe((res) => {
      this.summary[T('IPv6 Address')] = res;
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('defaultrouter6')).valueChanges.subscribe((res) => {
      this.summary[T('Default Router For IPv6')] = res;
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('dhcp')).valueChanges.subscribe((res) => {
      this.summary[T('DHCP autoconfigure IPv4')] = res;

      if (res) {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vnet'].setValue(true);
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).required = true;
      } else {
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).required = false;
      }
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('vnet')).valueChanges.subscribe((res) => {
      this.summary[T('VirtIO Virtual Networking')] = res;

      if (( < FormGroup > entityWizard.formArray.get([1])).controls['dhcp'].value && !res) {
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).hasErrors = true;
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).errors = 'Vnet is required';
      } else {
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).hasErrors = false;
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).errors = '';
      }
    });
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
