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
  protected custActions: Array<any> = [
  {
    id: 'advanced_add',
    name: "Advanced Jail Creation",
    function: () => {
      this.router.navigate(
        new Array('').concat(["jails", "add"])
      );
    }
  }];

  protected wizardConfig: Wizard[] = [{
      label: T('Name the jail and choose a FreeBSD release'),
      fieldConfig: [{
          type: 'input',
          name: 'uuid',
          required: true,
          placeholder: T('Jail Name'),
          tooltip: T('A Jail Name can only contain alphanumeric \
                      characters (Aa-Zz 0-9), dashes (-), or \
                      underscores (_).'),
          validation: [ regexValidator(/^[a-zA-Z0-9-_]+$/) ],
        },
        {
          type: 'select',
          name: 'release',
          required: true,
          placeholder: T('Release'),
          tooltip: T('Select the FreeBSD release to use as the jail \
                      operating system. <br>\
                      Releases already downloaded display <b>(fetched)</b>'),
          options: [],
        },
      ]
    },
    {
      label: T('Configure Networking'),
      fieldConfig: [{
          type: 'checkbox',
          name: 'dhcp',
          placeholder: T('DHCP Autoconfigure IPv4'),
          tooltip: T('Automatically configure the jail to use IPv4 \
                      networking.\
                      <br><b>VirtIO</b> must also be enabled.'),
      },
        {
          type: 'checkbox',
          name: 'vnet',
          placeholder: T('VirtIO Virtual Networking'),
          tooltip: T('Use VirtIO to emulate network devices for the \
                      jail. <br> \
                      See <a \
href="https://www.freebsd.org/cgi/man.cgi?query=virtio&manpath=FreeBSD+11.1-RELEASE+and+Ports\
"target="_blank">VIRTIO(4)</a> for more details.'),
          required: false,
          hasErrors: false,
          errors: '',
        },
        {
          type: 'input',
          name: 'ip4_addr',
          placeholder: T('IPv4 Address'),
          tooltip: T('IPv4 address for the jail.'),
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
          tooltip: T('A valid IPv4 address to use as the default route. \
                      <br>Enter <b>none</b> to configure the jail with \
                      no IPv4 default route. <br>\
                      <b>A jail without a default route will not be \
                      able to access a network or the outside world.</b>'),
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
          tooltip: T('IPv6 address for the jail.'),
          validation : [ regexValidator(/^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}$/i) ],
        },
        {
          type: 'input',
          name: 'defaultrouter6',
          placeholder: T('Default Router For IPv6'),
      tooltip: T('A valid IPv6 address to use as the default route. \
                  <br>Enter <b>none</b> to configure the jail with no \
                  IPv6 default route. <br>\
                  <b>A jail without a default route will not be able \
                  to access a network or the outside world.</b>'),
        },
      ]
    },
  ]

  protected releaseField: any;
  protected currentServerVersion: any;

  constructor(protected rest: RestService,
              protected ws: WebSocketService,
              protected jailService: JailService,
              protected router: Router) {

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
      if (res == undefined || res == '') {
        delete this.summary[T('IPv4 Address')];
      } else {
        this.summary[T('IPv4 Address')] = res;
      }
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('defaultrouter')).valueChanges.subscribe((res) => {
      if (res == undefined || res == '') {
        delete this.summary[T('Default Router For IPv4')];
      } else {
        this.summary[T('Default Router For IPv4')] = res;
      }
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip6_addr').valueChanges.subscribe((res) => {
      if (res == undefined || res == '') {
        delete this.summary[T('IPv6 Address')];
      } else {
        this.summary[T('IPv6 Address')] = res;
      }
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('defaultrouter6')).valueChanges.subscribe((res) => {
      if (res == undefined || res == '') {
        delete this.summary[T('Default Router For IPv6')];
      } else {
        this.summary[T('Default Router For IPv6')] = res;
      }
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('dhcp')).valueChanges.subscribe((res) => {
      if (res) {
        this.summary[T('DHCP Autoconfigure IPv4')] = 'Yes';
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vnet'].setValue(true);
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).required = true;
      } else {
        this.summary[T('DHCP Autoconfigure IPv4')] = 'No';
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).required = false;
      }
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('vnet')).valueChanges.subscribe((res) => {
      if (res) {
        this.summary[T('VirtIO Virtual Networking')] = 'Yes';
      } else {
        this.summary[T('VirtIO Virtual Networking')] = 'No';
      }

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

  isCustActionVisible(id, stepperIndex) {
    if (stepperIndex == 0) {
      return true;
    }
    return false;
  }

}
