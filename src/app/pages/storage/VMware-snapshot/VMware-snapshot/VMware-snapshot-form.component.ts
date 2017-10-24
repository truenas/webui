import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
   selector : 'vmware-snapshot-form',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class VMwareSnapshotFormComponent {

  protected resource_name: string = 'storage/snapshot';
  protected route_success: string[] = [ 'storage', 'volumes' ];
  protected isEntity: boolean = true;
  protected isNew: boolean = true;
  protected pk: any;

  protected fieldConfig: FieldConfig[];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => { 
      this.pk = params['pk'];
      this.fieldConfig = [
        {
          type: 'input', 
          name: 'hostname', 
          placeholder: 'Hostname',
        },
        {
          type: 'input', 
          name: 'username', 
          placeholder: 'Username',
        },
        {
          type: 'input', 
          name: 'password', 
          placeholder: 'Password',
          inputType: 'password'
        },
        {
          type: 'explorer', 
          name: 'filesystem', 
          placeholder: 'ZFS Filesystem',
          initial: '/mnt'
        },
        {
          type: 'select', 
          name: 'datastore', 
          placeholder: 'Datastore',
        },
      ];
    });
  }
}
