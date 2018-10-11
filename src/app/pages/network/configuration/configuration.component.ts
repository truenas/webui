import {ApplicationRef, Component, Injector} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  RestService,
  TooltipsService,
  WebSocketService
} from '../../../services/';
import {EntityFormComponent} from '../../common/entity/entity-form';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import {Tooltip} from '../../common/tooltip';
import {TOOLTIPS} from '../../common/tooltips';
import { T } from '../../../translate-marker';
import helptext from '../../../helptext/network/configuration/configuration';

@Component({
  selector : 'app-networkconfiguration',
  template : `
  <entity-form [conf]="this"></entity-form>
  `,
  providers : [ TooltipsService ],
})
export class ConfigurationComponent {

  protected resource_name: string = 'network/globalconfiguration/';
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'gc_hostname',
      placeholder : T('Hostname'),
      tooltip : T('System hostname.'),
    },
    {
      type : 'input',
      name : 'gc_domain',
      placeholder : T('Domain'),
      tooltip : T('System domain name, like <i>example.com</i>'),
    },
    {
      type : 'textarea',
      name : 'gc_domains',
      placeholder: T('Additional Domains'),
      tooltip : T('Additional space-delimited domains to search.\
                   Adding search domains can cause slow DNS lookups.'),
    },
    {
      type : 'input',
      name : 'gc_ipv4gateway',
      placeholder : T('IPv4 Default Gateway'),
      tooltip : T('Enter an IPv4 address. This overrides the default\
                   gateway provided by DHCP.'),
    },
    {
      type : 'input',
      name : 'gc_ipv6gateway',
      placeholder : T('IPv6 Default Gateway'),
      tooltip : T('Enter an IPv6 address. This overrides the default\
                   gateway provided by DHCP.'),
    },
    {
      type : 'input',
      name : 'gc_nameserver1',
      placeholder : T('Nameserver 1'),
      tooltip : T('Primary DNS server.'),
    },
    {
      type : 'input',
      name : 'gc_nameserver2',
      placeholder : T('Nameserver 2'),
      tooltip : T('Secondary DNS server.'),
    },
    {
      type : 'input',
      name : 'gc_nameserver3',
      placeholder : T('Nameserver 3'),
      tooltip : T('Third DNS server'),
    },
    {
      type : 'input',
      name : 'gc_httpproxy',
      placeholder : T('HTTP Proxy'),
      tooltip : T('Enter the proxy information for the network. Example:\
                   <i>http://my.proxy.server:3128</i> or\
                   <i>http://user:password@my.proxy.server:3128</i>'),
    },
    {
      type : 'checkbox',
      name : 'gc_netwait_enabled',
      placeholder : T('Enable netwait feature'),
      tooltip : T('Set to delay the start of network-reliant services\
                   until ICMP packets to a destination in the <i>netwait\
                   IP list</i> are flowing.'),
    },
    {
      type : 'input',
      name : 'gc_netwait_ip',
      placeholder : T('Netwait IP list'),
      tooltip : T('Enter a space-delimited list of IP addresses to <a\
                   href="https://www.freebsd.org/cgi/man.cgi?query=ping"\
                   target="_blank">ping(8)</a>. Each address is tried\
                   until one is successful or the list is exhausted.\
                   Leave empty to use the default gateway.'),
      relation : [
                    {
                      action : 'HIDE',
                      when : [ {
                        name : 'gc_netwait_enabled',
                        value : false,
                      } ]
                    },
                  ],
    },
    {
      type : 'textarea',
      name : 'gc_hosts',
      placeholder : T('Host name database'),
      tooltip : T('Additional hosts to be appended to <i>/etc/hosts</i>\
                   can be added here. Each host entry is a single line\
                   with whitespace-delimited IP address, hostname, and\
                   any aliases. Hosts defined here are still accessible\
                   by name even when DNS is not available. See <a\
                   href="https://www.freebsd.org/cgi/man.cgi?query=hosts"\
                   target="_blank">hosts(5)</a> for additional information.'),
    },
  ];
  private entityEdit: EntityFormComponent;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected tooltipsService: TooltipsService) {}

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}
