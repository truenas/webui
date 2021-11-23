import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/network/configuration/configuration';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { NetworkConfiguration, NetworkConfigurationUpdate } from 'app/interfaces/network-configuration.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/pages/common/entity/entity-form/models/relation-connection.enum';
import { ipv4Validator, ipv6Validator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-networkconfiguration',
  template: `
  <entity-form [conf]="this"></entity-form>
  `,
})
export class ConfigurationComponent implements FormConfiguration {
  queryCall = 'network.configuration.config' as const;
  updateCall = 'network.configuration.update' as const;
  isEntity = false;
  fieldConfig: FieldConfig[] = [];
  fieldSets = new FieldSets([
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
          disabled: true,
        },
        {
          type: 'input',
          name: 'hostname_virtual',
          placeholder: helptext.hostname_virtual_placeholder,
          tooltip: helptext.hostname_virtual_tooltip,
          isHidden: true,
          disabled: true,
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
      ],
    },
    {
      name: helptext.service_announcement,
      class: 'service_announcement',
      label: true,
      config: [{
        type: 'checkbox',
        name: 'netbios',
        placeholder: helptext.netbios_placeholder,
        tooltip: helptext.netbios_tooltip,
      },
      {
        type: 'checkbox',
        name: 'mdns',
        placeholder: helptext.mdns_placeholder,
        tooltip: helptext.mdns_tooltip,
      },
      {
        type: 'checkbox',
        name: 'wsd',
        placeholder: helptext.wsd_placeholder,
        tooltip: helptext.wsd_tooltip,
      },
      ],
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
      ],
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
          validation: [ipv4Validator()],
        },
        {
          type: 'input',
          name: 'ipv6gateway',
          placeholder: helptext.ipv6gateway_placeholder,
          tooltip: helptext.ipv6gateway_tooltip,
          validation: [ipv6Validator()],
        },
      ],
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
            // deny type + empty list
            {
              label: helptext.outbound_network_activity.allow.placeholder,
              value: NetworkActivityType.Deny,
              tooltip: helptext.outbound_network_activity.allow.tooltip,
            },
            // allow type + empty list
            {
              label: helptext.outbound_network_activity.deny.placeholder,
              value: NetworkActivityType.Allow,
              tooltip: helptext.outbound_network_activity.deny.tooltip,
            },
            {
              label: helptext.outbound_network_activity.specific.placeholder,
              value: 'SPECIFIC',
              tooltip: helptext.outbound_network_activity.specific.tooltip,
            },
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
            action: RelationAction.Hide,
            connective: RelationConnection.Or,
            when: [{
              name: 'outbound_network_activity',
              value: NetworkActivityType.Allow,
            }, {
              name: 'outbound_network_activity',
              value: NetworkActivityType.Deny,
            }],
          }],
        },
      ],
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
              action: RelationAction.Hide,
              when: [{
                name: 'netwait_enabled',
                value: false,
              }],
            },
          ],
        },
        {
          type: 'chip',
          name: 'hosts',
          placeholder: helptext.hosts_placeholder,
          tooltip: helptext.hosts_tooltip,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ]);
  private entityEdit: EntityFormComponent;
  private failoverFields = ['hostname_b', 'hostname_virtual'];
  title = helptext.title;
  afterModalFormClosed: () => void;

  constructor(protected router: Router,
    protected ws: WebSocketService) { }

  preInit(): void {
    const outboundNetworkValueField = this.fieldSets.config('outbound_network_value') as FormSelectConfig;
    this.ws.call('network.configuration.activity_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      for (const [value, label] of choices) {
        outboundNetworkValueField.options.push({ label, value });
      }
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    if ([ProductType.Enterprise, ProductType.ScaleEnterprise].includes(window.localStorage.getItem('product_type') as ProductType)) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((isHa) => { // fixme, stupid race condition makes me need to call this again
        this.failoverFields.forEach((field) => {
          entityEdit.setDisabled(field, !isHa, !isHa);
        });
      });
    }
    this.entityEdit.submitFunction = this.submitFunction;
  }

  resourceTransformIncomingRestData(data: NetworkConfiguration): any[] {
    const transformed: any = { ...data };
    if (data.hosts && data.hosts !== '') {
      transformed['hosts'] = data.hosts.split('\n');
    } else {
      transformed.hosts = [];
    }
    transformed['netbios'] = data.service_announcement.netbios;
    transformed['mdns'] = data.service_announcement.mdns;
    transformed['wsd'] = data.service_announcement.wsd;
    if (data.activity) {
      if (data.activity.activities.length === 0) {
        transformed['outbound_network_activity'] = data.activity.type;
      } else if (data.activity.type === NetworkActivityType.Allow) {
        transformed['outbound_network_activity'] = 'SPECIFIC';
        transformed['outbound_network_value'] = data.activity.activities;
      }
    }
    return transformed;
  }

  clean(data: any): any {
    data.hosts = data.hosts.length > 0 ? data.hosts.join('\n') : '';
    data['service_announcement'] = {
      netbios: data['netbios'],
      mdns: data['mdns'],
      wsd: data['wsd'],
    };
    delete data['netbios'];
    delete data['mdns'];
    delete data['wsd'];

    return data;
  }

  submitFunction(body: NetworkConfigurationUpdate): Observable<NetworkConfiguration> {
    return this.ws.call('network.configuration.update', [body]);
  }

  beforeSubmit(data: any): void {
    if (
      data['outbound_network_activity'] === NetworkActivityType.Allow
      || data['outbound_network_activity'] === NetworkActivityType.Deny
    ) {
      data['activity'] = { type: data['outbound_network_activity'], activities: [] };
    } else {
      data['activity'] = { type: NetworkActivityType.Allow, activities: data['outbound_network_value'] };
    }
    delete data['outbound_network_activity'];
    delete data['outbound_network_value'];
  }
}
