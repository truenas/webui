import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';

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
      tooltip : 'Path where to store jail data. Mandatory. Jails cannot\
 be added until this is set.',
    },
    {
      type : 'checkbox',
      name : 'jc_ipv4_dhcp',
      placeholder : 'IPv4 DHCP',
      tooltip : 'Check this box if the network has a DHCP server. When\
 enabled, use DHCP to obtain IPv4 address as well as default router.',
    },
    {
      type : 'input',
      name : 'jc_ipv4_network',
      placeholder : 'IPv4 Network',
      tooltip : 'IPv4 network range for jails and plugins. Format is IP\
 address of <i>network/CIDR mask</i>.',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv4_dhcp", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_ipv4_network_start',
      placeholder : 'IPv4 Network Start Address',
      tooltip : 'Enter the first IP address in the reserved range in\
 the format <i>host/CIDR mask</i>.',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv4_dhcp", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_ipv4_network_end',
      placeholder : 'IPv4 Network End Address',
      tooltip : 'Enter the last IP address in the reserved range in the\
 format <i>host/CIDR mask</i>.',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv4_dhcp", value : true} ]
      } ]
    },
    {
      type : 'checkbox',
      name : 'jc_ipv6_autoconf',
      placeholder : 'IPv6 Autoconfigure',
      tooltip : 'When enabled, automatically configurate IPv6 address\
 via rtsol(8). Check this box if the network has a DHCPv6 server and\
 IPv6 will be used to access jails.',
    },
    {
      type : 'input',
      name : 'jc_ipv6_network',
      placeholder : 'IPv6 Network',
      tooltip : 'Enter the network address for a properly configured\
 IPv6 network.',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv6_autoconf", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_ipv6_network_start',
      placeholder : 'IPv6 Network Start Address',
      tooltip : 'Enter the first IP address in the reserved range for\
 a properly configured IPv6 network.',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv6_autoconf", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_ipv6_network_end',
      placeholder : 'IPv6 Network End Address',
      tooltip : 'Enter the last IP address in the reserved range for a\
 properly configured IPv6 network.',
      relation : [ {
        action : "DISABLE",
        when : [ {name : "jc_ipv6_autoconf", value : true} ]
      } ]
    },
    {
      type : 'input',
      name : 'jc_collectionurl',
      placeholder : 'Collection URL',
      tooltip : 'URL for the index of the jail. Changing the defualt\
 may break the ability to install jails.',
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

  constructor(protected router: Router) {}

  afterInit(entityEdit: any) {}
}
