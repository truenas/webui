import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-nfs';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';

@Component({
  selector: 'nfs-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceNFSComponent {
  protected queryCall = 'nfs.config';
  protected route_success: string[] = ['services'];
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.nfs_srv_fieldset_general,
      label: true,
      config: [
        {
          type: 'input',
          name: 'servers',
          placeholder: helptext.nfs_srv_servers_placeholder,
          tooltip: helptext.nfs_srv_servers_tooltip,
          required: true,
          validation : helptext.nfs_srv_servers_validation
        },
        {
          type: 'select',
          name: 'bindip',
          placeholder: helptext.nfs_srv_bindip_placeholder,
          tooltip: helptext.nfs_srv_bindip_tooltip,
          options: [],
          multiple: true
        }
      ]
    },
    {
      name: 'divider',
      divider: true
    },
    {
      name: helptext.nfs_srv_fieldset_v4,
      label: true,
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'v4',
          placeholder: helptext.nfs_srv_v4_placeholder,
          tooltip: helptext.nfs_srv_v4_tooltip,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'v4_v3owner',
          placeholder: helptext.nfs_srv_v4_v3owner_placeholder,
          tooltip: helptext.nfs_srv_v4_v3owner_tooltip,
          relation: helptext.nfs_srv_v4_v3owner_relation,
        },
        {
          type: 'checkbox',
          name: 'v4_krb',
          placeholder: helptext.nfs_srv_v4_krb_placeholder,
          tooltip: helptext.nfs_srv_v4_krb_tooltip,
        }
      ]
    },
    {
      name: helptext.nfs_srv_fieldset_ports,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'mountd_port',
          placeholder: helptext.nfs_srv_mountd_port_placeholder,
          tooltip: helptext.nfs_srv_mountd_port_tooltip,
        },
        {
          type: 'input',
          name: 'rpcstatd_port',
          placeholder: helptext.nfs_srv_rpcstatd_port_placeholder,
          tooltip: helptext.nfs_srv_rpcstatd_port_tooltip,
        },
        {
          type: 'input',
          name: 'rpclockd_port',
          placeholder: helptext.nfs_srv_rpclockd_port_placeholder,
          tooltip: helptext.nfs_srv_rpclockd_port_tooltip,
        }
      ]
    },
    {
      name: 'divider',
      divider: true
    },
    {
      name: helptext.nfs_srv_fieldset_other,
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'udp',
          placeholder: helptext.nfs_srv_udp_placeholder,
          tooltip: helptext.nfs_srv_udp_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_nonroot',
          placeholder: helptext.nfs_srv_allow_nonroot_placeholder,
          tooltip: helptext.nfs_srv_allow_nonroot_tooltip,
        },
        
        {
          type: 'checkbox',
          name: 'userd_manage_gids',
          placeholder: helptext.nfs_srv_16_placeholder,
          tooltip: helptext.nfs_srv_16_tooltip,
          relation: helptext.nfs_srv_16_relation,
        },
        {
          type: 'checkbox',
          name: 'mountd_log',
          placeholder: helptext.nfs_srv_mountd_log_placeholder,
          tooltip: helptext.nfs_srv_mountd_log_tooltip,
        },
        {
          type: 'checkbox',
          name: 'statd_lockd_log',
          placeholder: helptext.nfs_srv_statd_lockd_log_placeholder,
          tooltip: helptext.nfs_srv_statd_lockd_log_tooltip,
        }
      ]
    },
    {
      name: 'divider',
      divider: true
    }
  ];

  private nfs_srv_bindip: any;
  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
  ) {}

  afterInit(entityForm: EntityFormComponent) {
    entityForm.submitFunction = body => this.ws.call('nfs.update', [body]);

    this.ws.call('notifier.choices', ['IPChoices']).subscribe((res) => {
      this.nfs_srv_bindip =
        _.find(this.fieldSets, { name: helptext.nfs_srv_fieldset_general }).config.find(config => config.name === 'bindip');
      for (const item of res) {
        this.nfs_srv_bindip.options.push({ label: item[0], value: item[1] });
      }
    });

    entityForm.formGroup.controls['userd_manage_gids'].valueChanges.subscribe((res)=> {
      if (entityForm.formGroup.controls['v4'].value) {
        if (res) {
          if (entityForm.formGroup.controls['v4_v3owner'].enabled) {
            entityForm.formGroup.controls['v4_v3owner'].disable();
          }
        } else {
          if (entityForm.formGroup.controls['v4_v3owner'].disabled) {
            entityForm.formGroup.controls['v4_v3owner'].enable();
          }
        }
      }
    });
  }

}
