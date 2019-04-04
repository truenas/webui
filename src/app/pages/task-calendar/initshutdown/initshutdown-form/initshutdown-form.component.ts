import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/task-calendar/initshutdown/initshutdown';

@Component({
  selector: 'cron-initshutdown-add',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class InitshutdownFormComponent {

  protected queryCall = 'initshutdownscript.query';
  protected addCall = 'initshutdownscript.create';
  protected editCall = 'initshutdownscript.update';
  protected customFilter: Array<any> = [[["id", "="]]];
  protected route_success: string[] = ['tasks', 'initshutdown'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
    type: 'select',
    name: 'type',
    placeholder: helptext.ini_type_placeholder,
    tooltip: helptext.ini_type_tooltip,
    options: [{
      label: 'Command',
      value: 'COMMAND',
    }, {
      label: 'Script',
      value: 'SCRIPT',
    }],
    value: 'COMMAND',
  }, {
    type: 'input',
    name: 'command',
    placeholder: helptext.ini_command_placeholder,
    tooltip: helptext.ini_command_tooltip,
    required: true,
    validation : helptext.ini_command_validation,
  }, {
    type : 'explorer',
    initial: '/mnt',
    name: 'script',
    placeholder: helptext.ini_script_placeholder,
    explorerType: 'file',
    required: true,
    validation : helptext.ini_script_validation,
    tooltip: helptext.ini_script_tooltip,
  }, {
    type: 'select',
    name: 'when',
    placeholder: helptext.ini_when_placeholder,
    tooltip: helptext.ini_when_tooltip,
    options: [{
      label: '---------',
      value: '',
    }, {
      label: 'Pre Init',
      value: 'PREINIT',
    }, {
      label: 'Post Init',
      value: 'POSTINIT',
    }, {
      label: 'Shutdown',
      value: 'SHUTDOWN',
    }],
    value: '',
    required: true,
    validation : helptext.ini_when_validation,
  }, {
    type: 'checkbox',
    name: 'enabled',
    placeholder: helptext.ini_enabled_placeholder,
    tooltip: helptext.ini_enabled_tooltip,
    value: true,
  }, {
    type: 'input',
    inputType: 'number',
    name: 'timeout',
    placeholder: helptext.ini_timeout_placeholder,
    tooltip: helptext.ini_timeout_tooltip,
    value: 10,
  }];

  protected type_control: any;
  protected pk: any;
  constructor(protected aroute: ActivatedRoute) {}

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.type_control = entityForm.formGroup.controls['type'];
    this.type_control.valueChanges.subscribe((value) => {
      this.formUpdate(value);
    });

    this.type_control.setValue('COMMAND');
  }

  formUpdate(type) {
    let isCommand = type == 'COMMAND' ? true : false;

    this.entityForm.setDisabled('script', isCommand, isCommand);
    this.entityForm.setDisabled('command', !isCommand, !isCommand);
  }
}
