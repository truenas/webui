import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../global.state';
import {EntityFormComponent} from '../../common/entity/entity-form';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-jail-configuration',
  template : `
  <entity-form [conf]="this"></entity-form>
  `
})
export class JailsConfigurationComponent {

  protected resource_name: string = 'jails/configuration/';
  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'jc_path',
      placeholder : 'Jail Root',
    },
    {
      type : 'checkbox',
      name : 'jc_ipv4_dhcp',
      placeholder : 'IPv4 DHCP',
    },
    {
      type : 'input',
      name : 'jc_ipv4_network',
      placeholder : 'IPv4 Network',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv4_dhcp", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_ipv4_network_start',
      placeholder : 'IPv4 Network Start Address',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv4_dhcp", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_ipv4_network_end',
      placeholder : 'IPv4 Network End Address',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv4_dhcp", value : true} ]
      } ]
    },
    {
      type : 'checkbox',
      name : 'jc_ipv6_autoconf',
      placeholder : 'IPv6 Autoconfigure',
    },
    {
      type : 'input',
      name : 'jc_ipv6_network',
      placeholder : 'IPv6 Network',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv6_autoconf", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_ipv6_network_start',
      placeholder : 'IPv6 Network Start Address',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv6_autoconf", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_ipv6_network_end',
      placeholder : 'IPv6 Network End Address',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv6_autoconf", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_collectionurl',
      placeholder : 'Collection URL',
    },
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

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  constructor(protected router: Router, protected _injector: Injector,
              protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}

  afterInit(entityEdit: any) {}
}
