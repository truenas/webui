import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { EntityTaskComponent } from '../../../common/entity/entity-task';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'rsync-task-add',
  template: `<entity-task [conf]="this"></entity-task>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class RsyncFormComponent {

  protected resource_name: string = 'tasks/rsync';
  protected route_success: string[] = ['tasks', 'rsync'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  
  protected preTaskName: string = 'rsync';
  public fieldConfig: FieldConfig[] = [
      {
        type : 'explorer',
        initial: '/mnt',
        name: 'rsync_path',
        explorerType: 'directory',
        placeholder: T('Path'),
        tooltip: T('Browse to the path to be copied; note that a path\
         length greater than 255 characters will fail.'),
      }, {
        type: 'select',
        name: 'rsync_user',
        placeholder: T('User'),
        tooltip: T('Specified user must have permission to write to the\
         specified directory on the remote system. The user name cannot\
         contain spaces or exceed 17 characters.'),
        options: [],
      }, {
        type: 'input',
        name: 'rsync_remotehost',
        placeholder: T('Remote Host'),
        tooltip: T('IP address or hostname of the remote system that will\
         store the copy. Use the format <i>username@remote_host</i> if the\
         username differs on the remote host.'),
      }, {
        type: 'input',
        name: 'rsync_remoteport',
        inputType: 'number',
        placeholder: T('Remote SSH Port'),
        value: 22,
        tooltip: T('SSH Port'),
      }, {
        type: 'select',
        name: 'rsync_mode',
        placeholder: T('Rsync mode'),
        tooltip: T('Choices are <i>Rsync module</i> or <i>Rsync over SSH</i>'),
        options: [],
      }, {
        type: 'input',
        name: 'rsync_remotemodule',
        placeholder: T('Remote Module Name'),
        tooltip: T('Only appears when using <i>Rsync module</i> mode.\
         At least one module must be defined in\
         <a href="https://www.samba.org/ftp/rsync/rsyncd.conf.html" target="_blank">\
         rsyncd.conf(5)</a> of rsync server or in the <b>Rsync Modules</b> of\
         another system.'),
      }, {
        type : 'explorer',
        initial: '/mnt',
        name: 'rsync_remotepath',
        explorerType: 'directory',
        placeholder: T('Remote Path'),
      }, {
        type: 'checkbox',
        name: 'rsync_validate_rpath',
        placeholder: T('Validate Remote Path'),
        value: true,
      }, {
        type: 'select',
        name: 'rsync_direction',
        placeholder: T('Direction'),
        tooltip: T('Choices are <i>Push</i> or <i>Pull</i>. Default is to\
         push to a remote host.'),
        options: [],
      }, {
        type: 'input',
        name: 'rsync_description',
        placeholder: T('Short Description'),
        tooltip: T('Optional.'),
      }, {
        type: 'select',
        name: 'rsync_repeat',
        placeholder: T('Quick Schedule'),
        tooltip: T('Select a time frame for the job. Otherwise, do not select\
         a time frame to customize the schedule.'),
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
        name: 'rsync_minute',
        placeholder: T('Minute'),
        value: '*',
        isHidden: false,
      }, {
        type: 'input',
        name: 'rsync_hour',
        placeholder: T('Hour'),
        value: '*',
        isHidden: false,
      }, {
        type: 'input',
        name: 'rsync_daymonth',
        placeholder: T('Day of month'),
        value: '*',
        isHidden: false,
      }, {
        type: 'select',
        name: 'rsync_month',
        placeholder: T('Month'),
        tooltip: T('Task occurs on the selected months.'),
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
        name: 'rsync_dayweek',
        placeholder: T('Day of week'),
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
      }, {
        type: 'checkbox',
        name: 'rsync_recursive',
        placeholder: T('Recursive'),
        tooltip: T('If checked, copy includes all subdirectories of the\
         specified volume.'),
        value: true,
      }, {
        type: 'checkbox',
        name: 'rsync_times',
        placeholder: T('Times'),
        tooltip: T('Preserve modification times of files.'),
        value: true,
      }, {
        type: 'checkbox',
        name: 'rsync_compress',
        placeholder: T('Compress'),
        tooltip: T('Recommended on slow connections as it reduces size of\
         data to be transmitted.'),
        value: true,
      }, {
        type: 'checkbox',
        name: 'rsync_archive',
        placeholder: T('Archive'),
        tooltip: T('Equivalent to <b>-rlptgoD</b> (recursive, copy symlinks\
         as symlinks, preserve permissions, preserve modification times,\
         preserve group, preserve owner(super-user only), and preserve device\
         files(super-user only) and special files).'),
      }, {
        type: 'checkbox',
        name: 'rsync_delete',
        placeholder: T('Delete'),
        tooltip: T('Delete files in destination directory that do not exist\
         in sending directory.'),
      }, {
        type: 'checkbox',
        name: 'rsync_quiet',
        placeholder: T('Quiet'),
        tooltip: T('Suppresses informational messages from the remote\
         server.'),
      }, {
        type: 'checkbox',
        name: 'rsync_preserveperm',
        placeholder: T('Preserve permissions'),
        tooltip: T('Preserves original file permissions; useful if user is\
         set to <i>root</i>.'),
      }, {
        type: 'checkbox',
        name: 'rsync_preserveattr',
        placeholder: T('Preserve extended attributes'),
        tooltip: T('Both systems must support\
         <a href="https://en.wikipedia.org/wiki/Extended_file_attributes"\
         target="_blank"> extended attributes</a>.'),
      }, {
        type: 'checkbox',
        name: 'rsync_delayupdates',
        placeholder: T('Delay Updates'),
        tooltip: T('When checked, the temporary file from each updated file\
         is saved to a holding directory until the end of the transfer, when all\
         transferred files are renamed into place.'),
        value: true,
      }, {
        type: 'textarea',
        name: 'extra',
        placeholder: T('Extra options'),
        tooltip: T('<a href="https://rsync.samba.org/ftp/rsync/rsync.html"\
         target="_blank"> rsync(1)</a> options not covered by the GUI. If the\
         * character is used, it must be escaped with a backslash (\\*.txt) or\
         used inside single quotes(\'*.txt\')'),
      }, {
        type: 'checkbox',
        name: 'rsync_enabled',
        placeholder: T('Enabled'),
        tooltip: T('Uncheck to disable the rsync task without deleteing it.\
         Note that when the <a href="http://doc.freenas.org/11/services.html#rsync"\
         target="_blank">Rsync</a> service is OFF, the rsync task continues to\
         look for the server unless this checkbox is unchecked.'),
        value: true,
      }
    ];

  protected hide_fileds: Array<any>;
  protected rsync_module_field: Array<any> = [
    'rsync_remotemodule',
  ];
  protected rsync_ssh_field: Array<any> = [
    'rsync_remoteport',
    'rsync_remotepath',
    'rsync_validate_rpath',
  ];
  protected user_field: any;
  protected rsync_mode_field: any;
  protected rsync_direction_field: any;

  constructor(protected router: Router, 
    protected taskService: TaskService, 
    protected userService: UserService, 
    protected entityFormService: EntityFormService) {}

  preInit() {
    this.hide_fileds = this.rsync_ssh_field;

    this.user_field = _.find(this.fieldConfig, { 'name': 'rsync_user' });
    this.userService.listUsers().subscribe((res) => {
      res.data.forEach((item) => {
        this.user_field.options.push({ label: item.bsdusr_username, value: item.bsdusr_username })
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
  }

  afterInit(entityTask: EntityTaskComponent) {
    entityTask.formGroup.controls['rsync_mode'].valueChanges.subscribe((res) => {
      if( res === "ssh" ){
        this.hide_fileds = this.rsync_module_field;
      }
      else {
        this.hide_fileds = this.rsync_ssh_field;
      }
    });
  }
}
