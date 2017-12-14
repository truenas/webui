import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService, RestService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

@Component({
  selector: 'cron-job-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class CronFormComponent {

  protected resource_name: string = 'tasks/cronjob';
  protected route_success: string[] = ['tasks', 'cron'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [{
    type: 'input',
    name: 'cron_description',
    placeholder: 'Description'
  }, {
    type: 'input',
    name: 'cron_command',
    placeholder: 'Command',
  }, {
    type: 'select',
    name: 'cron_user',
    placeholder: 'Run As User',
    options: [],
  }, {
    type: 'input',
    name: 'cron_discard_output',
    placeholder: 'Discard Output',
  }, {
    type: 'input',
    inputType: 'time',
    name: 'cron_time',
    placeholder: 'Time',
  }, {
    type: 'input',
    inputType: 'date',
    name: 'cron_date',
    placeholder: 'Date',
  }, {
    type: 'select',
    name: 'cron_repeat',
    placeholder: 'Repeat',
    options: [
      { label: 'Once(Do not Repeat)', value: 'once' },
      { label: 'Hourly', value: 'hourly' },
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'At Boot', value: 'boot' }
    ],
    value: 'once',
  }, {
    type: 'input',
    name: 'cron_minute',
    placeholder: 'Minute',
  }, {
    type: 'input',
    name: 'cron_hour',
    placeholder: 'Hour',
  }, {
    type: 'input',
    name: 'cron_daymonth',
    placeholder: 'Day of month',
  }, {
    type: 'input',
    name: 'cron_month',
    placeholder: 'Month',
  }, {
    type: 'input',
    name: 'cron_dayweek',
    placeholder: 'Day of week',
  }, {
    type: 'checkbox',
    name: 'cron_enabled',
    placeholder: 'Enable',
    value: true,
  }];

  // public fieldConfig: FieldConfig[] = [
  //   {
  //     type: 'select',
  //     name: 'cron_user',
  //     placeholder: 'User',
  //     options: [],
  //   }, {
  //     type: 'input',
  //     name: 'cron_command',
  //     placeholder: 'Command',
  //   }, {
  //     type: 'input',
  //     name: 'cron_description',
  //     placeholder: 'Short description'
  //   }, {
  //     type: 'task',
  //     name: 'cron_minute',
  //     placeholder: 'Minute',
  //     tabs: [{
  //       type: 'slider',
  //       name: 'cron_minute_slider',
  //       tabName: 'Every N minute',
  //       min: 1,
  //       max: 30,
  //     }, {
  //       type: 'togglebutton',
  //       name: 'cron_minute_togglebutton',
  //       tabName: 'Each selected minute',
  //       options: []
  //     }]
  //   }, {
  //     type: 'task',
  //     name: 'cron_hour',
  //     placeholder: 'Hour',
  //     tabs: [{
  //       type: 'slider',
  //       name: 'cron_hour_slider',
  //       tabName: 'Every N hour',
  //       min: 1,
  //       max: 12,
  //     }, {
  //       type: 'togglebutton',
  //       name: 'cron_hour_togglebutton',
  //       tabName: 'Each selected hour',
  //       options: []
  //     }]
  //   }, {
  //     type: 'task',
  //     name: 'cron_daymonth',
  //     placeholder: 'Day of month',
  //     tabs: [{
  //       type: 'slider',
  //       name: 'cron_daymonth_slider',
  //       tabName: 'Every N day of month',
  //       min: 1,
  //       max: 15,
  //     }, {
  //       type: 'togglebutton',
  //       name: 'cron_daymonth_togglebutton',
  //       tabName: 'Each selected day of month',
  //       options: []
  //     }]
  //   }, {
  //     type: 'togglebutton',
  //     name: 'cron_month',
  //     placeholder: 'Month',
  //     multiple: true,
  //     options: []
  //   }, {
  //     type: 'togglebutton',
  //     name: 'cron_dayweek',
  //     placeholder: 'Day of week',
  //     options: []
  //   }, {
  //     type: 'checkbox',
  //     name: 'cron_stdout',
  //     placeholder: 'Redirect Stdout',
  //     value: true,
  //   }, {
  //     type: 'checkbox',
  //     name: 'cron_stderr',
  //     placeholder: 'Redirect Stderr'
  //   }, {
  //     type: 'checkbox',
  //     name: 'cron_enabled',
  //     placeholder: 'Enable',
  //     value: true,
  //   }
  // ];

  protected user_field: any;
  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  protected basic_field: Array < any > = [
    'cron_time',
    'cron_date',
    'cron_repeat'
  ];

  protected advanced_field: Array < any > = [
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

  public custActions: Array < any > = [{
      'id': 'basic_mode',
      'name': 'Basic Mode',
      function: () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id': 'advanced_mode',
      'name': 'Advanced Mode',
      function: () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  public error: any;
  protected formGroup: any;

  constructor(protected router: Router, protected taskService: TaskService, protected userService: UserService,
    protected entityFormService: EntityFormService, protected loader: AppLoaderService, protected rest: RestService) {
    this.user_field = _.find(this.fieldConfig, { 'name': 'cron_user' });
    this.userService.listUsers().subscribe((res) => {
      res.data.forEach((item) => {
        this.user_field.options.push({ label: item.bsdusr_username, value: item.bsdusr_username })
      });
    });

    // this.month_field = _.find(this.fieldConfig, { 'name': 'cron_month' });
    // this.taskService.getMonthChoices().subscribe((res) => {
    //   res.forEach((item) => {
    //     this.month_field.options.push({ label: item[1], value: item[0] });
    //   });
    // });

    // this.day_field = _.find(this.fieldConfig, { 'name': 'cron_dayweek' });
    // this.taskService.getWeekdayChoices().subscribe((res) => {
    //   res.forEach((item) => {
    //     this.day_field.options.push({ label: item[1], value: item[0] });
    //   });
    // });

    // let cron_minute = _.find(this.fieldConfig, { 'name': 'cron_minute' });
    // this.mintue_field = _.find(cron_minute.tabs, { 'name': 'cron_minute_togglebutton' });
    // for (let i = 0; i < 60; i++) {
    //   this.mintue_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    // }

    // let cron_hour = _.find(this.fieldConfig, { 'name': 'cron_hour' });
    // this.hour_field = _.find(cron_hour.tabs, { 'name': 'cron_hour_togglebutton' });
    // for (let i = 0; i < 24; i++) {
    //   this.hour_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    // }

    // let cron_daymonth = _.find(this.fieldConfig, { 'name': 'cron_daymonth' });
    // this.daymonth_field = _.find(cron_daymonth.tabs, { 'name': 'cron_daymonth_togglebutton' });
    // for (let i = 1; i < 32; i++) {
    //   this.daymonth_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    // }
  }

  afterInit(entityform: any) {
    entityform.onSubmit = this.onSubmit;
    entityform.error = this.error;
    entityform.resource_name = this.resource_name;
    entityform.route_success = this.route_success;
    this.formGroup = entityform;
  }

  onSubmit(event: Event) {
    console.log("submit cron");
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);

    value['cron_dayweek'] = '*';
    value['cron_month'] = '*';
    value['cron_daymonth'] = '*';
    value['cron_hour'] = '*';
    value['cron_minute'] = '*';

    // analysis date and time
    let date = value['cron_date'] + ' ' + value['cron_time'];
    if (value['cron_repeat'] == 'once') {
      value['cron_month'] = new Date(date).getMonth().toString();
      value['cron_dayweek'] = new Date(date).getDay().toString();
      value['cron_daymonth'] = new Date(date).getDate().toString();
      value['cron_hour'] = new Date(date).getHours().toString();
      value['cron_minute'] = new Date(date).getMinutes().toString();
    } else if (value['cron_repeat'] == 'hourly') {
      value['cron_minute'] = new Date(date).getMinutes().toString();
    } else if (value['cron_repeat'] == 'daily') {
      value['cron_minute'] = new Date(date).getMinutes().toString();
      value['cron_hour'] = new Date(date).getHours().toString();
    } else if (value['cron_repeat'] == 'monthly') {
      value['cron_minute'] = new Date(date).getMinutes().toString();
      value['cron_hour'] = new Date(date).getHours().toString();
      value['cron_daymonth'] = new Date(date).getDate().toString();
    } else if (value['cron_repeat'] == 'weekly') {
      value['cron_minute'] = new Date(date).getMinutes().toString();
      value['cron_hour'] = new Date(date).getHours().toString();
      value['cron_dayweek'] = new Date(date).getDay().toString();
    } else if (value['cron_repeat'] == 'boot') {

    }

    this.loader.open();
    this.rest.post(this.resource_name + '/', {
      body : JSON.stringify(value)
    }).subscribe(
      (res)=> {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        console.log(res);
      })

  }    
}
