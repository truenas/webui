import {Component, ViewContainerRef} from '@angular/core';
import {Router} from '@angular/router';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-nfs-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class NFSFormComponent {

  protected route_success: string[] = [ 'sharing', 'nfs' ];
  protected resource_name: string = 'sharing/nfs/';
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'nfs_comment',
      placeholder: 'Comment',
    },
    {
      type: 'input',
      name : 'path',
      placeholder : 'Path',
    },
    {
      type: 'textarea',
      name : 'nfs_network',
      placeholder : 'Network',
    },
    {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: 'Hosts',
    },
    {
      type: 'checkbox',
      name: 'nfs_alldirs',
      placeholder: 'All dirs',
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _state: GlobalState) {}

  clean(data) {
    data.nfs_paths = [ data.path ];
    delete data.path;
    return data;
  }
}
