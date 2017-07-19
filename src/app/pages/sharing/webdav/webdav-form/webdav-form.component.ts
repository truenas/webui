import {Placeholder} from '@angular/compiler/src/i18n/i18n_ast';
import {ApplicationRef, Component, Injector} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-user-form',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class WebdavFormComponent {
    protected resource_name: string = 'sharing/webdav';
    protected route_success: string[] = [ 'sharing', 'webdav' ];
    protected isEntity: boolean = true;

    public busy: Subscription;
    public sub: Subscription;

    public fieldConfig: FieldConfig[] = [
      {
        type : 'input',
        name : 'webdav_name',
        placeholder : 'Share Name',
      },
      {
        type : 'input',
        name : 'webdav_comment',
        placeholder : 'Comment',
      },
      {
        type : 'input',
        name : 'webdav_path',
        placeholder : 'Path',
      },
      {
        type : 'checkbox',
        name : 'webdav_ro',
        placeholder : 'Read Only',
      },
      {
        type : 'checkbox',
        name : 'webdav_perm',
        placeholder : 'Change User & Group Ownership',
      },
    ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}
}

