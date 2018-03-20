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
import {Subscription} from 'rxjs';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

import * as _ from 'lodash';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'snapshot-clone',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class SnapshotCloneComponent {

  protected resource_name: string = 'storage/snapshot';
  protected route_success: string[] = [ 'storage', 'volumes' ];
  protected route_cancel: string[] = [ 'storage', 'snapshots' ];
  protected pk: any;
  protected isEntity: boolean = true;
  protected isNew: boolean = true;

  public fieldConfig: FieldConfig[];

  get custom_add_query(): string { 
    return this.resource_name + '/' + this.pk + '/clone/'
  }

  @ViewChildren('component') components;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.fieldConfig = 
        [
          {
            type: 'input',
            name: 'name',
            placeholder: 'Name',
            tooltip: T('Enter a name for the cloned snapshot.'),
            value: this.pk.replace("@", "/") + "-clone"
          }
        ];
    });
  }
}
