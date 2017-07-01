import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  DynamicCheckboxModel,
  DynamicFormControlModel,
  DynamicFormService,
  DynamicInputModel,
  DynamicTextAreaModel
} from '@ng2-dynamic-forms/core';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../global.state';
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

@Component({
  selector : 'app-networkconfiguration',
  template : `
  <entity-form [conf]="this"></entity-form>
  `,
  providers : [ TooltipsService ],
})
export class ConfigurationComponent implements OnInit {

  protected resource_name: string = 'network/globalconfiguration/';
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'gc_hostname',
      placeholder : 'Hostname',
    },
    {
      type : 'input',
      name : 'gc_domain',
      placeholder : 'Domain',
    },
    {
      type : 'input',
      name : 'gc_ipv4gateway',
      placeholder : 'IPv4 Default Gateway',
    },
    {
      type : 'input',
      name : 'gc_ipv6gateway',
      placeholder : 'IPv6 Default Gateway',
    },
    {
      type : 'input',
      name : 'gc_nameserver1',
      placeholder : 'Nameserver 1',
    },
    {
      type : 'input',
      name : 'gc_nameserver2',
      placeholder : 'Nameserver 2',
    },
    {
      type : 'input',
      name : 'gc_nameserver3',
      placeholder : 'Nameserver 3',
    },
    {
      type : 'input',
      name : 'gc_httpproxy',
      placeholder : 'HTTP Proxy',
    },
    {
      type : 'checkbox',
      name : 'gc_netwait_enabled',
      placeholder : 'Enable netwait feature',
      tooltip :
          'If enabled, delays the start of network-reliant services until interface is up and ICMP packets to a destination defined in netwait ip list are flowing. Link state is examined first, followed by "pinging" an IP address to verify network usability. If no destination can be reached or timeouts are exceeded, network services are started anyway with no guarantee that the network is usable.'
    },
    {
      type : 'input',
      name : 'gc_netwait_ip',
      placeholder : 'Netwait IP list',
      tooltip : ''
    },
    {
      type : 'textarea',
      name : 'gc_hosts',
      placeholder : 'Host name data base',
      tooltip :
          'This field is appended to /etc/hosts which contains information regarding known hosts on the network. hosts(5)'
    },
  ];
  private entityEdit: EntityFormComponent;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected formService: DynamicFormService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState,
              protected tooltipsService: TooltipsService) {}

  protected gc_netwait_ip: any;

  ngOnInit() {
    this.tooltipsService.getTooltip('gc_netwait_ip').then((res) => {
      let tooltip = res.body;
      this.gc_netwait_ip = _.find(this.fieldConfig, {'name' : 'gc_netwait_ip'});
      this.gc_netwait_ip.tooltip = tooltip;
    });
  }

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}
