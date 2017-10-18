import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-replication-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ReplicationEditComponent {

  protected resource_name = 'storage/task';
  protected route_success: string[] = [ 'storage', 'replication'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'interv',
      placeholder : 'interv'
    },
    {
      type: 'input',
      name: 'keepfor',
      placeholder: 'keepfor'
    },
    {
      type : 'input',
      name : 'task_begin',
      placeholder : 'task_begin'
    },
    {
      type : 'input',
      name : 'task_byweekday',
      placeholder : 'task_byweekday'
    },
    {
      type: 'input',
      name: 'task_end',
      placeholder: 'task_end',
    },
    {
      type: 'input',
      name: 'task_filesystem',
      placeholder: 'task_filesystem',
    },
    {
      type: 'input',
      name: 'task_interval',
      placeholder: 'task_interval',
    },
    {
      type: 'input',
      name: 'task_recursive',
      placeholder: 'task_recursive',
    },
    {
      type: 'input',
      name: 'task_repeat_unit',
      placeholder: 'task_repeat_unit',
    },
    {
      type: 'input',
      name: 'task_ret_count',
      placeholder: 'task_ret_count',
    },
    {
      type: 'input',
      name: 'task_ret_unit',
      placeholder: 'task_ret_unit',
    },
    {
      type: 'input',
      name: 'vmwaresync',
      placeholder: 'vmwaresync',
    },
    {
      type : 'checkbox',
      name : 'task_enabled',
      placeholder : 'task_enabled'
    }
  ];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {

  }

  afterInit(entityForm: any) {
  }
}
