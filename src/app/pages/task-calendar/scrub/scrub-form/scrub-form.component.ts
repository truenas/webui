import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';


@Component({
  selector: 'scrub-task-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class ScrubFormComponent {

  protected resource_name: string = 'storage/scrub';
  protected route_success: string[] = ['tasks', 'scrub'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
      type: 'select',
      name: 'scrub_volume',
      placeholder: 'Volume',
      options: [],
    }, {
      type: 'input',
      name: 'scrub_description',
      placeholder: 'Description'
    }, {
      type: 'task',
      name: 'scrub_daymonth',
      placeholder: 'Day of month',
      tabs: [{
        type: 'slider',
        name: 'scrub_daymonth_slider',
        tabName: 'Every N day of month',
        min: 1,
        max: 15,
      }, {
        type: 'togglebutton',
        name: 'scrub_daymonth_togglebutton',
        tabName: 'Each selected day of month',
        options: []
      }]
    }, {
      type: 'togglebutton',
      name: 'scrub_month',
      placeholder: 'Month',
      multiple: true,
      options: []
    }, {
      type: 'togglebutton',
      name: 'scrub_dayweek',
      placeholder: 'Day of week',
      options: []
    }, {
      type: 'task',
      name: 'scrub_minute',
      placeholder: 'Minute',
      tabs: [{
        type: 'slider',
        name: 'scrub_minute_slider',
        tabName: 'Every N minute',
        min: 1,
        max: 30,
      }, {
        type: 'togglebutton',
        name: 'scrub_minute_togglebutton',
        tabName: 'Each selected minute',
        options: []
      }]
    }, {
      type: 'task',
      name: 'scrub_hour',
      placeholder: 'Hour',
      tabs: [{
        type: 'slider',
        name: 'scrub_hour_slider',
        tabName: 'Every N hour',
        min: 1,
        max: 12,
      }, {
        type: 'togglebutton',
        name: 'scrub_hour_togglebutton',
        tabName: 'Each selected hour',
        options: []
      }]
    }, {
      type: 'checkbox',
      name: 'scrub_enabled',
      placeholder: 'Enable',
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
    
    this.month_field = _.find(this.fieldConfig, { 'name': 'scrub_month' });
    this.taskService.getMonthChoices().subscribe((res) => {
      res.forEach((item) => {
        this.month_field.options.push({ label: item[1], value: item[0] });
      });
    });

    this.day_field = _.find(this.fieldConfig, { 'name': 'scrub_dayweek' });
    this.taskService.getWeekdayChoices().subscribe((res) => {
      res.forEach((item) => {
        this.day_field.options.push({ label: item[1], value: item[0] });
      });
    });

    let scrub_minute = _.find(this.fieldConfig, { 'name': 'scrub_minute' });
    this.mintue_field = _.find(scrub_minute.tabs, { 'name': 'scrub_minute_togglebutton' });
    for (let i = 0; i < 60; i++) {
      this.mintue_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    }

    let scrub_hour = _.find(this.fieldConfig, { 'name': 'scrub_hour' });
    this.hour_field = _.find(scrub_hour.tabs, { 'name': 'scrub_hour_togglebutton' });
    for (let i = 0; i < 24; i++) {
      this.hour_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    }

    let scrub_daymonth = _.find(this.fieldConfig, { 'name': 'scrub_daymonth' });
    this.daymonth_field = _.find(scrub_daymonth.tabs, { 'name': 'scrub_daymonth_togglebutton' });
    for (let i = 1; i < 32; i++) {
      this.daymonth_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    }
  }

  afterInit(entityForm: any) {
    this.volume_field = _.find(this.fieldConfig, { 'name': 'scrub_volume' });
    this.taskService.getVolumeList().subscribe((res) => {
      res.data.forEach((item) => {
        this.volume_field.options.push({ label: item.vol_name, value: item.id });
        if(item.vol_name == entityForm.data.scrub_volume) {
          entityForm.formGroup.controls['scrub_volume'].setValue(item.id);
        }
      });
    });    
  }
}
