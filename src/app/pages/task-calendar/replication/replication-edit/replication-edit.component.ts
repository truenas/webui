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
  protected route_success: string[] = [ 'tasks', 'replication'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'task_filesystem',
      placeholder: 'Volume/Dataset',
    },
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
      placeholder : 'Begin'
    }, {
      type: 'task',
      name: 'task_begin',
      placeholder: 'Hour',
      tabs: [{
        type: 'slider',
        name: 'task_begin_slider',
        tabName: 'Every N hour',
        min: 1,
        max: 12,
      }, {
        type: 'togglebutton',
        name: 'task_begin_togglebutton',
        tabName: 'Each selected hour',
        options: []
      }]
    },
    {
      type : 'input',
      name : 'task_end',
      placeholder : 'End'
    }, {
      type: 'task',
      name: 'task_end',
      placeholder: 'Hour',
      tabs: [{
        type: 'slider',
        name: 'task_end_slider',
        tabName: 'Every N hour',
        min: 1,
        max: 12,
      }, {
        type: 'togglebutton',
        name: 'task_end_togglebutton',
        tabName: 'Each selected hour',
        options: []
      }]
    },
    {
      type: 'togglebutton',
      name: 'task_byweekday',
      placeholder: 'Day of week',
      multiple: true,
      options: []
    },
    {
      type: 'input',
      name: 'task_interval',
      placeholder: 'task_interval',
    },
    {
      type: 'checkbox',
      name: 'task_recursive',
      placeholder: 'Recursively replicate child dataset snapshots',
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
