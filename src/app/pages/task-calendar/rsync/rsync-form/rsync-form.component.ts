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

  protected resource_name: string = 'tasks/rsync';
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
        name: 'rsync_path',
        explorerType: 'directory',
        placeholder: helptext.rsync_path_placeholder,
        tooltip: helptext.rsync_path_tooltip,
        required: true,
        validation : helptext.rsync_path_validation
      }, {
        type: 'combobox',
        name: 'rsync_user',
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
        name: 'rsync_remotehost',
        placeholder: helptext.rsync_remotehost_placeholder,
        required: true,
        validation : helptext.rsync_remotehost_validation,
        tooltip: helptext.rsync_remotehost_tooltip
      }, {
        type: 'input',
        name: 'rsync_remoteport',
        inputType: 'number',
        placeholder: helptext.rsync_remoteport_placeholder,
        value: 22,
        tooltip: helptext.rsync_remoteport_tooltip
      }, {
        type: 'select',
        name: 'rsync_mode',
        placeholder: helptext.rsync_mode_placeholder,
        tooltip: helptext.rsync_mode_tooltip,
        options: [],
      }, {
        type: 'input',
        name: 'rsync_remotemodule',
        placeholder: helptext.rsync_remotemodule_placeholder,
        tooltip: helptext.rsync_remotemodule_tooltip
      }, {
        type : 'explorer',
        initial: '/mnt',
        name: 'rsync_remotepath',
        explorerType: 'directory',
        placeholder: helptext.rsync_remotepath_placeholder,
        tooltip: helptext.rsync_remotepath_tooltip
      }, {
        type: 'checkbox',
        name: 'rsync_validate_rpath',
        placeholder: helptext.rsync_validate_rpath_placeholder,
        tooltip: helptext.rsync_validate_rpath_tooltip,
        value: true,
      }, {
        type: 'select',
        name: 'rsync_direction',
        placeholder: helptext.rsync_direction_placeholder,
        tooltip: helptext.rsync_direction_tooltip,
        options: [],
        required: true,
        validation : helptext.rsync_direction_validation
      }, {
        type: 'input',
        name: 'rsync_description',
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
        name: 'rsync_recursive',
        placeholder: helptext.rsync_recursive_placeholder,
        tooltip: helptext.rsync_recursive_tooltip,
        value: true,
      }, {
        type: 'checkbox',
        name: 'rsync_times',
        placeholder: helptext.rsync_times_placeholder,
        tooltip: helptext.rsync_times_tooltip,
        value: true,
      }, {
        type: 'checkbox',
        name: 'rsync_compress',
        placeholder: helptext.rsync_compress_placeholder,
        tooltip: helptext.rsync_compress_tooltip,
        value: true,
      }, {
        type: 'checkbox',
        name: 'rsync_archive',
        placeholder: helptext.rsync_archive_placeholder,
        tooltip: helptext.rsync_archive_tooltip
      }, {
        type: 'checkbox',
        name: 'rsync_delete',
        placeholder: helptext.rsync_delete_placeholder,
        tooltip: helptext.rsync_delete_tooltip
      }, {
        type: 'checkbox',
        name: 'rsync_quiet',
        placeholder: helptext.rsync_quiet_placeholder,
        tooltip: helptext.rsync_quiet_tooltip
      }, {
        type: 'checkbox',
        name: 'rsync_preserveperm',
        placeholder: helptext.rsync_preserveperm_placeholder,
        tooltip: helptext.rsync_preserveperm_tooltip
      }, {
        type: 'checkbox',
        name: 'rsync_preserveattr',
        placeholder: helptext.rsync_preserveattr_placeholder,
        tooltip: helptext.rsync_preserveattr_tooltip
      }, {
        type: 'checkbox',
        name: 'rsync_delayupdates',
        placeholder: helptext.rsync_delayupdates_placeholder,
        tooltip: helptext.rsync_delayupdates_tooltip,
        value: true,
      }, {
        type: 'textarea',
        name: 'rsync_extra',
        placeholder: helptext.rsync_extra_placeholder,
        tooltip: helptext.rsync_extra_tooltip
      }, {
        type: 'checkbox',
        name: 'rsync_enabled',
        placeholder: helptext.rsync_enabled_placeholder,
        tooltip: helptext.rsync_enabled_tooltip,
        value: true,
      }
    ]
  }];

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

    this.user_field = _.find(this.fieldSets[0].config, { 'name': 'rsync_user' });
    
    this.userService.listAllUsers().subscribe((res) => {
      let items = res.data.items;
      for (let i = 0; i < items.length; i++) {
         this.user_field.options.push({label: items[i].label, value: items[i].id});
       }
    });

    this.rsync_mode_field = _.find(this.fieldSets[0].config, { 'name': 'rsync_mode' });
    this.taskService.getRsyncModeChoices().subscribe((res) => {
      res.forEach((item) => {
        this.rsync_mode_field.options.push({ label: item[1], value: item[0] });
      });
    });

    this.rsync_direction_field = _.find(this.fieldSets[0].config, { 'name': 'rsync_direction' });
    this.taskService.getRsyncDirectionChoices().subscribe((res) => {
      res.forEach((item) => {
        this.rsync_direction_field.options.push({ label: item[1], value: item[0] });
      });
    });
  }

  afterInit(entityForm) {
    entityForm.formGroup.controls['rsync_mode'].valueChanges.subscribe((res) => {
      if( res === "ssh" ){
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
    value['rsync_minute'] = spl[0];
    value['rsync_hour'] = spl[1];
    value['rsync_daymonth'] = spl[2];
    value['rsync_month'] = spl[3];
    value['rsync_dayweek'] = spl[4];
  }

  resourceTransformIncomingRestData(data) {
    data['rsync_picker'] = data.rsync_minute + " " +
                          data.rsync_hour + " " +
                          data.rsync_daymonth + " " +
                          data.rsync_month + " " +
                          data.rsync_dayweek;
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
