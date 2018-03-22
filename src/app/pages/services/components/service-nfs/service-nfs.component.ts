import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';


import {
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'nfs-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceNFSComponent{
  protected resource_name: string = 'services/nfs';
  protected route_success: string[] = [ 'services' ];
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'nfs_srv_servers',
      placeholder : T('Number of servers:'),
      tooltip: T('Specifies how many servers to create. The number of\
       servers can be increased if NFS client responses are slow; to limit\
       CPU context switching, keep this number less than or equal to the\
       number of CPUs reported by <b> sysctl -n kern.smp.cpus </b>.'),
    },
    {
      type : 'checkbox',
      name : 'nfs_srv_udp',
      placeholder : T('Serve UDP NFS clients:'),
      tooltip: T('Checks if NFS clients need to use UDP.'),
    },
    {
      type : 'select',
      name : 'nfs_srv_bindip',
      placeholder : T('Bind IP Addresses:'),
      tooltip: T('Select the IP addresses to listen to for NFS requests.\
       When unchecked, NFS listens on all available addresses.'),
      options : [],
      multiple : true
    },
    {
      type : 'checkbox',
      name : 'nfs_srv_allow_nonroot',
      placeholder : T('Allow non-root mount:'),
      tooltip: T('Check this box only if the NFS client requires it.\
       When checked non-root mount requests are allowed to be served.'),
    },
    {
      type : 'checkbox',
      name : 'nfs_srv_v4',
      placeholder : T('Enable NFSv4:'),
      tooltip: T('NFSv3 is the default, check this box to switch to NFSv4.'),
    },
    {
      type : 'checkbox',
      name : 'nfs_srv_v4_v3owner',
      placeholder : T('NFSv3 ownership model for NFSv4:'),
      tooltip: T('Grayed out unless <b>Enable NFSv4 </b> is checked and, in turn, will\
       gray out <b>Support>16</b> groups which is incompatible; check this box if\
       NFSv4 ACL support is needed without requiring the client and the\
       server to sync users and groups.'),
      relation : [
        {
          action : 'DISABLE',
          when : [ {
            name : 'nfs_srv_16',
            value : true,
          } ]
        },
      ],
    },
    {
      type : 'checkbox',
      name : 'nfs_srv_v4_krb',
      placeholder : T('Require Kerberos for NFSv4:'),
      tooltip: T('When checked, NFS shares will fail if the Kerberos ticket is unavailable.'),
    },
    {
      type : 'input',
      name : 'nfs_srv_mountd_port',
      placeholder : T('mountd(8) bind port:'),
      tooltip: T('Optional; specify port that <a href="https://www.freebsd.org/cgi/man.cgi?query=mountd" target="_blank">mountd(8)</a>\
       binds to.'),
    },
    {
      type : 'input',
      name : 'nfs_srv_rpcstatd_port',
      placeholder : T('rpc.statd(8) bind port:'),
      tooltip: T('Optional; specify port that <a href="https://www.freebsd.org/cgi/man.cgi?query=rpc.statd" target="_blank">rpc.statd(8)</a>\
       binds to.'),
    },
    {
      type : 'input',
      name : 'nfs_srv_rpclockd_port',
      placeholder : T('rpc.lockd(8) bind port:'),
      tooltip: T('Optional; specify port that <a href="https://www.freebsd.org/cgi/man.cgi?query=rpc.lockd" target="_blank">rpc.lockd(8)</a>\
       binds to.'),
    },
    {
      type : 'checkbox',
      name : 'nfs_srv_16',
      placeholder : T('Support >16 groups:'),
      tooltip: T('Check this box if any users are members of more than\
       16 groups (useful in AD environments); note that this assumes that\
       group membership has been configured correctly on the NFS server.'),
    },
    {
      type : 'checkbox',
      name : 'nfs_srv_mountd_log',
      placeholder : T('Log mountd(8) requests:'),
      tooltip: T('Enable logging of <a href="https://www.freebsd.org/cgi/man.cgi?query=mountd" target="_blank">mountd(8)</a>\
       requests by syslog.'),
    },
    {
      type : 'checkbox',
      name : 'nfs_srv_statd_lockd_log',
      placeholder : T('Log rpc.statd(8) and rpc.lockd(8)'),
      tooltip: T('Enable logging of <a href="https://www.freebsd.org/cgi/man.cgi?query=rpc.statd" target="_blank">rpc.statd(8)</a>\
       and <a href="https://www.freebsd.org/cgi/man.cgi?query=rpc.lockd" target="_blank">rpc.lockd(8)</a>\
       requests by syslog.'),
    },
  ];

  private nfs_srv_bindip: any;
  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              ) {}

  afterInit(entityForm: any) {
    this.ws.call('notifier.choices', [ 'IPChoices' ]).subscribe((res) => {
      this.nfs_srv_bindip = _.find(this.fieldConfig, {name : 'nfs_srv_bindip'});
      for (let item of res) {
        this.nfs_srv_bindip.options.push({label: item[0], value: item[1]});
      }
    });
  }

}
