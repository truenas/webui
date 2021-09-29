import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/network/ipmi/ipmi';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Ipmi, IpmiUpdate } from 'app/interfaces/ipmi.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { ipv4Validator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-ipmi',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class IPMIFromComponent implements FormConfiguration {
  title = T('IPMI');
  queryCall: 'ipmi.query' = 'ipmi.query';

  protected entityEdit: EntityFormComponent;
  is_ha = false;
  controllerName = globalHelptext.Ctrlr;
  currentControllerLabel: string;
  failoverControllerLabel: string;
  managementIP: string;
  options: Option[] = helptext.ipmiOptions;
  custActions = [
    {
      id: 'ipmi_identify',
      name: T('Identify Light'),
      function: () => {
        this.dialog.select(
          'IPMI Identify', this.options, 'IPMI flash duration', 'ipmi.identify', 'seconds',
        );
      },
    },
    {
      id: 'connect',
      name: T('Manage'),
      function: () => {
        window.open(`http://${this.managementIP}`);
      },
    },
  ];
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
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
          validation: [ipv4Validator()],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'dhcp',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'netmask',
          placeholder: helptext.netmask_placeholder,
          tooltip: helptext.netmask_tooltip,
          validation: [ipv4Validator()],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'dhcp',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'gateway',
          placeholder: helptext.gateway_placeholder,
          tooltip: helptext.gateway_tooltip,
          validation: [ipv4Validator()],
          errors: helptext.ip_error,
          hasErrors: false,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'dhcp',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'vlan',
          placeholder: helptext.vlan_placeholder,
          tooltip: helptext.vlan_tooltip,
          inputType: 'number',
        },
      ],
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
      ],
    },
    {
      name: 'divider',
      divider: true,
    }];

  queryKey = 'id';
  channelValue: number;
  isEntity = true;

  constructor(
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
  ) { }

  async prerequisite(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
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
            width: '100%',
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
                  },
                ],
                value: false,
              },
            ],
          }, {
            name: 'ipmi_divider',
            divider: true,
          });
          resolve(true);
        } else {
          resolve(true);
        }
      } else {
        resolve(true);
      }
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.channelValue = entityEdit.pk;
    this.entityEdit = entityEdit;

    entityEdit.formGroup.controls['password'].statusChanges.pipe(untilDestroyed(this)).subscribe((status: string) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: 'password' }));
    });

    entityEdit.formGroup.controls['ipaddress'].statusChanges.pipe(untilDestroyed(this)).subscribe((status: string) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: 'ipaddress' }));
      const ipValue = entityEdit.formGroup.controls['ipaddress'].value;
      const btn = document.getElementById('cust_button_Manage') as HTMLInputElement;
      btn.disabled = (status === 'INVALID' || ipValue === '0.0.0.0');
    });

    entityEdit.formGroup.controls['ipaddress'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      this.managementIP = value;
    });

    entityEdit.formGroup.controls['netmask'].statusChanges.pipe(untilDestroyed(this)).subscribe((status: string) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: 'netmask' }));
    });

    entityEdit.formGroup.controls['gateway'].statusChanges.pipe(untilDestroyed(this)).subscribe((status: string) => {
      this.setErrorStatus(status, _.find(this.fieldConfig, { name: 'gateway' }));
    });

    if (entityEdit.formGroup.controls['remoteController']) {
      entityEdit.formGroup.controls['remoteController'].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        this.loadData();
      });
    }
  }

  setErrorStatus(status: string, field: FieldConfig): void {
    field.hasErrors = (status === 'INVALID');
  }

  customSubmit(payload: IpmiUpdate): Subscription {
    let call$ = this.ws.call('ipmi.update', [this.channelValue, payload]);
    if (this.entityEdit.formGroup.controls['remoteController'] && this.entityEdit.formGroup.controls['remoteController'].value) {
      call$ = this.ws.call('failover.call_remote', ['ipmi.update', [this.channelValue, payload]]);
    }

    this.loader.open();
    return call$.pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      this.dialog.info(T('Settings saved.'), '', '300px', 'info', true);
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityEdit, res);
    });
  }

  loadData(filter: QueryParams<Ipmi> = []): void {
    let query$ = this.ws.call(this.queryCall, filter);
    if (this.entityEdit.formGroup.controls['remoteController'] && this.entityEdit.formGroup.controls['remoteController'].value) {
      query$ = this.ws.call('failover.call_remote', [this.queryCall, [filter]]);
    }
    query$.pipe(untilDestroyed(this)).subscribe((res) => {
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
