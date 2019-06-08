import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import helptext from '../../../../helptext/task-calendar/resync/resync-form';

@Component({
  selector: 'rsync-task-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class RsyncFormComponent {

  //protected resource_name: string = 'tasks/rsync';
  protected addCall = 'rsynctask.create';
  protected editCall = 'rsynctask.update';
  protected queryCall = 'rsynctask.query';
  protected route_success: string[] = ['tasks', 'rsync'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  protected preTaskName: string = 'rsync';
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name:'Rsync Task',
      class:'add-rsync',
      label:true,
      width:'300px',
      config: [
      {
        type : 'explorer',
        initial: '/mnt',
        name: 'path',
        explorerType: 'directory',
        placeholder: helptext.rsync_path_placeholder,
        tooltip: helptext.rsync_path_tooltip,
        required: true,
        validation : helptext.rsync_path_validation
      }, {
        type: 'combobox',
        name: 'user',
        placeholder: helptext.rsync_user_placeholder,
        tooltip: helptext.rsync_user_tooltip,
        options: [],
        required: true,
        validation : helptext.rsync_user_validation,
        searchOptions: [],
        parent: this,
        updater: this.updateUserSearchOptions,
      }, {
        type: 'input',
        name: 'remotehost',
        placeholder: helptext.rsync_remotehost_placeholder,
        required: true,
        validation : helptext.rsync_remotehost_validation,
        tooltip: helptext.rsync_remotehost_tooltip
      }, {
        type: 'select',
        name: 'mode',
        placeholder: helptext.rsync_mode_placeholder,
        tooltip: helptext.rsync_mode_tooltip,
        options: [{label: 'Module', value: 'MODULE'},
                  {label: 'SSH', value: 'SSH'}],
      }, {
        type: 'input',
        name: 'remoteport',
        inputType: 'number',
        placeholder: helptext.rsync_remoteport_placeholder,
        value: 22,
        tooltip: helptext.rsync_remoteport_tooltip
      }, {
        type: 'input',
        name: 'remotemodule',
        placeholder: helptext.rsync_remotemodule_placeholder,
        tooltip: helptext.rsync_remotemodule_tooltip
      }, {
        type : 'explorer',
        initial: '/mnt',
        name: 'remotepath',
        explorerType: 'directory',
        placeholder: helptext.rsync_remotepath_placeholder,
        tooltip: helptext.rsync_remotepath_tooltip
      }, {
        type: 'checkbox',
        name: 'validate_rpath',
        placeholder: helptext.rsync_validate_rpath_placeholder,
        tooltip: helptext.rsync_validate_rpath_tooltip,
        value: true,
      }, {
        type: 'select',
        name: 'direction',
        placeholder: helptext.rsync_direction_placeholder,
        tooltip: helptext.rsync_direction_tooltip,
        options: [{label: 'Push', value: 'PUSH'},
                  {label: 'Pull', value: 'PULL'}],
        required: true,
        validation : helptext.rsync_direction_validation
      }, {
        type: 'input',
        name: 'desc',
        placeholder: helptext.rsync_description_placeholder,
        tooltip: helptext.rsync_description_tooltip
      }, {
        type: 'scheduler',
        name: 'rsync_picker',
        placeholder: helptext.rsync_picker_placeholder,
        tooltip: helptext.rsync_picker_tooltip,
        required: true
      }, {
        type: 'checkbox',
        name: 'recursive',
        placeholder: helptext.rsync_recursive_placeholder,
        tooltip: helptext.rsync_recursive_tooltip,
        value: true,
      }, {
        type: 'checkbox',
        name: 'times',
        placeholder: helptext.rsync_times_placeholder,
        tooltip: helptext.rsync_times_tooltip,
        value: true,
      }, {
        type: 'checkbox',
        name: 'compress',
        placeholder: helptext.rsync_compress_placeholder,
        tooltip: helptext.rsync_compress_tooltip,
        value: true,
      }, {
        type: 'checkbox',
        name: 'archive',
        placeholder: helptext.rsync_archive_placeholder,
        tooltip: helptext.rsync_archive_tooltip
      }, {
        type: 'checkbox',
        name: 'delete',
        placeholder: helptext.rsync_delete_placeholder,
        tooltip: helptext.rsync_delete_tooltip
      }, {
        type: 'checkbox',
        name: 'quiet',
        placeholder: helptext.rsync_quiet_placeholder,
        tooltip: helptext.rsync_quiet_tooltip
      }, {
        type: 'checkbox',
        name: 'preserveperm',
        placeholder: helptext.rsync_preserveperm_placeholder,
        tooltip: helptext.rsync_preserveperm_tooltip
      }, {
        type: 'checkbox',
        name: 'preserveattr',
        placeholder: helptext.rsync_preserveattr_placeholder,
        tooltip: helptext.rsync_preserveattr_tooltip
      }, {
        type: 'checkbox',
        name: 'delayupdates',
        placeholder: helptext.rsync_delayupdates_placeholder,
        tooltip: helptext.rsync_delayupdates_tooltip,
        value: true,
      }, {
        type: 'textarea',
        name: 'extra',
        placeholder: helptext.rsync_extra_placeholder,
        tooltip: helptext.rsync_extra_tooltip
      }, {
        type: 'checkbox',
        name: 'enabled',
        placeholder: helptext.rsync_enabled_placeholder,
        tooltip: helptext.rsync_enabled_tooltip,
        value: true,
      }
    ]
  }];

  protected hide_fileds: Array<any>;
  protected rsync_module_field: Array<any> = [
    'remotemodule',
  ];
  protected rsync_ssh_field: Array<any> = [
    'remoteport',
    'remotepath',
    'validate_rpath',
  ];
  protected user_field: any;

  constructor(protected router: Router,
    protected taskService: TaskService,
    protected userService: UserService,
    protected entityFormService: EntityFormService) {}

  preInit() {
    this.hide_fileds = this.rsync_ssh_field;

    this.user_field = _.find(this.fieldSets[0].config, { 'name': 'user' });
    
    this.userService.listAllUsers().subscribe((res) => {
      let items = res.data.items;
      for (let i = 0; i < items.length; i++) {
         this.user_field.options.push({label: items[i].label, value: items[i].id});
       }
    });
  }

  afterInit(entityForm) {
    entityForm.formGroup.controls['mode'].valueChanges.subscribe((res) => {
      if( res === "SSH" ){
        this.hide_fileds = this.rsync_module_field;
      }
      else {
        this.hide_fileds = this.rsync_ssh_field;
      }
    });
  }

  beforeSubmit(value){
    let spl = value.rsync_picker.split(" ");
    delete value.rsync_picker;
    const schedule = {}
    schedule['minute'] = spl[0];
    schedule['hour'] = spl[1];
    schedule['dom'] = spl[2];
    schedule['month'] = spl[3];
    schedule['dow'] = spl[4];
    value['schedule'] = schedule;
  }

  resourceTransformIncomingRestData(data) {
    data['rsync_picker'] = data.schedule.minute + " " +
                          data.schedule.hour + " " +
                          data.schedule.dom + " " +
                          data.schedule.month + " " +
                          data.schedule.dow;
    return data;
  }

  updateUserSearchOptions(value = "", parent) {
    parent.userService.listAllUsers(value).subscribe(res => {
      let users = [];
      let items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].label, value: items[i].id});
      }
      parent.user_field.searchOptions = users;
    });
  }
}
