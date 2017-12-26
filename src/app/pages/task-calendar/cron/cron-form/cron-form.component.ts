import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'cron-job-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [TaskService, UserService, EntityFormService]
})
export class CronFormComponent {

  protected resource_name: string = 'tasks/cronjob';
  protected route_success: string[] = ['tasks', 'cron'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  protected isBasicMode: boolean = true;
  private times = [
    {label : '00:00:00', value : '00:00:00'}, 
    {label : '00:15:00', value : '00:15:00'}, 
    {label : '00:30:00', value : '00:35:00'}, 
    {label : '00:45:00', value : '00:45:00'},
    {label : '01:00:00', value : '01:00:00'}, 
    {label : '01:15:00', value : '01:15:00'}, 
    {label : '01:30:00', value : '01:35:00'}, 
    {label : '01:45:00', value : '01:45:00'},
    {label : '02:00:00', value : '02:00:00'}, 
    {label : '02:15:00', value : '02:15:00'}, 
    {label : '02:30:00', value : '02:35:00'}, 
    {label : '02:45:00', value : '02:45:00'},
    {label : '03:00:00', value : '03:00:00'}, 
    {label : '03:15:00', value : '03:15:00'}, 
    {label : '03:30:00', value : '03:35:00'}, 
    {label : '03:45:00', value : '03:45:00'},
    {label : '04:00:00', value : '04:00:00'}, 
    {label : '04:15:00', value : '04:15:00'}, 
    {label : '04:30:00', value : '04:35:00'}, 
    {label : '04:45:00', value : '04:45:00'},
    {label : '05:00:00', value : '05:00:00'}, 
    {label : '05:15:00', value : '05:15:00'}, 
    {label : '05:30:00', value : '05:35:00'}, 
    {label : '05:45:00', value : '05:45:00'},
    {label : '06:00:00', value : '06:00:00'}, 
    {label : '06:15:00', value : '06:15:00'}, 
    {label : '06:30:00', value : '06:35:00'}, 
    {label : '06:45:00', value : '06:45:00'},
    {label : '07:00:00', value : '07:00:00'}, 
    {label : '07:15:00', value : '07:15:00'}, 
    {label : '07:30:00', value : '07:35:00'}, 
    {label : '07:45:00', value : '07:45:00'},
    {label : '08:00:00', value : '08:00:00'}, 
    {label : '08:15:00', value : '08:15:00'}, 
    {label : '08:30:00', value : '08:35:00'}, 
    {label : '08:45:00', value : '08:45:00'},
    {label : '09:00:00', value : '09:00:00'}, 
    {label : '09:15:00', value : '09:15:00'}, 
    {label : '09:30:00', value : '09:35:00'}, 
    {label : '09:45:00', value : '09:45:00'},
    {label : '10:00:00', value : '10:00:00'}, 
    {label : '10:15:00', value : '10:15:00'}, 
    {label : '10:30:00', value : '10:35:00'}, 
    {label : '10:45:00', value : '10:45:00'},
    {label : '11:00:00', value : '11:00:00'}, 
    {label : '11:15:00', value : '11:15:00'}, 
    {label : '11:30:00', value : '11:35:00'}, 
    {label : '11:45:00', value : '11:45:00'},
    {label : '12:00:00', value : '12:00:00'}, 
    {label : '12:15:00', value : '12:15:00'}, 
    {label : '12:30:00', value : '12:35:00'}, 
    {label : '12:45:00', value : '12:45:00'},
    {label : '13:00:00', value : '13:00:00'}, 
    {label : '13:15:00', value : '13:15:00'}, 
    {label : '13:30:00', value : '13:35:00'}, 
    {label : '13:45:00', value : '13:45:00'},
    {label : '14:00:00', value : '14:00:00'}, 
    {label : '14:15:00', value : '14:15:00'}, 
    {label : '14:30:00', value : '14:35:00'}, 
    {label : '14:45:00', value : '14:45:00'},
    {label : '15:00:00', value : '15:00:00'}, 
    {label : '15:15:00', value : '15:15:00'}, 
    {label : '15:30:00', value : '15:35:00'}, 
    {label : '15:45:00', value : '15:45:00'},
    {label : '16:00:00', value : '16:00:00'}, 
    {label : '16:15:00', value : '16:15:00'}, 
    {label : '16:30:00', value : '16:35:00'}, 
    {label : '16:45:00', value : '16:45:00'},
    {label : '17:00:00', value : '17:00:00'}, 
    {label : '17:15:00', value : '17:15:00'}, 
    {label : '17:30:00', value : '17:35:00'}, 
    {label : '17:45:00', value : '17:45:00'},
    {label : '18:00:00', value : '18:00:00'}, 
    {label : '18:15:00', value : '18:15:00'}, 
    {label : '18:30:00', value : '18:35:00'}, 
    {label : '18:45:00', value : '18:45:00'},
    {label : '19:00:00', value : '19:00:00'}, 
    {label : '19:15:00', value : '19:15:00'}, 
    {label : '19:30:00', value : '19:35:00'}, 
    {label : '19:45:00', value : '19:45:00'},
    {label : '20:00:00', value : '20:00:00'}, 
    {label : '20:15:00', value : '20:15:00'}, 
    {label : '20:30:00', value : '20:35:00'}, 
    {label : '20:45:00', value : '20:45:00'},
    {label : '21:00:00', value : '21:00:00'}, 
    {label : '21:15:00', value : '21:15:00'}, 
    {label : '21:30:00', value : '21:35:00'}, 
    {label : '21:45:00', value : '21:45:00'},
    {label : '22:00:00', value : '22:00:00'}, 
    {label : '22:15:00', value : '22:15:00'}, 
    {label : '22:30:00', value : '22:35:00'}, 
    {label : '22:45:00', value : '22:45:00'},
    {label : '23:00:00', value : '23:00:00'}, 
    {label : '23:15:00', value : '23:15:00'}, 
    {label : '23:30:00', value : '23:35:00'}, 
    {label : '23:45:00', value : '23:45:00'}
  ];

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'cron_description',
      placeholder: 'Description'
    },
    {
      type: 'input',
      name: 'cron_command',
      placeholder: 'Command',
    },
    {
      type: 'select',
      name: 'cron_user',
      placeholder: 'Run As User',
      options: [],
    },
    {
      type: 'input',
      name: 'cron_discard_output',
      placeholder: 'Discard Output'
    },
    {
      type: 'select',
      name: 'cron_time',
      placeholder: 'Time',
      options: this.times,
    },
    {
      type: 'datepicker',
      name: 'cron_date',
      placeholder: 'Date',
      readonly: true
    },
    {
      type: 'select',
      name: 'cron_repeat',
      placeholder: 'Repeat',
      options: [
        {label : 'Once(Do not Repeat)', value: 'Once'},
        {label : 'Hourly', value: 'Hourly'},
        {label : 'Daily', value: 'Daily'},
        {label : 'Weekly', value: 'Weekly'},
        {label : 'Monthly', value: 'Monthly'},
        {label : 'At Boot', value: 'At Boot'}
      ],
    },
    {
      type: 'select',
      name: 'cron_minute',
      placeholder: 'Minute',
      options: [],
    },
    {
      type: 'select',
      name: 'cron_hour',
      placeholder: 'Hour',
      options: [],
    },
    {
      type: 'select',
      name: 'cron_daymonth',
      placeholder: 'Day of month',
      options: [],
    },
    {
      type: 'select',
      name: 'cron_month',
      placeholder: 'Month',
      options: [],
    },
    {
      type: 'select',
      name: 'cron_dayweek',
      placeholder: 'Day of week',
      options: [],
    },
    {
      type: 'checkbox',
      name: 'cron_enabled',
      placeholder: 'Enable',
      value: true,
    }
  ];

  protected basic_field: Array<any> = [
    'cron_time',
    'cron_date',
    'cron_repeat'
  ];

  protected advanced_field: Array<any> = [
    'cron_minute',
    'cron_hour',
    'cron_daymonth',
    'cron_month',
    'cron_dayweek',
  ];

  isCustActionVisible(actionname: string) {
    if (actionname === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionname === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  public custActions: Array<any> = [
    {
      'id' : 'basic_mode',
      'name' : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      'name' : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  protected cron_user: any;
  protected cron_minute: any;
  protected cron_hour: any;
  protected cron_month: any;
  protected cron_daymonth: any;
  protected cron_dayweek: any;

  constructor(protected router: Router, protected taskService: TaskService, 
              protected userService: UserService, protected entityFormService: EntityFormService, ) {
    this.cron_user = _.find(this.fieldConfig, { 'name': 'cron_user' });
    this.userService.listUsers().subscribe((res) => {
      res.data.forEach((item) => {
        this.cron_user.options.push(
          {label: item.bsdusr_username, value: item.bsdusr_username})
      });
    });

    this.cron_minute = _.find(this.fieldConfig, { 'name': 'cron_minute' });
    for (let i = 0; i < 60; i++) {
      this.cron_minute.options.push(
        {label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})});
    }

    this.cron_hour = _.find(this.fieldConfig, { 'name': 'cron_hour' });
    for (let i = 0; i < 24; i++) {
      this.cron_hour.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    }    

    this.cron_month = _.find(this.fieldConfig, { 'name': 'cron_month' });
    this.taskService.getMonthChoices().subscribe((res) => {
      res.forEach((item) => {
        this.cron_month.options.push(
          {label: item[1], value: item[0]});
      });
    });

    this.cron_daymonth = _.find(this.fieldConfig, { 'name': 'cron_daymonth' });
    for (let i = 1; i < 32; i++) {
      this.cron_daymonth.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    }

    this.cron_dayweek = _.find(this.fieldConfig, { 'name': 'cron_dayweek' });
    this.taskService.getWeekdayChoices().subscribe((res) => {
      res.forEach((item) => {
        this.cron_dayweek.options.push({ label: item[1], value: item[0] });
      });
    });
  }
}
