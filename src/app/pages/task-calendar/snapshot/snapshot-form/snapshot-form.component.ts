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
import helptext from '../../../../helptext/task-calendar/snapshot/snapshot-form';


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
    placeholder: helptext.task_filesystem_placeholder,
    tooltip: helptext.task_filesystem_tooltip,
    options: [],
    required: true,
    validation : helptext.task_filesystem_validation
  }, {
    type: 'checkbox',
    name: 'task_recursive',
    placeholder: helptext.task_recursive_placeholder,
    tooltip: helptext.task_recursive_tooltip
  }, {
    placeholder: helptext.task_ret_count_placeholder,
    type: 'input',
    name: 'task_ret_count',
    inputType: 'number',
    class: 'inline',
    value: 2,
    validation: helptext.task_ret_count_validation
  }, {
    type: 'select',
    name: 'task_ret_unit',
    tooltip: helptext.task_ret_unit_tooltip,
    options: [{
      label: 'Hours',
      value: 'hour',
    }, {
      label: 'Days',
      value: 'day',
    }, {
      label: 'Weeks',
      value: 'week',
    }, {
      label: 'Months',
      value: 'month',
    }, {
      label: 'Years',
      value: 'year',
    }],
    value: 'week',
    class: 'inline',
  }, {
    type: 'select',
    name: 'task_begin',
    placeholder: helptext.task_begin_placeholder,
    tooltip: helptext.task_begin_tooltip,
    options: [],
    value: '',
    required: true,
    validation : helptext.task_begin_validation
  }, {
    type: 'select',
    name: 'task_end',
    placeholder: helptext.task_end_placeholder,
    tooltip: helptext.task_end_tooltip,
    options: [],
    value: '',
    required: true,
    validation : helptext.task_end_validation
  }, {
    type: 'select',
    name: 'task_interval',
    placeholder: helptext.task_interval_placeholder,
    tooltip: helptext.task_interval_tooltip,
    options: [],
    value: '',
    required: true,
    validation : helptext.task_interval_validation
  }, {
    type: 'select',
    name: 'task_byweekday',
    placeholder: helptext.task_byweekday_placeholder,
    tooltip: helptext.task_byweekday_tooltip,
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
    validation : helptext.task_byweekday_validation
  }, {
    type: 'checkbox',
    name: 'task_enabled',
    placeholder: helptext.task_enabled_placeholder,
    tooltip: helptext.task_enabled_tooltip,
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
      this.filesystem_field.options = _.sortBy(this.filesystem_field.options, [function(o) { return o.label; }]);
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
