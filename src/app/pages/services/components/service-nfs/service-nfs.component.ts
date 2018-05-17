import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { Validators } from '@angular/forms';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

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
      placeholder: T('Number of servers'),
      tooltip: T('Specify how many servers to create. Increase if NFS\
                  client responses are slow. Keep this less than or\
                  equal to the number of CPUs reported by <b>sysctl -n\
                  kern.smp.cpus</b> to limit CPU context switching.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_udp',
      placeholder: T('Serve UDP NFS clients'),
      tooltip: T('Set if NFS clients need to use UDP.'),
    },
    {
      type: 'select',
      name: 'nfs_srv_bindip',
      placeholder: T('Bind IP Addresses'),
      tooltip: T('Select IP addresses to listen to for NFS requests.\
                  Leave empty for NFS to listen to all available\
                  addresses.'),
      options: [],
      multiple: true
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_allow_nonroot',
      placeholder: T('Allow non-root mount'),
      tooltip: T('Set only if required by the NFS client. Set to allow\
                  serving non-root mount requests.'),
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_v4',
      placeholder: T('Enable NFSv4'),
      tooltip: T('Set to switch from NFSv3 to NFSv4.'),
      value: false,
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_v4_v3owner',
      placeholder: T('NFSv3 ownership model for NFSv4'),
      tooltip: T('Set when NFSv4 ACL support is needed without requiring\
                  the client and the server to sync users and groups.'),
      relation: [
      {
        action: 'DISABLE',
        when: [{
          name: 'nfs_srv_v4',
          value: false,
        }]
      }],
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_v4_krb',
      placeholder: T('Require Kerberos for NFSv4'),
      tooltip: T('Set to force NFS shares to fail if the Kerberos ticket\
                  is unavailable.'),
    },
    {
      type: 'input',
      name: 'nfs_srv_mountd_port',
      placeholder: T('mountd(8) bind port'),
      tooltip: T('Enter a port to bind <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=mountd"\
                  target="_blank">mountd(8)</a>.'),
    },
    {
      type: 'input',
      name: 'nfs_srv_rpcstatd_port',
      placeholder: T('rpc.statd(8) bind port'),
      tooltip: T('Enter a port to bind <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=rpc.statd"\
                  target="_blank">rpc.statd(8)</a>.'),
    },
    {
      type: 'input',
      name: 'nfs_srv_rpclockd_port',
      placeholder: T('rpc.lockd(8) bind port'),
      tooltip: T('Enter a port to bind <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=rpc.lockd"\
                  target="_blank">rpc.lockd(8)</a>.'),
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_16',
      placeholder: T('Support >16 groups'),
      tooltip: T('Set when a user is a member of more than 16 groups.\
                  This assumes group membership is configured correctly\
                  on the NFS server.'),
      relation: [{
        action: 'DISABLE',
        connective: 'AND',
        when: [{
          name: 'nfs_srv_v4',
          value: true,
        }, {
          name: 'nfs_srv_v4_v3owner',
          value: true,
        }]
      }],
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_mountd_log',
      placeholder: T('Log mountd(8) requests'),
      tooltip: T('Set to log <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=mountd"\
                  target="_blank">mountd(8)</a> syslog requests.'),
    },
    {
      type: 'checkbox',
      name: 'nfs_srv_statd_lockd_log',
      placeholder: T('Log rpc.statd(8) and rpc.lockd(8)'),
      tooltip: T('Set to log <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=rpc.statd"\
                  target="_blank">rpc.statd(8)</a> and <a\
                  href="https://www.freebsd.org/cgi/man.cgi?query=rpc.lockd"\
                  target="_blank">rpc.lockd(8)</a> syslog requests.'),
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
