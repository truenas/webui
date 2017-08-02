import {Component, ViewContainerRef} from '@angular/core';
import {Router} from '@angular/router';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-afp-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AFPFormComponent {

  protected route_success: string[] = [ 'sharing', 'afp' ];
  protected resource_name: string = 'sharing/afp/';
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'afp_name',
      placeholder: 'Name',
    },
    {
      type : 'explorer',
      initial: '/mnt',
      name: 'afp_path',
      placeholder: 'Path',
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _state: GlobalState) {}
}
