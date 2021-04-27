import { Component } from '@angular/core';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../../../helptext/system/initshutdown';
import { ModalService } from 'app/services/modal.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-cron-initshutdown-add',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class InitshutdownFormComponent {
  protected title: string;
  protected queryCall = 'initshutdownscript.query';
  protected addCall = 'initshutdownscript.create';
  protected editCall = 'initshutdownscript.update';
  protected customFilter: any[] = [];
  protected entityForm: EntityFormComponent;
  protected isEntity = true;
  protected isOneColumnForm = true;
  protected type_control: any;
  protected pk: any;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.ini_title,
      class: 'add-init',
      label: true,
      config: [
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext.ini_description_placeholder,
          tooltip: helptext.ini_description_tooltip,
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.ini_type_placeholder,
          tooltip: helptext.ini_type_tooltip,
          options: [
            {
              label: 'Command',
              value: 'COMMAND',
            },
            {
              label: 'Script',
              value: 'SCRIPT',
            },
          ],
          value: 'COMMAND',
        },
        {
          type: 'input',
          name: 'command',
          placeholder: helptext.ini_command_placeholder,
          tooltip: helptext.ini_command_tooltip,
          required: true,
          validation: helptext.ini_command_validation,
        },
        {
          type: 'explorer',
          initial: '/mnt',
          name: 'script',
          placeholder: helptext.ini_script_placeholder,
          explorerType: 'file',
          required: true,
          validation: helptext.ini_script_validation,
          tooltip: helptext.ini_script_tooltip,
        },
        {
          type: 'select',
          name: 'when',
          placeholder: helptext.ini_when_placeholder,
          tooltip: helptext.ini_when_tooltip,
          options: [
            {
              label: '---------',
              value: '',
            },
            {
              label: 'Pre Init',
              value: 'PREINIT',
            },
            {
              label: 'Post Init',
              value: 'POSTINIT',
            },
            {
              label: 'Shutdown',
              value: 'SHUTDOWN',
            },
          ],
          value: '',
          required: true,
          validation: helptext.ini_when_validation,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.ini_enabled_placeholder,
          tooltip: helptext.ini_enabled_tooltip,
          value: true,
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'timeout',
          placeholder: helptext.ini_timeout_placeholder,
          tooltip: helptext.ini_timeout_tooltip,
          value: 10,
        },
      ],
    },
  ];

  constructor(protected modalService: ModalService) {
    this.modalService.getRow$.pipe(take(1)).subscribe((id: string) => {
      this.customFilter = [[['id', '=', id]]];
    });
  }

  async afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.pk = entityForm.pk;
    this.title = entityForm.isNew ? helptext.ini_add : helptext.ini_edit;
    this.type_control = entityForm.formGroup.controls['type'];
    this.type_control.valueChanges.subscribe((value: any) => {
      this.formUpdate(value);
    });

    this.type_control.setValue('COMMAND');
  }

  formUpdate(type: any) {
    const isCommand = type == 'COMMAND';

    this.entityForm.setDisabled('script', isCommand, isCommand);
    this.entityForm.setDisabled('command', !isCommand, !isCommand);
  }
}
