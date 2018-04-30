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
      tooltip : T('Additional domains to be searched can be entered here, \
                  separated by spaces. Be aware that adding search domains \
                  can cause slow DNS lookups.')
    },
    {
      type : 'input',
      name : 'gc_ipv4gateway',
      placeholder : T('IPv4 Default Gateway'),
      tooltip : T('Adding an IPv4 address here overrides a default\
 gateway provided by DHCP.'),
    },
    {
      type : 'input',
      name : 'gc_ipv6gateway',
      placeholder : T('IPv6 Default Gateway'),
      tooltip : T('Adding an IPv6 address here overrides a default\
 gateway provided by DHCP.'),
    },
    {
      type : 'input',
      name : 'gc_nameserver1',
      placeholder : T('Nameserver 1'),
      tooltip : T('The primary DNS server, typically in Windows domain.'),
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
      tooltip : T('Enter the proxy information for the network in the\
 format <i>http://my.proxy.server:3128</i> or\
 <i>http://user:password@my.proxy.server:3128</i>'),
    },
    {
      type : 'checkbox',
      name : 'gc_netwait_enabled',
      placeholder : T('Enable netwait feature'),
      tooltip : T('If enabled, delays the start of network-reliant\
 services until the interface is up and ICMP packets to a destination\
 defined in <i>netwait ip list</i> are flowing. Link state is examined\
 first, followed by "pinging" an IP address to verify network usability.\
 If no destination can be reached or timeouts are exceeded, network\
 services are started anyway with no guarantee the network is usable.')
    },
    {
      type : 'input',
      name : 'gc_netwait_ip',
      placeholder : T('Netwait IP list'),
      tooltip : T('Space-delimited list of IP addresses to\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=ping&manpath=FreeBSD+11.1-RELEASE+and+Ports" target="_blank"><ins>ping(8)</ins></a>.\
 If multiple IP addresses are specified, each is tried until one is\
 successful or the list is exhausted. If empty, the default gateway is\
 used.')
    },
    {
      type : 'textarea',
      name : 'gc_hosts',
      placeholder : T('Host name database'),
      tooltip :
          T('This value is appended to <i>/etc/hosts</i> which contains\
 information regarding known hosts on the network. See\
 <a href="www.freebsd.org/cgi/man.cgi?query=hosts&manpath=FreeBSD+11.1+RELEASE+and+Ports" target="_blank"><ins>hosts(5)</ins></a>.')
    },
  ];
  private entityEdit: EntityFormComponent;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected tooltipsService: TooltipsService) {}

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}
