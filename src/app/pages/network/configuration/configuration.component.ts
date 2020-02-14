import { ApplicationRef, Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, TooltipsService, WebSocketService } from '../../../services/';
import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../helptext/network/configuration/configuration';

@Component({
  selector : 'app-networkconfiguration',
  template : `
  <entity-form [conf]="this"></entity-form>
  `,
  providers : [ TooltipsService ],
})
export class ConfigurationComponent {

  //protected resource_name: string = 'network/globalconfiguration/';
  protected queryCall: string = 'network.configuration.config';
  protected updateCall: string = 'network.configuration.update';
  public isEntity = false;
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
  
    {
      name: helptext.hostname_and_domain,
      width: "50%",
      label: true,
      config: [
      {
        type : 'input',
        name : 'hostname',
        placeholder : helptext.hostname_placeholder,
        tooltip : helptext.hostname_tooltip,
      },
      {
        type : 'input',
        name : 'hostname_b',
        placeholder : helptext.hostname_b_placeholder,
        tooltip : helptext.hostname_b_tooltip,
        isHidden: true,
        disabled: true
      },
      {
        type : 'input',
        name : 'hostname_virtual',
        placeholder : helptext.hostname_virtual_placeholder,
        tooltip : helptext.hostname_virtual_tooltip,
        isHidden: true,
        disabled: true
      },
      {
        type : 'input',
        name : 'domain',
        placeholder : helptext.domain_placeholder,
        tooltip : helptext.domain_tooltip,
      },
      {
        type : 'textarea',
        name : 'domains',
        placeholder: helptext.domains_placeholder,
        tooltip : helptext.domains_tooltip,
      },
    ]},
    {
      name: helptext.service_announcement,
      class: "service_announcement",
      width: "50%",
      label: true,
      config: [{
        type: 'checkbox',
        name: 'netbios',
        placeholder: helptext.netbios_placeholder,
        tooltip: helptext.netbios_tooltip
      },
      {
        type: 'checkbox',
        name: 'mdns',
        placeholder: helptext.mdns_placeholder,
        tooltip: helptext.mdns_tooltip
      },
      {
        type: 'checkbox',
        name: 'wsd',
        placeholder: helptext.wsd_placeholder,
        tooltip: helptext.wsd_tooltip
      },
    ]},
    {
      name: helptext.nameservers,
      width: "50%",
      label: true,
      config: [
      {
      type : 'input',
        name : 'nameserver1',
        placeholder : helptext.nameserver1_placeholder,
        tooltip : helptext.nameserver1_tooltip,
      },
      {
        type : 'input',
        name : 'nameserver2',
        placeholder : helptext.nameserver2_placeholder,
        tooltip : helptext.nameserver2_tooltip,
      },
      {
        type : 'input',
        name : 'nameserver3',
        placeholder : helptext.nameserver3_placeholder,
        tooltip : helptext.nameserver3_tooltip,
      },
    ]},
    {
      name: helptext.gateway,
      width: "50%",
      label: true,
      config: [
      {
        type : 'input',
        name : 'ipv4gateway',
        placeholder : helptext.ipv4gateway_placeholder,
        tooltip : helptext.ipv4gateway_tooltip,
      },
      {
        type : 'input',
        name : 'ipv6gateway',
        placeholder : helptext.ipv6gateway_placeholder,
        tooltip : helptext.ipv6gateway_tooltip,
      }
    ]},
    {
      name: helptext.other,
      width: "100%",
      label: true,
      config: [
      {
        type : 'input',
        name : 'httpproxy',
        placeholder : helptext.httpproxy_placeholder,
        tooltip : helptext.httpproxy_tooltip,
      },
      {
        type : 'checkbox',
        name : 'netwait_enabled',
        placeholder : helptext.netwait_enabled_placeholder,
        tooltip : helptext.netwait_enabled_tooltip,
      },
      {
        type : 'textarea',
        name : 'netwait_ip',
        placeholder : helptext.netwait_ip_placeholder,
        tooltip : helptext.netwait_ip_tooltip,
        relation : [
                    {
                      action : 'HIDE',
                      when : [ {
                        name : 'netwait_enabled',
                        value : false,
                      } ]
                    },
                  ],
      },
      {
        type : 'textarea',
        name : 'hosts',
        placeholder : helptext.hosts_placeholder,
        tooltip : helptext.hosts_tooltip,
      },
    ]},
    {
      name:'divider',
      divider:true
    }
  ];
  private entityEdit: EntityFormComponent;
  private failover_fields = ['hostname_b', 'hostname_virtual'];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected tooltipsService: TooltipsService) {}

  afterInit(entityEdit: any) { 
    this.entityEdit = entityEdit; 
    if (window.localStorage.getItem('product_type') === 'ENTERPRISE') {
      this.ws.call('failover.licensed').subscribe((is_ha) => { //fixme, stupid race condition makes me need to call this again
        for (let i = 0; i < this.failover_fields.length; i++) {
          entityEdit.setDisabled(this.failover_fields[i], !is_ha, !is_ha);
        }
      });
    }
    this.entityEdit.submitFunction = this.submitFunction;
  }

  resourceTransformIncomingRestData(data) {
    data['netwait_ip'] = data['netwait_ip'].join(' ');
    data['domains'] = data['domains'].join(' ');
    data['netbios'] = data['service_announcement']['netbios'];
    data['mdns'] = data['service_announcement']['mdns'];
    data['wsd'] = data['service_announcement']['wsd'];

    return data;
  }

  clean(data) {
    data['domains'] = data['domains'].split(' ');
    if (data['netwait_ip']) {
      data['netwait_ip'] = data['netwait_ip'].split(' ');
    }
    data['service_announcement'] = {
      'netbios':data['netbios'],
      'mdns':data['mdns'],
      'wsd':data['wsd']
    };
    delete data['netbios'];
    delete data['mdns'];
    delete data['wsd'];

    return data;
  }

  submitFunction(body: any) {
    return this.ws.call('network.configuration.update', [body]);
  }
}
