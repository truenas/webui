import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { EntityTaskComponent } from '../../../common/entity/entity-task';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup, Validators } from '@angular/forms';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'scrub-task-add',
  template: `<entity-task [conf]="this"></entity-task>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class ScrubFormComponent {

  protected resource_name: string = 'storage/scrub';
  protected route_success: string[] = ['tasks', 'scrub'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  protected preTaskName: string = 'scrub';
  public fieldConfig: FieldConfig[] = [{
      type: 'select',
      name: 'scrub_volume',
      placeholder: T('Pool'),
      tooltip : T('Choose a pool to scrub.'),
      options: [],
      required: true,
      validation : [ Validators.required ],
    }, {
      type: 'input',
      inputType: 'number',
      name: 'scrub_threshold',
      placeholder: T('Threshold days'),
      tooltip: T('Define the number of days to prevent a scrub from\
                  running after the last has completed. This ignores any\
                  other calendar schedule. The default is a multiple of\
                  7 to ensure the scrub always occurs on the same\
                  weekday.'),
      value: 35,
      min: 0,
      required: true,
      validation: [ Validators.min(0), Validators.required ]
    }, {
      type: 'input',
      name: 'scrub_description',
      placeholder: T('Description'),
      tooltip : T('Describe the scrub task.'),
    }, {
      type: 'select',
      name: 'scrub_repeat',
      placeholder: T('Quick Schedule'),
      tooltip: T('Choose how often to run the task. Choose the\
                  empty value to define a custom schedule.'),
      options: [
        { label: '----------', value: 'none' },
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
      value: 'once',
    }, {
      type: 'input',
      name: 'scrub_minute',
      placeholder: T('Minute'),
      tooltip : T('Define the minute to run the task.'),
      value: '*',
      isHidden: false,
    }, {
      type: 'input',
      name: 'scrub_hour',
      placeholder: T('Hour'),
      tooltip : T('Define the hour to run the task.'),
      value: '*',
      isHidden: false,
    }, {
      type: 'input',
      name: 'scrub_daymonth',
      placeholder: T('Day of month'),
      tooltip : T('Define the day of the month to run the task.'),
      value: '*',
      isHidden: false,
    }, {
      type: 'select',
      name: 'scrub_month',
      placeholder: T('Month'),
      tooltip : T('Define which months to run the task.'),
      multiple: true,
      options: [{
        label: 'January',
        value: '1',
      }, {
        label: 'February',
        value: '2',
      }, {
        label: 'March',
        value: '3',
      }, {
        label: 'April',
        value: '4',
      }, {
        label: 'May',
        value: '5',
      }, {
        label: 'June',
        value: '6',
      }, {
        label: 'July',
        value: '7',
      }, {
        label: 'August',
        value: '8',
      }, {
        label: 'September',
        value: '9',
      }, {
        label: 'October',
        value: '10',
      }, {
        label: 'November',
        value: '11',
      }, {
        label: 'December',
        value: '12',
      }],
      value: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      isHidden: false,
    }, {
      type: 'select',
      name: 'scrub_dayweek',
      placeholder: T('Day of week'),
      tooltip : T('Choose which days of the week to run the test. The\
                   default is Sunday to minimize user impact.'),
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
      value: ['7'],
      isHidden: false,
    }, {
      type: 'checkbox',
      name: 'scrub_enabled',
      placeholder: T('Enabled'),
      tooltip : T('Unset to disable the scheduled scrub without\
                   deleting it.'),
      value: true,
    }
  ];

  protected volume_field: any;
  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  constructor(protected router: Router, protected taskService: TaskService, protected userService: UserService, protected entityFormService: EntityFormService) {
  }

  preInit() {
    this.volume_field = _.find(this.fieldConfig, { 'name': 'scrub_volume' });
    this.taskService.getVolumeList().subscribe((res) => {
      res.data.forEach((item) => {
        this.volume_field.options.push({ label: item.vol_name, value: item.id });
      });
    });
  }
}
