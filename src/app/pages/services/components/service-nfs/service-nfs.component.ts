import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-nfs';

@Component({
  selector: 'nfs-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceNFSComponent {
  protected resource_name: string = 'services/nfs';
  protected route_success: string[] = ['services'];
  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'nfs_srv_servers',
      placeholder: helptext.nfs_srv_servers_placeholder,
      tooltip: helptext.nfs_srv_servers_tooltip,
      required: true,
      validation : helptext.nfs_srv_servers_validation
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_udp',
      placeholder: helptext.nfs_srv_udp_placeholder,
      tooltip: helptext.nfs_srv_udp_tooltip,
    },
    {
      type: 'select',
      name: 'nfs_srv_bindip',
      placeholder: helptext.nfs_srv_bindip_placeholder,
      tooltip: helptext.nfs_srv_bindip_tooltip,
      options: [],
      multiple: true
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_allow_nonroot',
      placeholder: helptext.nfs_srv_allow_nonroot_placeholder,
      tooltip: helptext.nfs_srv_allow_nonroot_tooltip,
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_v4',
      placeholder: helptext.nfs_srv_v4_placeholder,
      tooltip: helptext.nfs_srv_v4_tooltip,
      value: false,
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_v4_v3owner',
      placeholder: helptext.nfs_srv_v4_v3owner_placeholder,
      tooltip: helptext.nfs_srv_v4_v3owner_tooltip,
      relation: helptext.nfs_srv_v4_v3owner_relation,
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_v4_krb',
      placeholder: helptext.nfs_srv_v4_krb_placeholder,
      tooltip: helptext.nfs_srv_v4_krb_tooltip,
    },
    {
      type: 'input',
      name: 'nfs_srv_mountd_port',
      placeholder: helptext.nfs_srv_mountd_port_placeholder,
      tooltip: helptext.nfs_srv_mountd_port_tooltip,
    },
    {
      type: 'input',
      name: 'nfs_srv_rpcstatd_port',
      placeholder: helptext.nfs_srv_rpcstatd_port_placeholder,
      tooltip: helptext.nfs_srv_rpcstatd_port_tooltip,
    },
    {
      type: 'input',
      name: 'nfs_srv_rpclockd_port',
      placeholder: helptext.nfs_srv_rpclockd_port_placeholder,
      tooltip: helptext.nfs_srv_rpclockd_port_tooltip,
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_16',
      placeholder: helptext.nfs_srv_16_placeholder,
      tooltip: helptext.nfs_srv_16_tooltip,
      relation: helptext.nfs_srv_16_relation,
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_mountd_log',
      placeholder: helptext.nfs_srv_mountd_log_placeholder,
      tooltip: helptext.nfs_srv_mountd_log_tooltip,
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_statd_lockd_log',
      placeholder: helptext.nfs_srv_statd_lockd_log_placeholder,
      tooltip: helptext.nfs_srv_statd_lockd_log_tooltip,
    },
  ];

  private nfs_srv_bindip: any;
  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
  ) {}

  afterInit(entityForm: any) {
    this.ws.call('notifier.choices', ['IPChoices']).subscribe((res) => {
      this.nfs_srv_bindip = _.find(this.fieldConfig, { name: 'nfs_srv_bindip' });
      for (let item of res) {
        this.nfs_srv_bindip.options.push({ label: item[0], value: item[1] });
      }
    });

    entityForm.formGroup.controls['nfs_srv_16'].valueChanges.subscribe((res)=> {
      if (entityForm.formGroup.controls['nfs_srv_v4'].value) {
        if (res) {
          if (entityForm.formGroup.controls['nfs_srv_v4_v3owner'].enabled) {
            entityForm.formGroup.controls['nfs_srv_v4_v3owner'].disable();
          }
        } else {
          if (entityForm.formGroup.controls['nfs_srv_v4_v3owner'].disabled) {
            entityForm.formGroup.controls['nfs_srv_v4_v3owner'].enable();
          }
        }
      }
    });
  }

}
