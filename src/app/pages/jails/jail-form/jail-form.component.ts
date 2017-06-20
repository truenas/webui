import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import * as _ from 'lodash';
//import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { JailService } from '../../../services/';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';

@Component({
	selector: 'app-jail-add',
	template: `<entity-form [conf]="this"></entity-form>`,
  providers: [JailService]
})
export class JailFormComponent {

	protected resource_name: string = 'jails/jails';
  protected route_success: string[] = ['jails', 'jails'];
  protected route_conf: string[] = ['jails', 'configuration'];
  protected isBasicMode: boolean = true;
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'jail_host',
      placeholder: 'Jails Name',
    },
    {
      type: 'select',
      name: 'jail_type',
      placeholder: 'Template',
      options: [],
    },
    {
      type: 'checkbox',
      name: 'jc_ipv4_dhcp',
      placeholder: 'IPv4 DHCP',
    },
    {
      type: 'input',
      name: 'jail_ipv4',
      placeholder: 'IPv4 address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ]
    },
    {
      type: 'select',
      name: 'jail_ipv4_netmask',
      placeholder: 'IPv4 netmask',
      options: [],
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ],
    },
    {
      type: 'input',
      name: 'jail_bridge_ipv4',
      placeholder: 'IPv4 bridge address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ]
    },
    {
      type: 'select',
      name: 'jail_bridge_ipv4_netmask',
      placeholder: 'IPv4 bridge netmask',
      options: [],
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ],
    },
    {
      type: 'input',
      name: 'jail_defaultrouter_ipv4',
      placeholder: 'IPv4 default gateway',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv4_dhcp",
              value: true
            }
          ]
        }
      ]
    },
    {
      type: 'checkbox',
      name: 'jc_ipv6_autoconf',
      placeholder: 'IPv6 Autoconfigure',
    },
    {
      type: 'input',
      name: 'jail_ipv6',
      placeholder: 'IPv6 address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ]
    },
    {
      type: 'select',
      name: 'jail_ipv6_prefix',
      placeholder: 'IPv6 prefix length',
      options: [],
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ],
    },
    {
      type: 'input',
      name: 'jail_bridge_ipv6',
      placeholder: 'IPv6 bridge address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ]
    },
    {
      type: 'select',
      name: 'jail_bridge_ipv6_prefix',
      placeholder: 'IPv6 bridge prefix length',
      options: [],
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ],
    },
    {
      type: 'input',
      name: 'jail_defaultrouter_ipv6',
      placeholder: 'IPv6 default gateway',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "jc_ipv6_autoconf",
              value: true
            }
          ]
        }
      ]
    },
    {
      type: 'input',
      name: 'jail_mac',
      placeholder: 'MAC',
    },
    {
      type: 'select',
      name: 'jail_iface',
      placeholder: 'NIC',
      options: [],
    },
    {
      type: 'input',
      name: 'jail_flags',
      placeholder: 'Sysctls',
    },
    {
      type: 'checkbox',
      name: 'jail_autostart',
      placeholder: 'Autostart',
      value: true,
    },
    {
      type: 'checkbox',
      name: 'jail_vnet',
      placeholder: 'VIMAGE',
      value: true,
    },
    {
      type: 'checkbox',
      name: 'jail_nat',
      placeholder: 'NAT',
    }
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

  private jail_ipv4_netmask: any;
  private jail_bridge_ipv4_netmask: any;
  private jail_ipv6_prefix: any;
  private jail_bridge_ipv6_prefix: any;

  constructor(protected router: Router, protected jailService: JailService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  afterInit(entityForm: EntityFormComponent) {
    let ipv4_netmask_options = this.jailService.getIpv4Netmask();
    let ipv6_prefix_options = this.jailService.getIpv6Prefix();

    this.jail_ipv4_netmask = _.find(this.fieldConfig, {'name': 'jail_ipv4_netmask'});
    this.jail_bridge_ipv4_netmask = _.find(this.fieldConfig, {'name': 'jail_bridge_ipv4_netmask'});
    ipv4_netmask_options.forEach((item) => {
      this.jail_ipv4_netmask.options.push({ label: item.label, value: item.value});
      this.jail_bridge_ipv4_netmask.options.push({ label: item.label, value: item.value});
    });

    this.jail_ipv6_prefix = _.find(this.fieldConfig, {'name': 'jail_ipv6_prefix'});
    this.jail_bridge_ipv6_prefix = _.find(this.fieldConfig, {'name': 'jail_bridge_ipv6_prefix'});
    ipv6_prefix_options.forEach((item) => {
        this.jail_ipv6_prefix.options.push({ label: item.label, value: item.value});
        this.jail_bridge_ipv6_prefix.options.push({ label: item.label, value: item.value});
    });
  
    this.jailService.getJailsConfig().subscribe((res) => {
      for(let i in res.data) {
        if (i == "jc_path" && res.data[i] == "") {
          entityForm.hasConf = false;
        }

        let fg = entityForm.formGroup.controls[i];
        if(fg) {
          fg.setValue(res.data[i]);
        }
      }
    });
  }
}
