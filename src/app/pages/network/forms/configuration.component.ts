import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { TooltipsService, WebSocketService } from '../../../services';
import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { ipv4Validator, ipv6Validator } from '../../common/entity/entity-form/validators/ip-validation';
import helptext from '../../../helptext/network/configuration/configuration';

@Component({
  selector: 'app-networkconfiguration',
  template: `
  <entity-form [conf]="this"></entity-form>
  `,
  providers: [TooltipsService],
})
export class ConfigurationComponent {

  //protected resource_name: string = 'network/globalconfiguration/';
  protected queryCall = 'network.configuration.config';
  protected updateCall = 'network.configuration.update';
  public isEntity = false;
  public fieldConfig: FieldConfig[] = [];
  public fieldSets = new FieldSets([
    {
      name: helptext.hostname_and_domain,
      label: true,
      config: [
        {
          type: 'input',
          name: 'hostname',
          placeholder: helptext.hostname_placeholder,
          tooltip: helptext.hostname_tooltip,
        },
        {
          type: 'input',
          name: 'hostname_b',
          placeholder: helptext.hostname_b_placeholder,
          tooltip: helptext.hostname_b_tooltip,
          isHidden: true,
          disabled: true
        },
        {
          type: 'input',
          name: 'hostname_virtual',
          placeholder: helptext.hostname_virtual_placeholder,
          tooltip: helptext.hostname_virtual_tooltip,
          isHidden: true,
          disabled: true
        },
        {
          type: 'input',
          name: 'domain',
          placeholder: helptext.domain_placeholder,
          tooltip: helptext.domain_tooltip,
        },
        {
          type: 'chip',
          name: 'domains',
          placeholder: helptext.domains_placeholder,
          tooltip: helptext.domains_tooltip,
        },
      ]
    },
    {
      name: helptext.service_announcement,
      class: "service_announcement",
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
      ]
    },
    {
      name: helptext.nameservers,
      label: true,
      config: [
        {
          type: 'input',
          name: 'nameserver1',
          placeholder: helptext.nameserver1_placeholder,
          tooltip: helptext.nameserver1_tooltip,
        },
        {
          type: 'input',
          name: 'nameserver2',
          placeholder: helptext.nameserver2_placeholder,
          tooltip: helptext.nameserver2_tooltip,
        },
        {
          type: 'input',
          name: 'nameserver3',
          placeholder: helptext.nameserver3_placeholder,
          tooltip: helptext.nameserver3_tooltip,
        },
      ]
    },
    {
      name: helptext.gateway,
      label: true,
      config: [
        {
          type: 'input',
          name: 'ipv4gateway',
          placeholder: helptext.ipv4gateway_placeholder,
          tooltip: helptext.ipv4gateway_tooltip,
          validation: [ipv4Validator('ipv4gateway')]
        },
        {
          type: 'input',
          name: 'ipv6gateway',
          placeholder: helptext.ipv6gateway_placeholder,
          tooltip: helptext.ipv6gateway_tooltip,
          validation: [ipv6Validator('ipv6gateway')]
        }
      ]
    },
    {
      name: helptext.outbound_network,
      label: true,
      config: [
        {
          type: 'radio',
          name: 'outbound_network_activity',
          placeholder: '',
          options: [
            { label: helptext.outbound_network_activity.allow.placeholder, value: 'DENY', tooltip: helptext.outbound_network_activity.allow.tooltip, }, // deny type + empty list
            { label: helptext.outbound_network_activity.deny.placeholder, value: 'ALLOW', tooltip: helptext.outbound_network_activity.deny.tooltip, }, // allow type + empty list
            { label: helptext.outbound_network_activity.specific.placeholder, value: 'SPECIFIC', tooltip: helptext.outbound_network_activity.specific.tooltip, },
          ],
          value: 'DENY',
        },
        {
          type: 'select',
          multiple: true,
          name: 'outbound_network_value',
          placeholder: '',
          tooltip: helptext.outbound_network_value.tooltip,
          options: [],
          relation: [{
            action: "HIDE",
            connective: 'OR',
            when: [{
              name: "outbound_network_activity",
              value: 'ALLOW'
            }, {
              name: "outbound_network_activity",
              value: 'DENY'
            }]
          }]
        }
      ]
    },
    {
      name: helptext.other,
      label: true,
      config: [
        {
          type: 'input',
          name: 'httpproxy',
          placeholder: helptext.httpproxy_placeholder,
          tooltip: helptext.httpproxy_tooltip,
        },
        {
          type: 'checkbox',
          name: 'netwait_enabled',
          placeholder: helptext.netwait_enabled_placeholder,
          tooltip: helptext.netwait_enabled_tooltip,
        },
        {
          type: 'chip',
          name: 'netwait_ip',
          placeholder: helptext.netwait_ip_placeholder,
          tooltip: helptext.netwait_ip_tooltip,
          relation: [
            {
              action: 'HIDE',
              when: [{
                name: 'netwait_enabled',
                value: false,
              }]
            },
          ],
        },
        {
          type: 'chip',
          name: 'hosts',
          placeholder: helptext.hosts_placeholder,
          tooltip: helptext.hosts_tooltip,
        },
      ]
    },
    {
      name: 'divider',
      divider: true
    }
  ]);
  private entityEdit: EntityFormComponent;
  private failover_fields = ['hostname_b', 'hostname_virtual'];
  public title = helptext.title;
  public afterModalFormClosed;

  constructor(protected router: Router,
    protected ws: WebSocketService) { }

  preInit() {
    const outbound_network_value_field = this.fieldSets.config("outbound_network_value");
    this.ws.call('network.configuration.activity_choices').subscribe(
      (res) => {
        for (const [value, label] of res) {
          outbound_network_value_field.options.push({label: label, value: value});
        }
      }
    )
  }
  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    if (['ENTERPRISE', 'SCALE_ENTERPRISE'].includes(window.localStorage.getItem('product_type'))) {
      this.ws.call('failover.licensed').subscribe((is_ha) => { //fixme, stupid race condition makes me need to call this again
        for (let i = 0; i < this.failover_fields.length; i++) {
          entityEdit.setDisabled(this.failover_fields[i], !is_ha, !is_ha);
        }
      });
    }
    this.entityEdit.submitFunction = this.submitFunction;
  }

  resourceTransformIncomingRestData(data) {
    if (data.hosts && data.hosts !== '') {
      data['hosts'] = data.hosts.split('\n');
    } else {
      data.hosts === [];
    }
    data['netbios'] = data['service_announcement']['netbios'];
    data['mdns'] = data['service_announcement']['mdns'];
    data['wsd'] = data['service_announcement']['wsd'];
    if (data['activity']) {
      if (data['activity'].activities.length === 0) {
        data['outbound_network_activity'] = data['activity'].type;
      } else {
        if (data['activity'].type === 'ALLOW') {
          data['outbound_network_activity'] = 'SPECIFIC';
          data['outbound_network_value'] = data['activity'].activities;
        }
      }
    }
    return data;
  }

  clean(data) {
    data.hosts = data.hosts.length > 0 ? data.hosts.join('\n') : '';
    data['service_announcement'] = {
      'netbios': data['netbios'],
      'mdns': data['mdns'],
      'wsd': data['wsd']
    };
    delete data['netbios'];
    delete data['mdns'];
    delete data['wsd'];

    return data;
  }

  submitFunction(body: any) {
    return this.ws.call('network.configuration.update', [body]);
  }

  beforeSubmit(data) {
    if (data['outbound_network_activity'] === 'ALLOW' || data['outbound_network_activity'] === 'DENY') {
      data['activity'] = {type: data['outbound_network_activity'], 'activities': []};
    } else {
      data['activity'] = {type: 'ALLOW', 'activities': data['outbound_network_value']};
    }
    delete data['outbound_network_activity'];
    delete data['outbound_network_value'];
  }
}
