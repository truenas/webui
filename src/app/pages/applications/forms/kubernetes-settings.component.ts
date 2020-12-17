import { Component } from '@angular/core';
import * as _ from 'lodash';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from 'app/services/modal.service';
import  helptext  from '../../../helptext/apps/apps';
import { ApplicationsService } from '../applications.service';

@Component({
  selector: 'app-kubernetes-settings',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class KubernetesSettingsComponent {
  protected queryCall: string = 'kubernetes.config';
  protected editCallJob: string = 'kubernetes.update';
  private title = helptext.kubForm.title;
  private entityEdit: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: 'kubernetes_settings',
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'pool',
          placeholder: helptext.kubForm.pool.placeholder,
          tooltip: helptext.kubForm.pool.tooltip,
          options: [],
          required: true,
        },
        {
          type: 'input',
          name: 'cluster_cidr',
          placeholder: helptext.kubForm.cluster_cidr.placeholder,
          tooltip: helptext.kubForm.cluster_cidr.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'service_cidr',
          placeholder: helptext.kubForm.service_cidr.placeholder,
          tooltip: helptext.kubForm.service_cidr.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'cluster_dns_ip',
          placeholder: helptext.kubForm.cluster_dns_ip.placeholder,
          tooltip: helptext.kubForm.cluster_dns_ip.tooltip,
          required: true,
        },
        {
          type: 'select',
          name: 'node_ip',
          placeholder: helptext.kubForm.node_ip.placeholder,
          tooltip: helptext.kubForm.node_ip.tooltip,
          options: [],
          // isHidden: true,
        }
      ]
    },{
      name: 'interfaces',
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'route_v4_interface',
          placeholder: helptext.kubForm.route_v4_interface.placeholder,
          tooltip: helptext.kubForm.route_v4_interface.tooltip,
          options: [{ label: '---', value: null}],
          required: true,
        },
        {
          type: 'input',
          name: 'route_v4_gateway',
          placeholder: helptext.kubForm.route_v4_gateway.placeholder,
          tooltip: helptext.kubForm.route_v4_gateway.tooltip,
          required: true,
        }
      ]
    },
  ]

  constructor(private modalService: ModalService, private appService: ApplicationsService) { }

  preInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    const pool_control = _.find(this.fieldSets[0].config, {'name' : 'pool'});
    this.appService.getPoolList().subscribe(pools => {
      pools.forEach(pool => {
        pool_control.options.push({ label: pool.name, value: pool.name })
      })
    })
    const node_ip_control = _.find(this.fieldSets[0].config, {'name' : 'node_ip'});
    this.appService.getBindIPChoices().subscribe(ips => {
      for (let ip in ips) {
        node_ip_control.options.push({ label: ip, value: ip });
      }
    })
    const v4_interface_control = _.find(this.fieldSets[1].config, {'name' : 'route_v4_interface'});
    this.appService.getInterfaces().subscribe(interfaces => {
      interfaces.forEach(i => {
        v4_interface_control.options.push({ label: i.name, value: i.name });
      })
    })
  }

  beforeSubmit(data) {
  }
}
