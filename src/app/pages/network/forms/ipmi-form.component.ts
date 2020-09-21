import { Component } from '@angular/core';

import * as _ from 'lodash';
import { DialogService, WebSocketService } from '../../../services';
import { ipv4Validator } from '../../common/entity/entity-form/validators/ip-validation';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../helptext/network/ipmi/ipmi';
import globalHelptext from '../../../helptext/global-helptext';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../common/entity/utils';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-ipmi',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class IPMIFromComponent {
  public title = "IMPI"
  protected queryCall = "ipmi.query";

  protected entityEdit: any;
  public is_ha = false;
  public controllerName = globalHelptext.Ctrlr;
  public currentControllerLabel: string;
  public failoverControllerLabel: string;
  public managementIP: string;
  public options: Array<any> = [
    { label: 'Indefinitely', value: 'force' },
    { label: '15 seconds', value: 15 },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
    { label: '2 minute', value: 120 },
    { label: '3 minute', value: 180 },
    { label: '4 minute', value: 240 },
    { label: 'Turn OFF', value: 0 }
  ]
  public custActions: Array<any> = [
    {
      'id': 'ipmi_identify',
      'name': T('Identify Light'),
      function: () => {
        this.dialog.select(
          'IPMI Identify', this.options, 'IPMI flash duration', 'ipmi.identify', 'seconds', "IPMI identify command issued");
      }
    },
    {
      'id': 'connect',
      'name': T('Manage'),
      function: () => {
        window.open(`http://${this.managementIP}`);
      }
    }
  ];
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext.ipmi_configuration,
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'dhcp',
          placeholder: helptext.dhcp_placeholder,
          tooltip: helptext.dhcp_tooltip,
        },
        {
          type: 'input',
          name: 'ipaddress',
          placeholder: helptext.ipaddress_placeholder,
          tooltip: helptext.ipaddress_tooltip,
          validation: [ipv4Validator('ipaddress')],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: 'DISABLE',
              when: [{
                name: 'dhcp',
                value: true,
              }]
            },
          ]
        },
        {
          type: 'input',
          name: 'netmask',
          placeholder: helptext.netmask_placeholder,
          tooltip: helptext.netmask_tooltip,
          validation: [ipv4Validator('netmask')],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: 'DISABLE',
              when: [{
                name: 'dhcp',
                value: true,
              }]
            },
          ]
        },
        {
          type: 'input',
          name: 'gateway',
          placeholder: helptext.gateway_placeholder,
          tooltip: helptext.gateway_tooltip,
          validation: [ipv4Validator('gateway')],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: 'DISABLE',
              when: [{
                name: 'dhcp',
                value: true,
              }]
            },
          ]
        },
        {
          type: 'input',
          name: 'vlan',
          placeholder: helptext.vlan_placeholder,
          tooltip: helptext.vlan_tooltip,
          inputType: 'number',
        },
      ]
    },
    {
      name: helptext.ipmi_password_reset,
      label: true,
      config: [
        {
          type: 'input',
          inputType: 'password',
          name: 'password',
          placeholder: helptext.password_placeholder,
          validation: helptext.password_validation,
          hasErrors: false,
          errors: helptext.password_errors,
          togglePw: true,
          tooltip: helptext.password_tooltip,
        },
      ]
    },
    {
      name: 'divider',
      divider: true
    }];

  public queryKey = 'id';
  public channelValue;
  protected isEntity = true;

  constructor(
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService
  ) { }

  async prerequisite(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (window.localStorage.getItem('product_type').includes('ENTERPRISE')) {
        await this.ws.call('failover.licensed').toPromise().then((is_ha) => {
          this.is_ha = is_ha;
        });
        if (this.is_ha) {
          await this.ws.call('failover.node').toPromise().then((node) => {
            this.currentControllerLabel = (node === 'A') ? '1' : '2';
            this.failoverControllerLabel = (node === 'A') ? '2' : '1';
          });
          this.fieldSets.unshift({
            name: helptext.ipmi_remote_controller,
            class: 'remote-controller',
            width: "100%",
            label: true,
            config: [
              {
                type: 'radio',
                name: 'remoteController',
                placeholder: '',
                options: [
                  {
                    label: `Active: ${this.controllerName} ${this.currentControllerLabel}`,
                    value: false,
                  },
                  {
                    label: `Standby: ${this.controllerName} ${this.failoverControllerLabel}`,
                    value: true,
                  }
                ],
                value: false,
              }
            ]
          }, {
            name: 'ipmi_divider',
            divider: true
          });
          resolve(true);
        } else {
          resolve(true);
        };
      } else {
        resolve(true);
      };
    })

  }

  afterInit(entityEdit: any) {
    this.channelValue = entityEdit.pk;
    this.entityEdit = entityEdit;

    entityEdit.formGroup.controls['password'].statusChanges.subscribe((status) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: "password" }));
    })

    entityEdit.formGroup.controls['ipaddress'].statusChanges.subscribe((status) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: "ipaddress" }));
      const ipValue = entityEdit.formGroup.controls['ipaddress'].value;
      const btn = <HTMLInputElement>document.getElementById('cust_button_Manage');
      status === 'INVALID' || ipValue === '0.0.0.0' ? btn.disabled = true : btn.disabled = false;
    })

    entityEdit.formGroup.controls['ipaddress'].valueChanges.subscribe((value) => {
      this.managementIP = value;
    })

    entityEdit.formGroup.controls['netmask'].statusChanges.subscribe((status) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: "netmask" }));
    })

    entityEdit.formGroup.controls['gateway'].statusChanges.subscribe((status) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: "gateway" }));
    })

    if (entityEdit.formGroup.controls['remoteController']) {
      entityEdit.formGroup.controls['remoteController'].valueChanges.subscribe((res) => {
        this.loadData();
      })
    }

  }

  setErrorStatus(status, field) {
    status === 'INVALID' ? field.hasErrors = true : field.hasErrors = false;
  }

  customSubmit(payload) {
    let call = this.ws.call('ipmi.update', [this.channelValue, payload]);
    if (this.entityEdit.formGroup.controls['remoteController'] && this.entityEdit.formGroup.controls['remoteController'].value) {
      call = this.ws.call('failover.call_remote', ['ipmi.update', [this.channelValue, payload]]);
    }

    this.loader.open();
    return call.subscribe((res) => {
      this.loader.close();
      this.dialog.Info(T("Settings saved."), '', '300px', 'info', true);
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityEdit, res);
    });
  }

  loadData(filter = []) {
    let query = this.ws.call(this.queryCall, filter);
    if (this.entityEdit.formGroup.controls['remoteController'] && this.entityEdit.formGroup.controls['remoteController'].value) {
      query = this.ws.call('failover.call_remote', [this.queryCall, [filter]]);
    }
    query.subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.channelValue = res[i].channel;
        this.entityEdit.formGroup.controls['netmask'].setValue(res[i].netmask);
        this.entityEdit.formGroup.controls['dhcp'].setValue(res[i].dhcp);
        this.entityEdit.formGroup.controls['ipaddress'].setValue(res[i].ipaddress);
        this.entityEdit.formGroup.controls['gateway'].setValue(res[i].gateway);
        this.entityEdit.formGroup.controls['vlan'].setValue(res[i].vlan);
      }
    });
  }

}
