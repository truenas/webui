import { ApplicationRef, Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, TooltipsService, WebSocketService } from '../../../services/';
import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
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
      placeholder : helptext.gc_hostname_placeholder,
      tooltip : helptext.gc_hostname_tooltip,
    },
    {
      type : 'input',
      name : 'gc_domain',
      placeholder : helptext.gc_domain_placeholder,
      tooltip : helptext.gc_domain_tooltip,
    },
    {
      type : 'textarea',
      name : 'gc_domains',
      placeholder: helptext.gc_domains_placeholder,
      tooltip : helptext.gc_domains_tooltip,
    },
    {
      type : 'input',
      name : 'gc_ipv4gateway',
      placeholder : helptext.gc_ipv4gateway_placeholder,
      tooltip : helptext.gc_ipv4gateway_tooltip,
    },
    {
      type : 'input',
      name : 'gc_ipv6gateway',
      placeholder : helptext.gc_ipv6gateway_placeholder,
      tooltip : helptext.gc_ipv6gateway_tooltip,
    },
    {
      type : 'input',
      name : 'gc_nameserver1',
      placeholder : helptext.gc_nameserver1_placeholder,
      tooltip : helptext.gc_nameserver1_tooltip,
    },
    {
      type : 'input',
      name : 'gc_nameserver2',
      placeholder : helptext.gc_nameserver2_placeholder,
      tooltip : helptext.gc_nameserver2_tooltip,
    },
    {
      type : 'input',
      name : 'gc_nameserver3',
      placeholder : helptext.gc_nameserver3_placeholder,
      tooltip : helptext.gc_nameserver3_tooltip,
    },
    {
      type : 'input',
      name : 'gc_httpproxy',
      placeholder : helptext.gc_httpproxy_placeholder,
      tooltip : helptext.gc_httpproxy_tooltip,
    },
    {
      type : 'checkbox',
      name : 'gc_netwait_enabled',
      placeholder : helptext.gc_netwait_enabled_placeholder,
      tooltip : helptext.gc_netwait_enabled_tooltip,
    },
    {
      type : 'input',
      name : 'gc_netwait_ip',
      placeholder : helptext.gc_netwait_ip_placeholder,
      tooltip : helptext.gc_netwait_ip_tooltip,
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
      placeholder : helptext.gc_hosts_placeholder,
      tooltip : helptext.gc_hosts_tooltip,
    },
  ];
  private entityEdit: EntityFormComponent;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected tooltipsService: TooltipsService) {}

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}
