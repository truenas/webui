import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren,
  AfterViewInit
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';
import { SnapshotAddComponent } from 'app/pages/storage/snapshots/snapshot-add';

@Component({
   selector : 'app-snapshot-edit',
   templateUrl : '../snapshot-add/snapshot-add.component.html'})

export class SnapshotEditComponent extends SnapshotAddComponent {
  
  protected sub: Subscription;
  protected pk: any;

  get custom_get_query(): string {
    return 'storage/snapshot?id=' + this.pk;
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {
                super(router, route, rest, ws, _injector, _appRef );

                this.isNew = false;
  }

  preInit(entityEdit: any) {
    this.sub = this.route.params.subscribe(params => {
      this.pk = params['pk'];
    });
  }
}
