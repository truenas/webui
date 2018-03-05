import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { EntityFormComponent } from '../../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../../common/entity/entity-form/models/field-config.interface';
import {WebSocketService} from "../../../../../../services/ws.service";
import {RestService} from "../../../../../../services/rest.service";

@Component({
  selector : 'app-configure-rsync',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class CconfigureRYSNCComponent {
  protected resource_name = 'services/rsyncd';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'rsyncd_port',
      placeholder : 'TCP Port',
      tooltip: 'Port for <b>rsyncd</b> to listen on. Default is\
 <i>873</i>.',
    },
    {
      type : 'textarea',
      name : 'rsyncd_auxiliary',
      placeholder : 'Auxiliary parameters',
      tooltip: 'Additional parameter from\
 <a href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
 target="_blank">rsyncd.conf(5)</a>.',
    },
  ]

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              ) {}

  afterInit(entityEdit: any) { }
}