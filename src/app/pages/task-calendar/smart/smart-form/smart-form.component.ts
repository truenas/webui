import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, StorageService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'smart-test-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, StorageService, EntityFormService]
})
export class SmartFormComponent {

  protected resource_name: string = 'tasks/smarttest';
  protected route_success: string[] = ['tasks', 'smart'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
      type: 'select',
      name: 'smarttest_disks',
      placeholder: 'Disks',
      tooltip : 'Highlight disks to monitor.',
      options: [],
      multiple: true,
    }, {
      type: 'select',
      name: 'smarttest_type',
      placeholder: 'Type',
      tooltip : 'Select type of test to run. See\
 <a\
 href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
 target="_blank">smartctl(8)</a> for a description of each type of test\
 (note that some test types will degrade performace or take disks\
 offline. Do not schedule S.M.A.R.T. tests at the same time as a scrub\
 or during a resilver operation).',
      options: [],
    }, {
      type: 'input',
      name: 'smarttest_desc',
      placeholder: 'Short description',
      tooltip : 'Optional.',
    },
    {
      type: 'task',
      name: 'smarttest_hour',
      placeholder: 'Hour',
      tabs: [{
        type: 'slider',
        name: 'smarttest_hour_slider',
        tabName: 'Every N hour',
        min: 1,
        max: 12,
      }, {
        type: 'togglebutton',
        name: 'smarttest_hour_togglebutton',
        tabName: 'Each selected hour',
        options: []
      }]
    },
    {
      type: 'task',
      name: 'smarttest_daymonth',
      placeholder: 'Day of month',
      tabs: [{
        type: 'slider',
        name: 'smarttest_daymonth_slider',
        tabName: 'Every N day of month',
        min: 1,
        max: 15,
      }, {
        type: 'togglebutton',
        name: 'smarttest_daymonth_togglebutton',
        tabName: 'Each selected day of month',
        options: []
      }]
    },
    {
      type: 'togglebutton',
      name: 'smarttest_month',
      placeholder: 'Month',
      multiple: true,
      options: []
    },
    {
      type: 'togglebutton',
      name: 'smarttest_dayweek',
      placeholder: 'Day of week',
      multiple: true,
      options: []
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

    this.month_field = _.find(this.fieldConfig, { 'name': 'smarttest_month' });
    this.taskService.getMonthChoices().subscribe((res) => {
      res.forEach((item) => {
        this.month_field.options.push({ label: item[1], value: item[0] });
      });
    });

    this.day_field = _.find(this.fieldConfig, { 'name': 'smarttest_dayweek' });
    this.taskService.getWeekdayChoices().subscribe((res) => {
      res.forEach((item) => {
        this.day_field.options.push({ label: item[1], value: item[0] });
      });
    });

    let smarttest_hour = _.find(this.fieldConfig, { 'name': 'smarttest_hour' });
    this.hour_field = _.find(smarttest_hour.tabs, { 'name': 'smarttest_hour_togglebutton' });
    for (let i = 0; i < 24; i++) {
      this.hour_field.options.push({ label: i, value: i.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) });
    }

    let smarttest_daymonth = _.find(this.fieldConfig, { 'name': 'smarttest_daymonth' });
    this.daymonth_field = _.find(smarttest_daymonth.tabs, { 'name': 'smarttest_daymonth_togglebutton' });
    for (let i = 1; i < 32; i++) {
      this.daymonth_field.options.push({ label: i, value: i.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) });
    }

  }
}
