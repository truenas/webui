import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef,
  ElementRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { ReplicationService } from 'app/pages/task-calendar/replication/replication.service';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { ReplicationAddComponent } from 'app/pages/task-calendar/replication/replication-add';

@Component({
  selector: 'app-replication-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class ReplicationEditComponent extends ReplicationAddComponent {

  

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected replicationService: ReplicationService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef
  ) {
    super(router, route, rest, ws, replicationService, _injector, _appRef);
    this.isNew = false;
  }
}
