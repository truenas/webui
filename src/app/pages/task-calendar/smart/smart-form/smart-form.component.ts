import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { EntityTaskComponent } from '../../../common/entity/entity-task';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, StorageService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup, Validators } from '@angular/forms';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'smart-test-add',
  template: `<entity-task [conf]="this"></entity-task>`,
  providers: [TaskService, StorageService, EntityFormService]
})
export class SmartFormComponent {

  protected resource_name: string = 'tasks/smarttest';
  protected route_success: string[] = ['tasks', 'smart'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  protected preTaskName: string = 'smarttest';
  public fieldConfig: FieldConfig[] = [{
      type: 'select',
      name: 'smarttest_disks',
      placeholder: T('Disks'),
      tooltip : T('Select the disks to monitor.'),
      options: [],
      multiple: true,
      required: true,
      validation : [ Validators.required ]
    }, {
      type: 'select',
      name: 'smarttest_type',
      placeholder: T('Type'),
      tooltip : T('Choose the test type. See <a\
                   href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
                   target="_blank">smartctl(8)</a> for descriptions of\
                   each type. Some types will degrade performance or\
                   take disks offline. Avoid scheduling S.M.A.R.T. tests\
                   simultaneously with scrub or resilver operations.'),
      options: [],
      required: true,
      validation : [ Validators.required ]
    }, {
      type: 'input',
      name: 'smarttest_desc',
      placeholder: T('Short description'),
      tooltip : T('Optional. Describe this test.'),
    },
    {
      type: 'select',
      name: 'smarttest_repeat',
      placeholder: T('Quick Schedule'),
      tooltip: T('Choose how often to run the task. Choose the\
                  empty value to define a custom schedule.'),
      options: [
        { label: '----------', value: 'none' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
      value: 'once',
    },
    {
      type: 'input',
      name: 'smarttest_hour',
      placeholder: T('Hour'),
      tooltip: T('Define the hour to run the test.'),
      value: '*',
      isHidden: false,
    },
    {
      type: 'input',
      name: 'smarttest_daymonth',
      placeholder: T('Day of month'),
      tooltip: T('Define the day of the month to run the test.'),
      value: '*',
      isHidden: false,
    },
    {
      type: 'select',
      name: 'smarttest_month',
      placeholder: T('Month'),
      tooltip: T('Define which months to run the test.'),
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
    },
    {
      type: 'select',
      name: 'smarttest_dayweek',
      placeholder: T('Day of week'),
      tooltip: T('Choose which days of the week to run the test.'),
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
      value: ['1', '2', '3', '4', '5', '6', '7'],
      isHidden: false,
    }
  ];

  protected disk_field: any;
  protected type_field: any;
  protected month_field: any;
  protected day_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  constructor(protected router: Router, protected taskService: TaskService, protected storageService: StorageService, protected entityFormService: EntityFormService, ) {
    this.disk_field = _.find(this.fieldConfig, { 'name': 'smarttest_disks' });
    this.storageService.listDisks().subscribe((res) => {
      for (let i = 0; i < res.data.length; i++) {
        this.disk_field.options.push({ label: res.data[i].disk_name, value: '{devicename}' + res.data[i].disk_name })
      }
    });

    this.type_field = _.find(this.fieldConfig, { 'name': 'smarttest_type' });
    this.taskService.getSmarttestTypeChoices().subscribe((res) => {
      res.forEach((item) => {
        this.type_field.options.push({ label: item[1], value: item[0] });
      });
    });
  }
}
