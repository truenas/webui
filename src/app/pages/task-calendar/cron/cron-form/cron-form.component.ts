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
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class CronFormComponent {

  protected resource_name: string = 'tasks/cronjob';
  protected route_success: string[] = ['tasks'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
      type: 'select',
      name: 'cron_user',
      placeholder: 'User',
      options: [],
    }, {
      type: 'input',
      name: 'cron_command',
      placeholder: 'Command',
    }, {
      type: 'input',
      name: 'cron_description',
      placeholder: 'Short description'
    },
    {
      type: 'task',
      name: 'cron_minute',
      placeholder: 'Minute',
      tabs: [{
        type: 'slider',
        name: 'cron_minute_slider',
        tabName: 'Every N minute',
        min: 1,
        max: 30,
      }, {
        type: 'togglebutton',
        name: 'cron_minute_togglebutton',
        tabName: 'Each selected minute',
        options: []
      }]
    },
    {
      type: 'task',
      name: 'cron_hour',
      placeholder: 'Hour',
      tabs: [{
        type: 'slider',
        name: 'cron_hour_slider',
        tabName: 'Every N hour',
        min: 1,
        max: 12,
      }, {
        type: 'togglebutton',
        name: 'cron_hour_togglebutton',
        tabName: 'Each selected hour',
        options: []
      }]
    }, {
      type: 'task',
      name: 'cron_daymonth',
      placeholder: 'Day of month',
      tabs: [{
        type: 'slider',
        name: 'cron_daymonth_slider',
        tabName: 'Every N day of month',
        min: 1,
        max: 15,
      }, {
        type: 'togglebutton',
        name: 'cron_daymonth_togglebutton',
        tabName: 'Each selected day of month',
        options: []
      }]
    },
    {
      type: 'togglebutton',
      name: 'cron_month',
      placeholder: 'Month',
      multiple: true,
      options: []
    },
    {
      type: 'togglebutton',
      name: 'cron_dayweek',
      placeholder: 'Day of week',
      options: []
    }, {
      type: 'checkbox',
      name: 'cron_stdout',
      placeholder: 'Redirect Stdout'
    }, {
      type: 'checkbox',
      name: 'cron_stderr',
      placeholder: 'Redirect Stderr'
    }, {
      type: 'checkbox',
      name: 'cron_enabled',
      placeholder: 'Enable'
    }
  ];

  protected user_field: any;
  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  constructor(protected router: Router, protected taskService: TaskService, protected userService: UserService, protected entityFormService: EntityFormService, ) {}

  afterInit(entityForm: any) {
    this.user_field = _.find(this.fieldConfig, { 'name': 'cron_user' });
    this.userService.listUsers().subscribe((res) => {
      res.data.forEach((item) => {
        this.user_field.options.push({ label: item.bsdusr_username, value: item.bsdusr_username })
      });
    });

    this.month_field = _.find(this.fieldConfig, { 'name': 'cron_month' });
    this.taskService.getMonthChoices().subscribe((res) => {
      res.forEach((item) => {
        this.month_field.options.push({ label: item[1], value: item[0] });
      });
    });

    this.day_field = _.find(this.fieldConfig, { 'name': 'cron_dayweek' });
    this.taskService.getWeekdayChoices().subscribe((res) => {
      res.forEach((item) => {
        this.day_field.options.push({ label: item[1], value: item[0] });
      });
    });

    let cron_minute = _.find(this.fieldConfig, { 'name': 'cron_minute' });
    this.mintue_field = _.find(cron_minute.tabs, { 'name': 'cron_minute_togglebutton' });
    for (let i = 0; i < 60; i++) {
      this.mintue_field.options.push({ label: i, value: i });
    }

    let cron_hour = _.find(this.fieldConfig, { 'name': 'cron_hour' });
    this.hour_field = _.find(cron_hour.tabs, { 'name': 'cron_hour_togglebutton' });
    for (let i = 0; i < 24; i++) {
      this.hour_field.options.push({ label: i, value: i });
    }

    let cron_daymonth = _.find(this.fieldConfig, { 'name': 'cron_daymonth' });
    this.daymonth_field = _.find(cron_daymonth.tabs, { 'name': 'cron_daymonth_togglebutton' });
    for (let i = 1; i < 32; i++) {
      this.daymonth_field.options.push({ label: i, value: i });
    }
  }
}
