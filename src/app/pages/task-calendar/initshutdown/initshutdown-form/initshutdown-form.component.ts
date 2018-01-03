import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';

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
    placeholder: 'Type',
    tooltip: 'Select <i>Command</i> (for an executable) or\
 <i>Script</i> (for an executable script)',
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
    placeholder: 'Command',
    tooltip: 'Enter the command plus any desired options.',
  }, {
    type: 'input',
    name: 'ini_script',
    placeholder: 'Script',
    tooltip: 'Enter the location of the script.',
  }, {
    type: 'select',
    name: 'ini_when',
    placeholder: 'When',
    tooltip: 'Select when the command/script runs. Choices are\
 <i>Pre Init</i> (very early in boot process before filesystems are\
 mounted), <i>Post Init</i> (towards end of boot process before FreeNAS\
 services are started), or <i>Shutdown</i>.',
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
  }, {
    type: 'checkbox',
    name: 'ini_enabled',
    placeholder: 'Enable',
    tooltip: 'Uncheck to diable the task.',
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
