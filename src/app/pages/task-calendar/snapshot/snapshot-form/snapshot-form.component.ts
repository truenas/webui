import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup, Validators } from '@angular/forms';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'cron-snapshot-task-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class SnapshotFormComponent {

  protected resource_name: string = 'storage/task';
  protected route_success: string[] = ['tasks', 'snapshot'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
    type: 'select',
    name: 'task_filesystem',
    placeholder: T('Volume/Dataset'),
    tooltip: T('Select an existing ZFS volume, dataset, or zvol.'),
    options: [],
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'checkbox',
    name: 'task_recursive',
    placeholder: T('Recursive'),
    tooltip: T('Set this to enable taking separate snapshots of the\
                pool/dataset and each of its child datasets. Leave\
                unset to take a single snapshot of the specified\
                pool/dataset with <b>no</b> child datasets.'),
  }, {
    placeholder: T('Snapshot Lifetime'),
    tooltip: T('Define a length of time to retain the snapshot on this\
                system. A replicated snapshot is not removed from the\
                receiving system when the lifetime expires.'),
    type: 'input',
    name: 'task_ret_count',
    inputType: 'number',
    class: 'inline',
    value: 2,
    validation: [Validators.min(0)]
  }, {
    type: 'select',
    name: 'task_ret_unit',
    options: [{
      label: 'Hour(s)',
      value: 'hour',
    }, {
      label: 'Day(s)',
      value: 'day',
    }, {
      label: 'Week(s)',
      value: 'week',
    }, {
      label: 'Month(s)',
      value: 'month',
    }, {
      label: 'Year(s)',
      value: 'year',
    }],
    value: 'week',
    class: 'inline',
  }, {
    type: 'select',
    name: 'task_begin',
    placeholder: T('Begin'),
    tooltip: T('Choose the hour and minute when the system can begin\
                taking snapshots.'),
    options: [],
    value: '',
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'task_end',
    placeholder: T('End'),
    tooltip: T('Choose the hour and minute when the system must stop\
                taking snapshots.'),
    options: [],
    value: '',
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'task_interval',
    placeholder: T('Interval'),
    tooltip: T('Define how often the system takes snapshots between the\
                <b>Begin</b> and <b>End</b> times.'),
    options: [],
    value: '',
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'select',
    name: 'task_byweekday',
    placeholder: T('Day of week'),
    tooltip: T('Choose the days of the week to take snapshots.'),
    multiple: true,
    options: [{
      label: 'Monday',
      value: '1',
    }, {
      label: 'Tuesday',
      value: '2',
    }, {
      label: 'Wednesday',
      value: '3',
    }, {
      label: 'Thursday',
      value: '4',
    }, {
      label: 'Friday',
      value: '5',
    }, {
      label: 'Saturday',
      value: '6',
    }, {
      label: 'Sunday',
      value: '7',
    }],
    value: ['1', '2', '3', '4', '5'],
    required: true,
    validation : [ Validators.required ]
  }, {
    type: 'checkbox',
    name: 'task_enabled',
    placeholder: T('Enabled'),
    tooltip: T('Unset to disable this task without deleting it.'),
    value: true,
  }];

  protected filesystem_field: any;
  protected byweekday_field: any;
  protected interval_field: any;
  protected begin_field: any;
  protected end_field: any;

  constructor(protected router: Router, protected taskService: TaskService, protected userService: UserService, protected entityFormService: EntityFormService, ) {
    this.filesystem_field = _.find(this.fieldConfig, { 'name': 'task_filesystem' });
    this.taskService.getVolumeList().subscribe((res) => {
      res.data.forEach((item) => {
        let volume_list = new EntityUtils().flattenData(item.children);
        for (let i in volume_list) {
          this.filesystem_field.options.push({ label: volume_list[i].path, value: volume_list[i].path });
        }
      })
    });

    this.interval_field = _.find(this.fieldConfig, { 'name': 'task_interval' });
    this.taskService.getTaskInterval().subscribe((res) => {
      res.forEach((item) => {
        this.interval_field.options.push({ label: item[1], value: item[0] });
      });
    });

    this.begin_field = _.find(this.fieldConfig, { 'name': 'task_begin' });
    this.end_field = _.find(this.fieldConfig, { 'name': 'task_end' });
    let time_options = this.taskService.getTimeOptions();
    for (let i = 0; i < time_options.length; i++) {
      this.begin_field.options.push({ label: time_options[i].label, value: time_options[i].value });
      this.end_field.options.push({ label: time_options[i].label, value: time_options[i].value });
    }
  }

}
