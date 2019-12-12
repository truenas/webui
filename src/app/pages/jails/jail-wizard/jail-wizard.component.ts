import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from '../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import { MatDialog, MatDialogRef } from '@angular/material';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import * as _ from 'lodash';
import { JailService, NetworkService, DialogService } from '../../../services/';
import { EntityUtils } from '../../common/entity/utils';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
import { forbiddenValues } from '../../common/entity/entity-form/validators/forbidden-values-validation';
import { T } from '../../../translate-marker'
import helptext from '../../../helptext/jails/jail-configuration';

@Component({
  selector: 'jail-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers: [JailService, NetworkService]
})
export class JailWizardComponent {

  protected addWsCall = 'jail.create';
  public route_success: string[] = ['jails'];
  public summary = {};
  summary_title = "Jail Summary";
  objectKeys = Object.keys;
  entityWizard: any;
  protected namesInUse = [];

  isLinear = true;
  firstFormGroup: FormGroup;
  protected custActions: Array<any> = [
  {
    id: 'advanced_add',
    name: "Advanced Jail Creation",
    function: () => {
      this.router.navigate(
        new Array('').concat(["jails", "add", "advanced"])
      );
    }
  }];

  protected interfaces = {
    vnetEnabled: [
      {
        label: '------',
        value: '',
      }
    ],
    vnetDisabled: [
      {
        label: '------',
        value: '',
      }
    ],
  }

  protected wizardConfig: Wizard[] = [{
      label: helptext.wizard_step1_label,
      fieldConfig: [{
          type: 'input',
          name: 'uuid',
          required: true,
          placeholder: helptext.uuid_placeholder,
          tooltip: helptext.uuid_tooltip,
          validation: [regexValidator(this.jailService.jailNameRegex), forbiddenValues(this.namesInUse)],
        },
        {
          type: 'select',
          name: 'jailtype',
          placeholder: helptext.jailtype_placeholder,
          tooltip: helptext.jailtype_tooltip,
          options: [
            {
              label: 'Default (Clone Jail)',
              value: 'default',
            },
            {
              label: 'Basejail',
              value: 'basejail',
            }
          ],
          value: 'default',
        },
        {
          type: 'select',
          name: 'release',
          required: true,
          placeholder: helptext.release_placeholder,
          tooltip: helptext.release_tooltip,
          options: [],
        },
        {
          type: 'radio',
          name: 'https',
          placeholder: helptext.https_placeholder,
          options: [
            {label:'HTTPS', value: true, tooltip: helptext.https_tooltip,},
            {label:'HTTP', value: false, tooltip: helptext.http_tooltip,},
          ],
          value: true,
          isHidden: true,
        },
      ]
    },
    {
      label: helptext.wizard_step2_label,
      fieldConfig: [{
          type: 'checkbox',
          name: 'dhcp',
          placeholder: helptext.dhcp_placeholder,
          tooltip: helptext.dhcp_tooltip,
          value: false,
          relation: [{
            action: "DISABLE",
            when: [{
              name: "nat",
              value: true
            }]
          }],
        },
        {
          type: 'checkbox',
          name: 'nat',
          placeholder: helptext.nat_placeholder,
          tooltip: helptext.nat_tooltip,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'vnet',
          placeholder: helptext.vnet_placeholder,
	        tooltip: helptext.vnet_tooltip,
          required: false,
          hasErrors: false,
          errors: '',
          value: false,
        },
        {
          type: 'select',
          name: 'ip4_interface',
          placeholder: helptext.ip4_interface_placeholder,
          tooltip: helptext.ip4_interface_tooltip,
          options: this.interfaces.vnetDisabled,
          relation: [{
            action: "ENABLE",
            connective: 'AND',
            when: [{
              name: "dhcp",
              value: false
            }, {
              name: 'nat',
              value: false,
            }]
          }],
          required: false,
          class: 'inline',
          width: '30%',
          value: '',
        },
        {
          type: 'input',
          name: 'ip4_addr',
          placeholder: helptext.ip4_addr_placeholder,
          tooltip: helptext.ip4_addr_tooltip,
          validation : [ regexValidator(this.networkService.ipv4_regex) ],
          relation: [{
            action: "ENABLE",
            connective: 'AND',
            when: [{
              name: "dhcp",
              value: false
            }, {
              name: 'nat',
              value: false,
            }]
          }],
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'ip4_netmask',
          placeholder: helptext.ip4_netmask_placeholder,
          tooltip: helptext.ip4_netmask_tooltip,
          options: this.networkService.getV4Netmasks(),
          value: '',
          relation: [{
            action: "ENABLE",
            connective: 'AND',
            when: [{
              name: "dhcp",
              value: false
            }, {
              name: 'nat',
              value: false,
            }]
          }],
          class: 'inline',
          width: '20%',
        },
        {
          type: 'input',
          name: 'defaultrouter',
          placeholder: helptext.defaultrouter_placeholder,
          tooltip: helptext.defaultrouter_tooltip,
          relation: [{
            action: 'DISABLE',
            connective: 'OR',
            when: [{
              name: 'dhcp',
              value: true,
            }, {
              name: 'nat',
              value: true,
            }, {
              name: 'vnet',
              value: false,
            }]
          }]
        },
        {
          type: 'checkbox',
          name: 'auto_configure_ip6',
          placeholder: helptext.auto_configure_ip6_placeholder,
          tooltip: helptext.auto_configure_ip6_tooltip,
        },
        {
          type: 'select',
          name: 'ip6_interface',
          placeholder: helptext.ip6_interface_placeholder,
          tooltip: helptext.ip6_interface_tooltip,
          options: this.interfaces.vnetDisabled,
          class: 'inline',
          width: '30%',
          value: '',
          required: false,
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'auto_configure_ip6',
              value: true,
            }]
          }]
        },
        {
          type: 'input',
          name: 'ip6_addr',
          placeholder: helptext.ip6_addr_placeholder,
          tooltip: helptext.ip6_addr_tooltip,
          validation : [ regexValidator(this.networkService.ipv6_regex) ],
          class: 'inline',
          width: '50%',
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'auto_configure_ip6',
              value: true,
            }]
          }]
        },
        {
          type: 'select',
          name: 'ip6_prefix',
          placeholder: helptext.ip6_prefix_placeholder,
          tooltip: helptext.ip6_prefix_tooltip,
          options: this.networkService.getV6PrefixLength(),
          class: 'inline',
          width: '20%',
          value: '',
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'auto_configure_ip6',
              value: true,
            }]
          }]
        },
        {
          type: 'input',
          name: 'defaultrouter6',
          placeholder: helptext.defaultrouter6_placeholder,
          tooltip: helptext.defaultrouter6_tooltip,
        },
      ]
    },
  ]

  protected releaseField: any;
  protected ip4_interfaceField: any;
  protected ip4_netmaskField: any;
  protected ip6_interfaceField: any;
  protected ip6_prefixField: any;
  protected dialogRef: any;

  public ipv4: any;
  public ipv6: any;
  protected template_list: string[];
  protected unfetchedRelease = [];
  protected showSpinner = true;

  constructor(protected rest: RestService,
              protected ws: WebSocketService,
              protected jailService: JailService,
              protected router: Router,
              protected networkService: NetworkService,
              protected dialog: MatDialog,
              protected dialogService: DialogService) {

  }

  preInit() {
    this.releaseField = _.find(this.wizardConfig[0].fieldConfig, { 'name': 'release' });
    this.template_list = new Array<string>();
    this.jailService.getTemplates().subscribe(
      (templates) => {
        for (const template of templates) {
          this.template_list.push(template.host_hostuuid);
          this.releaseField.options.push({ label: template.host_hostuuid + ' (template)', value: template.host_hostuuid });
        }
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      }
    )
    this.jailService.getReleaseChoices().subscribe(
      (releases) => {
        for (const item in releases) {
          this.releaseField.options.push({ label: item, value: releases[item] });
        }
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      }
    );

    this.ip4_interfaceField = _.find(this.wizardConfig[1].fieldConfig, {'name': 'ip4_interface'});
    this.ip4_netmaskField = _.find(this.wizardConfig[1].fieldConfig, {'name': 'ip4_netmask'});
    this.ip6_interfaceField = _.find(this.wizardConfig[1].fieldConfig, {'name': 'ip6_interface'});
    this.ip6_prefixField = _.find(this.wizardConfig[1].fieldConfig, {'name': 'ip6_prefix'});

    this.jailService.getInterfaceChoice().subscribe(
      (res)=>{
        for (const i in res) {
          this.interfaces.vnetDisabled.push({ label: res[i], value: res[i]});
        }
      },
      (res)=>{
        new EntityUtils().handleError(this, res);
      }
    );

    this.jailService.getDefaultConfiguration().subscribe(
      (res) => {
        const ventInterfaces = res['interfaces'].split(',');
        for (const item of ventInterfaces) {
          this.interfaces.vnetEnabled.push({ label: item, value: item});
        }
      },
      (err) => {
        new EntityUtils().handleError(this, err);
      }
    );
  }

  updateIpAddress(entityWizard, type) {
    if (type == 'ipv4') {
      let ip4_interface_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip4_interface'];
      let ip4_address_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip4_addr'];
      let ip4_netmask_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip4_netmask'];
      if (ip4_address_control.value == undefined || ip4_address_control.value == '') {
        delete this.summary[T('IPv4 Address')];
      } else {
        let full_address = ip4_address_control.value;
        if (ip4_interface_control.value != '') {
          const validInterface = _.find(this.ip4_interfaceField.options, {value: ip4_interface_control.value}) !== undefined;
          full_address = validInterface ? ip4_interface_control.value + '|' + ip4_address_control.value : ip4_address_control.value;
        }
        if (ip4_netmask_control.value != '') {
          full_address += '/' + ip4_netmask_control.value;
        }

        this.summary[T('IPv4 Address')] = full_address;
      }
      this.ipv4 = this.summary[T('IPv4 Address')];
    } else {
      if ((< FormGroup > entityWizard.formArray.get([1])).controls['auto_configure_ip6'].value) {
        this.summary[T('IPv6 Address')] = T("Auto configure IPv6");
        this.ipv6 = "vnet0|accept_rtadv";
      } else {
        let ip6_interface_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip6_interface'];
        let ip6_address_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip6_addr'];
        let ip6_prefix_control = (< FormGroup > entityWizard.formArray.get([1])).controls['ip6_prefix'];
        if (ip6_address_control.value == undefined || ip6_address_control.value == '') {
          delete this.summary[T('IPv6 Address')];
        } else {
          let full_address = ip6_address_control.value;
          if (ip6_interface_control.value != '') {
            full_address = ip6_interface_control.value + '|' + ip6_address_control.value;
          }
          if (ip6_prefix_control.value != '') {
            full_address += '/' + ip6_prefix_control.value;
          }

          this.summary[T('IPv6 Address')] = full_address;
        }
        this.ipv6 = this.summary[T('IPv6 Address')];
      }
    }
  }

  async afterInit(entityWizard: EntityWizardComponent) {
    this.entityWizard = entityWizard;
    await this.jailService.listJails().toPromise().then((res) => {
      res.forEach(i => this.namesInUse.push(i.id));
      this.entityWizard.showSpinner = false;
    })

    const httpsField =  _.find(this.wizardConfig[0].fieldConfig, {'name': 'https'});

    ( < FormGroup > entityWizard.formArray.get([0]).get('uuid')).valueChanges.subscribe((res) => {
      this.summary[T('Jail Name')] = res;
    });
    ( < FormGroup > entityWizard.formArray.get([0])).get('release').valueChanges.subscribe((res) => {
      this.summary[T('Release')] = res;

      httpsField.isHidden = _.indexOf(this.unfetchedRelease, res) > -1 ? false : true;
    });
    // update ipv4
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip4_interface').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv4');
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip4_netmask').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv4');
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip4_addr').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv4');
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('defaultrouter')).valueChanges.subscribe((res) => {
      if (res == undefined || res == '') {
        delete this.summary[T('Default Router For IPv4')];
      } else {
        this.summary[T('Default Router For IPv4')] = res;
      }
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('auto_configure_ip6')).valueChanges.subscribe((res) => {
      let vnet_ctrl = ( < FormGroup > entityWizard.formArray.get([1])).controls['vnet'];
      if (res) {
        vnet_ctrl.setValue(true);
      } else {
        vnet_ctrl.setValue(vnet_ctrl.value);
      }
      _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).required = res;
    });

    // update ipv6
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip6_interface').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv6');
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip6_prefix').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv6');
    });
    ( < FormGroup > entityWizard.formArray.get([1])).get('ip6_addr').valueChanges.subscribe((res) => {
      this.updateIpAddress(entityWizard, 'ipv6');
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('defaultrouter6')).valueChanges.subscribe((res) => {
      if (res == undefined || res == '') {
        delete this.summary[T('Default Router For IPv6')];
      } else {
        this.summary[T('Default Router For IPv6')] = res;
      }
    });

    ( < FormGroup > entityWizard.formArray.get([1]).get('dhcp')).valueChanges.subscribe((res) => {
      this.summary[T('DHCP Autoconfigure IPv4')] = res ? T('Yes') : T('No');

      if (res) {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vnet'].setValue(true);
        if (!( < FormGroup > entityWizard.formArray.get([1])).controls['nat'].disabled) {
          entityWizard.setDisabled('nat', true, 1);
        }
      } else {
        if (( < FormGroup > entityWizard.formArray.get([1])).controls['nat'].disabled) {
          entityWizard.setDisabled('nat', false, 1);
        }
      }
      _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).required = res;
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('nat')).valueChanges.subscribe((res) => {
      this.summary[T('NAT Autoconfigure IPv4')] = res ? T('Yes') : T('No');
      if ((< FormGroup > entityWizard.formArray.get([1]).get('dhcp')).disabled) {
        delete this.summary[T('DHCP Autoconfigure IPv4')];
      }
      if (res) {
        ( < FormGroup > entityWizard.formArray.get([1])).controls['vnet'].setValue(true);
      }
      _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' }).required = res;
    });
    ( < FormGroup > entityWizard.formArray.get([1]).get('vnet')).valueChanges.subscribe((res) => {
      this.summary[T('VNET Virtual Networking')] = res ? T('Yes') : T('No');
      this.ip4_interfaceField.options = res ? this.interfaces.vnetEnabled : this.interfaces.vnetDisabled;
      this.ip4_interfaceField.options = res ? this.interfaces.vnetEnabled : this.interfaces.vnetDisabled;

      if (((( < FormGroup > entityWizard.formArray.get([1])).controls['dhcp'].value ||
           ( < FormGroup > entityWizard.formArray.get([1])).controls['nat'].value) ||
           ( < FormGroup > entityWizard.formArray.get([1])).controls['auto_configure_ip6'].value) && !res) {
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' })['hasErrors'] = true;
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' })['errors'] = 'VNET is required.';
      } else {
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' })['hasErrors'] = false;
        _.find(this.wizardConfig[1].fieldConfig, { 'name': 'vnet' })['errors'] = '';
      }

      this.updateIpAddress(entityWizard, 'ipv4');
      this.updateIpAddress(entityWizard, 'ipv6');
    });
  }

  beforeSubmit(value) {
    let property: any = [];

    if (value['jailtype'] === 'basejail') {
      value['basejail'] = true;
    }
    delete value['jailtype'];

    delete value['ip4_interface'];
    delete value['ip4_netmask'];
    value['ip4_addr'] = this.ipv4;
    delete value['ip6_interface'];
    delete value['ip6_prefix'];
    value['ip6_addr'] = this.ipv6;

    delete value['auto_configure_ip6'];

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
            if (i != 'uuid' && i != 'release' && i != 'basejail' && i != 'https') {
              property.push(i + '=' + value[i]);
              delete value[i];
            }
          }
        }
      }
    }
    value['props'] = property;

    if (_.indexOf(this.template_list, value['release']) > -1) {
      value['template'] = value['release'];
    }

    return value;
  }

  customSubmit(value) {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Creating Jail") }, disableClose: true});
    this.dialogRef.componentInstance.setDescription(T("Creating Jail..."));
    this.dialogRef.componentInstance.setCall(this.addWsCall, [value]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialogRef.close(true);
      this.router.navigate(new Array('/').concat(this.route_success));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogRef.close();
      new EntityUtils().handleWSError(this, res, this.dialogService);
    });
  }

  isCustActionVisible(id, stepperIndex) {
    if (stepperIndex == 0) {
      return true;
    }
    return false;
  }

}
