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
    'rsync_remoteport',
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
      explorerType: 'directory',
      placeholder: 'Path',
      tooltip: 'Browse to the path to be copied; note that a path\
 length greater than 255 characters will fail.',
    }, {
      type: 'select',
      name: 'rsync_user',
      placeholder: 'User',
      tooltip: 'Specified user must have permission to write to the\
 specified directory on the remote system. The user name cannot\
 contain spaces or exceed 17 characters.',
      options: [],
    }, {
      type: 'input',
      name: 'rsync_remotehost',
      placeholder: 'Remote Host',
      tooltip: 'IP address or hostname of the remote system that will\
 store the copy. Use the format <i>username@remote_host</i> if the\
 username differs on the remote host.',
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
      tooltip: 'Choices are <i>Rsync module</i> or <i>Rsync over SSH</i>',
      options: [],
      onChangeOption: function(data) {
        theThis.onChangeRsyncMode(data.event.value);
      },
    }, {
      type: 'input',
      name: 'rsync_remotemodule',
      placeholder: 'Remote Module Name',
      tooltip: 'Only appears when using <i>Rsync module</i> mode.\
 At least one module must be defined in\
 <a href="https://www.samba.org/ftp/rsync/rsyncd.conf.html" target="_blank">\
 rsyncd.conf(5)</a> of rsync server or in the <b>Rsync Modules</b> of\
 another system.',
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
      tooltip: 'Choices are <i>Push</i> or <i>Pull</i>. Default is to\
 push to a remote host.',
      options: [],
    }, {
      type: 'input',
      name: 'rsync_description',
      placeholder: 'Short Description',
      tooltip: 'Optional.',
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
      tooltip: 'Task occurs on the selected months.',
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
      tooltip: 'If checked, copy includes all subdirectories of the\
 specified volume.',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_times',
      placeholder: 'Times',
      tooltip: 'Preserve modification times of files.',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_compress',
      placeholder: 'Compress',
      tooltip: 'Recommended on slow connections as it reduces size of\
 data to be transmitted.',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_archive',
      placeholder: 'Archive',
      tooltip: 'Equivalent to <b>-rlptgoD</b> (recursive, copy symlinks\
 as symlinks, preserve permissions, preserve modification times,\
 preserve group, preserve owner(super-user only), and preserve device\
 files(super-user only) and special files).',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_delete',
      placeholder: 'Delete',
      tooltip: 'Delete files in destination directory that do not exist\
 in sending directory.',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_quiet',
      placeholder: 'Quiet',
      tooltip: 'Suppresses informational messages from the remote\
 server.',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_preserveperm',
      placeholder: 'Preserve permissions',
      tooltip: 'Preserves original file permissions; useful if user is\
 set to <i>root</i>.',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_preserveattr',
      placeholder: 'Preserve extended attributes',
      tooltip: 'Both systems must support\
 <a href="https://en.wikipedia.org/wiki/Extended_file_attributes"\
 target="_blank"> extended attributes</a>.',
      value: true,
    }, {
      type: 'checkbox',
      name: 'rsync_delayupdates',
      placeholder: 'Delay Updates',
      tooltip: 'When checked, the temporary file from each updated file\
 is saved to a holding directory until the end of the transfer, when all\
 transferred files are renamed into place.',
      value: true,
    }, {
      type: 'textarea',
      name: 'extra',
      placeholder: 'Extra options',
      tooltip: '<a href="https://rsync.samba.org/ftp/rsync/rsync.html"\
 target="_blank"> rsync(1)</a> options not covered by the GUI. If the\
 * character is used, it must be escaped with a backslash (\\*.txt) or\
 used inside single quotes(\'*.txt\')',
    }, {
      type: 'checkbox',
      name: 'rsync_enabled',
      placeholder: 'Enabled',
      tooltip: 'Uncheck to disable the rsync task without deleteing it.\
 Note that when the <a href="http://doc.freenas.org/11/services.html#rsync"\
 target="_blank">Rsync</a> service is OFF, the rsync task continues to\
 look for the server unless this checkbox is unchecked.',
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
