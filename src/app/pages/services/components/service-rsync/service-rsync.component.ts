import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {NG_VALIDATORS} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'rsync-edit',
  template : ` 
  <mat-tab-group>
  <mat-tab label="configure">
  <entity-form [conf]="this"></entity-form>
  </mat-tab>
  </mat-tab-group>
  `
})

export class ServiceRSYNCComponent {
  protected resource_name: string = 'services/rsyncd';
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
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) { }
}
