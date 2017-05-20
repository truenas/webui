import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService, JailService } from '../../../services/';

import { EntityAddComponent } from '../../common/entity/entity-add/';

@Component({
	selector: 'app-jail-add',
	template: `<entity-add [conf]="this"></entity-add>`,
  providers: [JailService]
})
export class JailAddComponent {

	protected resource_name: string = 'jails/jails';
  protected route_success: string[] = ['jails', 'jails'];
  protected isBasicMode: boolean = true;
  protected entityAdd: EntityAddComponent;

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'jail_host',
      label: 'Jails Name',
    }),
    new DynamicSelectModel({
      id: 'jail_type',
      label: 'Template',
    }),
    new DynamicCheckboxModel({
      id: 'jc_ipv4_dhcp',
      label: 'IPv4 DHCP',
    }),
    new DynamicInputModel({
      id: 'jail_ipv4',
      label: 'IPv4 address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ]
    }),
    new DynamicSelectModel({
      id: 'jail_ipv4_netmask',
      label: 'IPv4 netmask',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ],
    }),
    new DynamicInputModel({
      id: 'jail_bridge_ipv4',
      label: 'IPv4 bridge address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ]
    }),
    new DynamicSelectModel({
      id: 'jail_bridge_ipv4_netmask',
      label: 'IPv4 bridge netmask',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ],
    }),
    new DynamicInputModel({
      id: 'jail_defaultrouter_ipv4',
      label: 'IPv4 default gateway',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ]
    }),
    new DynamicCheckboxModel({
      id: 'jc_ipv6_autoconf',
      label: 'IPv6 Autoconfigure',
    }),
    new DynamicInputModel({
      id: 'jail_ipv6',
      label: 'IPv6 address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ]
    }),
    new DynamicSelectModel({
      id: 'jail_ipv6_prefix',
      label: 'IPv6 prefix length',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ],
    }),
    new DynamicInputModel({
      id: 'jail_bridge_ipv6',
      label: 'IPv6 bridge address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ]
    }),
    new DynamicSelectModel({
      id: 'jail_bridge_ipv6_prefix',
      label: 'IPv6 bridge prefix length',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ],
    }),
    new DynamicInputModel({
      id: 'jail_defaultrouter_ipv6',
      label: 'IPv6 default gateway',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              id: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ]
    }),
    new DynamicInputModel({
      id: 'jail_mac',
      label: 'MAC',
    }),
    new DynamicSelectModel({
      id: 'jail_iface',
      label: 'NIC',
    }),
    new DynamicInputModel({
      id: 'jail_flags',
      label: 'Sysctls',
    }),
    new DynamicCheckboxModel({
      id: 'jail_autostart',
      label: 'Autostart',
      value: true,
    }),
    new DynamicCheckboxModel({
      id: 'jail_vnet',
      label: 'VIMAGE',
      value: true,
    }),
    new DynamicCheckboxModel({
      id: 'jail_nat',
      label: 'NAT',
    })
  ];

  protected advanced_field: Array<any> = [
    'jail_type',
    'jc_ipv4_dhcp',
    'jail_ipv4',
    'jail_ipv4_netmask',
    'jail_bridge_ipv4',
    'jail_bridge_ipv4_netmask',
    'jail_defaultrouter_ipv4',
    'jc_ipv6_autoconf',
    'jail_ipv6',
    'jail_ipv6_prefix',
    'jail_bridge_ipv6',
    'jail_bridge_ipv6_prefix',
    'jail_defaultrouter_ipv6',
    'jail_mac',
    'jail_iface',
    'jail_flags',
    'jail_autostart',
    'jail_vnet',
    'jail_nat',
  ];

  protected custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: 'Basic Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    },
    {
      id: 'advanced_mode',
      name: 'Advanced Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    }
  ];

  protected jail_ipv4_netmask: DynamicSelectModel<string>;
  protected jail_bridge_ipv4_netmask: DynamicSelectModel<string>;
  protected jail_ipv6_prefix: DynamicSelectModel<string>;
  protected jail_bridge_ipv6_prefix: DynamicSelectModel<string>;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected jailService: JailService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  afterInit(entityAdd: any) {
  }

  preInit(entityAdd: EntityAddComponent) {
    let ipv4_netmask_options = this.jailService.getIpv4Netmask();
    let ipv6_prefix_options = this.jailService.getIpv6Prefix();

    this.jail_ipv4_netmask = <DynamicSelectModel<string>> this.formService.findById("jail_ipv4_netmask", this.formModel);
    this.jail_bridge_ipv4_netmask = <DynamicSelectModel<string>> this.formService.findById("jail_bridge_ipv4_netmask", this.formModel);
    ipv4_netmask_options.forEach((item) => {
        this.jail_ipv4_netmask.add(item);
        this.jail_bridge_ipv4_netmask.add(item);
    });

    this.jail_ipv6_prefix = <DynamicSelectModel<string>> this.formService.findById("jail_ipv6_prefix", this.formModel);
    this.jail_bridge_ipv6_prefix = <DynamicSelectModel<string>> this.formService.findById("jail_bridge_ipv6_prefix", this.formModel);
    ipv6_prefix_options.forEach((item) => {
        this.jail_ipv6_prefix.add(item);
        this.jail_bridge_ipv6_prefix.add(item);
    });

    this.rest.get("jails/configuration/", {}).subscribe((res) => {
      for(let i in res.data) {
        let fg = entityAdd.formGroup.controls[i];
        if(fg) {
          fg.setValue(res.data[i]);
        }
      }
    })
  }
}