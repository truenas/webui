import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { NetworkService, RestService } from '../../../../services';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  regexValidator
} from '../../../common/entity/entity-form/validators/regex-validation';
import { T } from '../../../../translate-marker';


@Component({
  selector : 'app-interfaces-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class InterfacesFormComponent {

  protected resource_name: string = 'network/interface/';
  protected route_success: string[] = [ 'network', 'interfaces' ];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'int_interface',
      placeholder : T('NIC'),
      tooltip : T('The FreeBSD device name of the interface. This can not\
 be changed after creating the interface.'),
    },
    {
      type : 'input',
      name : 'int_name',
      placeholder : T('Interface Name'),
      tooltip : T('Description of interface.'),
    },
    {
      type : 'checkbox',
      name : 'int_dhcp',
      placeholder : T('DHCP'),
      tooltip : T('Only one interface can be configured for <b>DHCP</b>.\
 Leave unchecked to create a static IPv4 or IPv6 configuration.')
    },
    {
      type : 'input',
      name : 'int_ipv4address',
      placeholder : T('IPv4 Address'),
      tooltip : T('Enter a static IP address in the format\
 <i>###.###.###.###</i> if <b>DHCP</b> is unchecked.'),
      validation : [ regexValidator(/^(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(.(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})){3}$/) ],
      relation : [
        {action : "DISABLE", when : [ {name : "int_dhcp", value : true} ]}
      ]
    },
    {
      type : 'select',
      name : 'int_v4netmaskbit',
      placeholder : T('IPv4 Netmask'),
      tooltip : T('Enter a netmask if <b>DHCP</b> is unchecked.'),
      options : [],
      relation : [
        {action : "DISABLE", when : [ {name : "int_dhcp", value : true} ]}
      ]
    },
    {
      type : 'checkbox',
      name : 'int_ipv6auto',
      placeholder : T('Auto configure IPv6'),
      tooltip : T('Check this to automatically configure the IPv6 address\
 with <a href="https://www.freebsd.org/cgi/man.cgi?query=rtsol&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">rtsol(8)</a>. Only <i>one</i> interface can be\
 configured this way.')
    },
    {
      type : 'input',
      name : 'int_ipv6address',
      placeholder : T('IPv6 Address'),
      tooltip : T('Enter a static IPv6 address if <b>DHCP</b> is unchecked.\
 Example address: <i>2001:0db8:85a3:0000:0000:8a2e:0370:7334</i>.'),
      validation : [ regexValidator(/^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}$/i) ],
      relation : [
        {action : "DISABLE", when : [ {name : "int_ipv6auto", value : true} ]}
      ]
    },
    {
      type : 'select',
      name : 'int_v6netmaskbit',
      placeholder : T('IPv6 Prefix Length'),
      tooltip : T('Match the prefix length used on the network.'),
      options : [],
      relation : [
        {action : "DISABLE", when : [ {name : "int_ipv6auto", value : true} ]}
      ]
    },
    {
      type : 'input',
      name : 'int_options',
      placeholder : T('Options'),
      tooltip : T('Enter any additional parameters from <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=ifconfig&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">ifconfig(8)</a>. Separate multiple parameters with a space.'),
    },
  ];

  private int_v4netmaskbit: any;
  private int_v6netmaskbit: any;
  private int_interface: any;
  private entityForm: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService,
              protected networkService: NetworkService) {}

  preInit(entityForm: any) {
    this.int_interface = _.find(this.fieldConfig, {'name' : 'int_interface'});
    this.route.params.subscribe(params => {
      if(!params['pk']) {
        this.int_interface.type = 'select';
        this.int_interface.options = [];
      }
    });
  }

  afterInit(entityForm: any) {
    this.int_v4netmaskbit =
        _.find(this.fieldConfig, {'name' : 'int_v4netmaskbit'});
    this.int_v4netmaskbit.options = this.networkService.getV4Netmasks();

    this.int_v6netmaskbit =
        _.find(this.fieldConfig, {'name' : 'int_v6netmaskbit'});
    this.int_v6netmaskbit.options = this.networkService.getV6PrefixLength();

    if (!entityForm.isNew) {
      entityForm.setDisabled('int_interface', true);
    }
    else {
      this.networkService.getInterfaceNicChoices().subscribe((res) => {
        res.forEach((item) => {
          this.int_interface.options.push({label : item[1], value : item[0]});
        });
      });
    }
  }
}
