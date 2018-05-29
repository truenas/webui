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
      tooltip : T('System host name.'),
    },
    {
      type : 'input',
      name : 'gc_domain',
      placeholder : T('Domain'),
      tooltip : T('System domain name.'),
    },
    {
      type : 'textarea',
      name : 'gc_domains',
      placeholder: T('Additional Domains'),
      tooltip : T('Add other domains to search, separated by spaces.\
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
      tooltip : T('Enter an IPv4 address. This overrides the default\
                   gateway provided by DHCP.'),
    },
    {
      type : 'input',
      name : 'gc_nameserver1',
      placeholder : T('Nameserver 1'),
      tooltip : T('The primary DNS server, typically a Windows domain.'),
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
      tooltip : T('Tertiary DNS server'),
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
                   ip list</i> are flowing.'),
    },
    {
      type : 'input',
      name : 'gc_netwait_ip',
      placeholder : T('Netwait IP list'),
      tooltip : T('Enter a space-delimited list of IP addresses to <a\
                   href="https://www.freebsd.org/cgi/man.cgi?query=ping&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                   target="_blank">ping(8)</a>. Each address is tried\
                   until one is successful or the list is exhausted.\
                   Leave empty to use the default gateway.'),
    },
    {
      type : 'textarea',
      name : 'gc_hosts',
      placeholder : T('Host name database'),
      tooltip :
          T('This is appended to <i>/etc/hosts</i>, which contains\
             information regarding known hosts on the network. See <a\
             href="www.freebsd.org/cgi/man.cgi?query=hosts&manpath=FreeBSD+11.1+RELEASE+and+Ports"\
             target="_blank">hosts(5)</a>.'),
    },
  ];
  private entityEdit: EntityFormComponent;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected tooltipsService: TooltipsService) {}

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}
