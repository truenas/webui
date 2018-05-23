import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup, Validators } from '@angular/forms';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'cron-initshutdown-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class InitshutdownFormComponent {

  protected resource_name: string = 'tasks/initshutdown';
  protected route_success: string[] = ['tasks', 'initshutdown'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
    type: 'select',
    name: 'ini_type',
    placeholder: T('Type'),
    tooltip: T('Select <i>Command</i> for an executable or\
                <i>Script</i> for an executable script.'),
    options: [{
      label: 'Command',
      value: 'command',
    }, {
      label: 'Script',
      value: 'script',
    }],
    value: 'command',
  }, {
    type: 'input',
    name: 'ini_command',
    placeholder: T('Command'),
    tooltip: T('Enter the command and any options.'),
    required: true,
    validation : [ Validators.required ],
  }, {
    type : 'explorer',
    initial: '/mnt',
    name: 'ini_script',
    placeholder: T('Script'),
    explorerType: 'file',
    tooltip: T('Browse to the script location.'),
  }, {
    type: 'select',
    name: 'ini_when',
    placeholder: T('When'),
    tooltip: T('Select when the command or script runs. <i>Pre Init</i>\
                is very early in the boot process before mounting\
                filesystems, <i>Post Init</i> is towards the end of the\
                boot process before FreeNAS services start, or at\
                <i>Shutdown</i>.'),
    options: [{
      label: '---------',
      value: '',
    }, {
      label: 'Pre Init',
      value: 'preinit',
    }, {
      label: 'Post Init',
      value: 'postinit',
    }, {
      label: 'Shutdown',
      value: 'shutdown',
    }],
    value: '',
    required: true,
    validation : [ Validators.required ],
  }, {
    type: 'checkbox',
    name: 'ini_enabled',
    placeholder: T('Enabled'),
    tooltip: T('Unset to diable the task without deleting it.'),
    value: true,
  }];

  protected type_control: any;

  constructor(protected router: Router, protected taskService: TaskService, protected userService: UserService, protected entityFormService: EntityFormService, ) {}

  afterInit(entityForm: any) {
    this.type_control = entityForm.formGroup.controls['ini_type'];
    this.type_control.valueChanges.subscribe((value) => {
      this.formUpdate(value);
    });

    this.type_control.setValue('command');
  }

  formUpdate(type) {
    let isCommand = type == 'command' ? true : false;

    let script_control = _.find(this.fieldConfig, { 'name': 'ini_script' });
    script_control.isHidden = isCommand;

    let command_control = _.find(this.fieldConfig, { 'name': 'ini_command' });
    command_control.isHidden = !isCommand;
  }
}
