import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'rsync-task-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class RsyncFormComponent {

  protected resource_name: string = 'tasks/rsync';
  protected route_success: string[] = ['tasks', 'rsync'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  
  public fieldConfig: FieldConfig[];

  protected user_field: any;
  protected month_field: any;
  protected day_field: any;
  protected rsync_mode_field: any;
  protected rsync_direction_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  protected hide_fileds: Array<any>;
  protected rsync_module_field: Array<any> = [
    'rsync_remotemodule',
  ];
  protected rsync_ssh_field: Array<any> = [
    'rsync_remotesshport',
    'rsync_remotepath',
  ];

  constructor(protected router: Router, 
    protected taskService: TaskService, 
    protected userService: UserService, 
    protected entityFormService: EntityFormService, ) {

    const theThis = this;

    this.hide_fileds = this.rsync_ssh_field;

    this.fieldConfig = [{
      type : 'explorer',
      initial: '/mnt',
      name: 'rsync_path',
      placeholder: 'Path',
    }, {
      type: 'select',
      name: 'rsync_user',
      placeholder: 'User',
      options: [],
    }, {
      type: 'input',
      name: 'rsync_remotehost',
      placeholder: 'Remote Host',
      tooltip: 'IP Address or hostname. Specify user@hostname or user@ip-address if your remote machine user and above rsync task user are different.'
    }, {
      type: 'input',
      name: 'rsync_remoteport',
      inputType: 'number',
      placeholder: 'Remote SSH Port',
      value: 22,
      tooltip: 'SSH Port',
    }, {
      type: 'select',
      name: 'rsync_mode',
      placeholder: 'Rsync mode',
      options: [],
      onChangeOption: function(data) {
        theThis.onChangeRsyncMode(data.event.value);
      },
    }, {
      type: 'input',
      name: 'rsync_remotemodule',
      placeholder: 'Remote Module Name',
      tooltip: 'Name of the module defined in the remote rsync daemon',
    }, {
      type : 'explorer',
      initial: '/mnt',
      name: 'rsync_remotepath',
      explorerType: 'directory',
      placeholder: 'Remote Path',
    }, {
      type: 'select',
      name: 'rsync_direction',
      placeholder: 'Direction',
      options: [],
    }, {
      type: 'input',
      name: 'rsync_description',
      placeholder: 'Short Description'
    }, {
      type: 'task',
      name: 'rsync_minute',
      placeholder: 'Minute',
      tabs: [{
        type: 'slider',
        name: 'rsync_minute_slider',
        tabName: 'Every N minute',
        min: 1,
        max: 30,
      }, {
        type: 'togglebutton',
        name: 'rsync_minute_togglebutton',
        tabName: 'Each selected minute',
        options: []
      }]
    }, {
      type: 'task',
      name: 'rsync_hour',
      placeholder: 'Hour',
      tabs: [{
        type: 'slider',
        name: 'rsync_hour_slider',
        tabName: 'Every N hour',
        min: 1,
        max: 12,
      }, {
        type: 'togglebutton',
        name: 'rsync_hour_togglebutton',
        tabName: 'Each selected hour',
        options: []
      }]
    }, {
      type: 'task',
      name: 'rsync_daymonth',
      placeholder: 'Day of month',
      tabs: [{
        type: 'slider',
        name: 'rsync_daymonth_slider',
        tabName: 'Every N day of month',
        min: 1,
        max: 15,
      }, {
        type: 'togglebutton',
        name: 'rsync_daymonth_togglebutton',
        tabName: 'Each selected day of month',
        options: []
      }]
    }, {
      type: 'togglebutton',
      name: 'rsync_month',
      placeholder: 'Month',
      multiple: true,
      options: []
    }, {
      type: 'togglebutton',
      name: 'rsync_dayweek',
      placeholder: 'Day of week',
      options: []
    }, {
      type: 'checkbox',
      name: 'rsync_recursive',
      placeholder: 'Recursive',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_times',
      placeholder: 'Times',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_compress',
      placeholder: 'Compress',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_archive',
      placeholder: 'Archive',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_delete',
      placeholder: 'Delete',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_quiet',
      placeholder: 'Quiet',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_preserveperm',
      placeholder: 'Preserve permissions',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_preserveattr',
      placeholder: 'Preserve extended attributes',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_delayupdates',
      placeholder: 'Delay Updates',
      value: true,
    }, {
      type: 'textarea',
      name: 'extra',
      placeholder: 'Extra options'
    }, {
      type: 'checkbox',
      name: 'rsync_enabled',
      placeholder: 'Enabled',
      value: true,
    }];

    this.user_field = _.find(this.fieldConfig, { 'name': 'rsync_user' });
    this.userService.listUsers().subscribe((res) => {
      res.data.forEach((item) => {
        this.user_field.options.push({ label: item.bsdusr_username, value: item.bsdusr_username })
      });
    });

    this.month_field = _.find(this.fieldConfig, { 'name': 'rsync_month' });
    this.taskService.getMonthChoices().subscribe((res) => {
      res.forEach((item) => {
        this.month_field.options.push({ label: item[1], value: item[0] });
      });
    });

    this.day_field = _.find(this.fieldConfig, { 'name': 'rsync_dayweek' });
    this.taskService.getWeekdayChoices().subscribe((res) => {
      res.forEach((item) => {
        this.day_field.options.push({ label: item[1], value: item[0] });
      });
    });

    this.rsync_mode_field = _.find(this.fieldConfig, { 'name': 'rsync_mode' });
    this.taskService.getRsyncModeChoices().subscribe((res) => {
      res.forEach((item) => {
        this.rsync_mode_field.options.push({ label: item[1], value: item[0] });
      });
    });

    this.rsync_direction_field = _.find(this.fieldConfig, { 'name': 'rsync_direction' });
    this.taskService.getRsyncDirectionChoices().subscribe((res) => {
      res.forEach((item) => {
        this.rsync_direction_field.options.push({ label: item[1], value: item[0] });
      });
    });

    let cron_minute = _.find(this.fieldConfig, { 'name': 'rsync_minute' });
    this.mintue_field = _.find(cron_minute.tabs, { 'name': 'rsync_minute_togglebutton' });
    for (let i = 0; i < 60; i++) {
      this.mintue_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    }

    let cron_hour = _.find(this.fieldConfig, { 'name': 'rsync_hour' });
    this.hour_field = _.find(cron_hour.tabs, { 'name': 'rsync_hour_togglebutton' });
    for (let i = 0; i < 24; i++) {
      this.hour_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    }

    let cron_daymonth = _.find(this.fieldConfig, { 'name': 'rsync_daymonth' });
    this.daymonth_field = _.find(cron_daymonth.tabs, { 'name': 'rsync_daymonth_togglebutton' });
    for (let i = 1; i < 32; i++) {
      this.daymonth_field.options.push({ label: i, value: i.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) });
    }
  }

  onChangeRsyncMode(value) {
    if( value === "ssh" ){
      this.hide_fileds = this.rsync_module_field;
    }
    else {
      this.hide_fileds = this.rsync_ssh_field;
    }
  }

}
