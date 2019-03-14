import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import helptext from '../../../../helptext/task-calendar/initshutdown/initshutdown';

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
    placeholder: helptext.ini_type_placeholder,
    tooltip: helptext.ini_type_tooltip,
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
    placeholder: helptext.ini_command_placeholder,
    tooltip: helptext.ini_command_tooltip,
    required: true,
    validation : helptext.ini_command_validation,
  }, {
    type : 'explorer',
    initial: '/mnt',
    name: 'ini_script',
    placeholder: helptext.ini_script_placeholder,
    explorerType: 'file',
    required: true,
    validation : helptext.ini_script_validation,
    tooltip: helptext.ini_script_tooltip,
  }, {
    type: 'select',
    name: 'ini_when',
    placeholder: helptext.ini_when_placeholder,
    tooltip: helptext.ini_when_tooltip,
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
    validation : helptext.ini_when_validation,
  }, {
    type: 'checkbox',
    name: 'ini_enabled',
    placeholder: helptext.ini_enabled_placeholder,
    tooltip: helptext.ini_enabled_tooltip,
    value: true,
  }, {
    type: 'input',
    inputType: 'number',
    name: 'ini_timeout',
    placeholder: helptext.ini_timeout_placeholder,
    tooltip: helptext.ini_timeout_tooltip,
    value: 10,
  }];

  protected type_control: any;

  constructor(protected router: Router, protected taskService: TaskService, protected userService: UserService, protected entityFormService: EntityFormService, ) {}

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.type_control = entityForm.formGroup.controls['ini_type'];
    this.type_control.valueChanges.subscribe((value) => {
      this.formUpdate(value);
    });

    this.type_control.setValue('command');
  }

  formUpdate(type) {
    let isCommand = type == 'command' ? true : false;

    this.entityForm.setDisabled('ini_script', isCommand, isCommand);
    this.entityForm.setDisabled('ini_command', !isCommand, !isCommand);
  }
}
