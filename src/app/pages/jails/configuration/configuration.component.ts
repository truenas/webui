import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { DynamicFormControlModel, DynamicFormService, DynamicFormGroupModel, DynamicCheckboxModel, DynamicInputModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';

@Component({
  selector: 'app-jail-configuration',
  template: `
  <entity-config [conf]="this"></entity-config>
  `
})
export class JailsConfigurationComponent {

  protected resource_name: string = 'jails/configuration/';
  protected isBasicMode: boolean = true;

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'jc_path',
      label: 'Jail Root',
    }),
    new DynamicCheckboxModel({
      id: 'jc_ipv4_dhcp',
      label: 'IPv4 DHCP',
    }),
    new DynamicInputModel({
      id: 'jc_ipv4_network',
      label: 'IPv4 Network',
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
    new DynamicInputModel({
      id: 'jc_ipv4_network_start',
      label: 'IPv4 Network Start Address',
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
    new DynamicInputModel({
      id: 'jc_ipv4_network_end',
      label: 'IPv4 Network End Address',
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
      id: 'jc_ipv6_network',
      label: 'IPv6 Network',
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
      id: 'jc_ipv6_network_start',
      label: 'IPv6 Network Start Address',
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
      id: 'jc_ipv6_network_end',
      label: 'IPv6 Network End Address',
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
      id: 'jc_collectionurl',
      label: 'Collection URL',
    }),
  ];

  protected advanced_field: Array<any> = [
    'jc_ipv4_network',
    'jc_ipv4_network_start',
    'jc_ipv4_network_end',
    'jc_ipv6_network',
    'jc_ipv6_network_start',
    'jc_ipv6_network_end',
    'jc_collectionurl',
  ];

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    } 
    return true;
  }

  protected custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: 'Basic Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    },
    {
      'id': 'advanced_mode',
      name: 'Advanced Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    }
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityEdit: any) {
  }

}
