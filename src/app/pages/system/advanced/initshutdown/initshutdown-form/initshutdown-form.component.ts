import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import helptext from 'app/helptext/system/init-shutdown';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-cron-initshutdown-add',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class InitshutdownFormComponent implements FormConfiguration {
  title: string;
  queryCall: 'initshutdownscript.query' = 'initshutdownscript.query';
  addCall: 'initshutdownscript.create' = 'initshutdownscript.create';
  editCall: 'initshutdownscript.update' = 'initshutdownscript.update';
  customFilter: QueryParams<InitShutdownScript> = [];
  protected entityForm: EntityFormComponent;
  isEntity = true;
  protected isOneColumnForm = true;
  protected type_control: FormControl;
  pk: number;

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
              value: InitShutdownScriptType.Command,
            },
            {
              label: 'Script',
              value: InitShutdownScriptType.Script,
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
              value: InitShutdownScriptWhen.PreInit,
            },
            {
              label: 'Post Init',
              value: InitShutdownScriptWhen.PostInit,
            },
            {
              label: 'Shutdown',
              value: InitShutdownScriptWhen.Shutdown,
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
    this.modalService.getRow$.pipe(take(1)).pipe(untilDestroyed(this)).subscribe((id: string) => {
      this.customFilter = [[['id', '=', id]]];
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.pk = entityForm.pk;
    this.title = entityForm.isNew ? helptext.ini_add : helptext.ini_edit;
    this.type_control = entityForm.formGroup.controls['type'] as FormControl;
    this.type_control.valueChanges.pipe(untilDestroyed(this)).subscribe((value: InitShutdownScriptType) => {
      this.formUpdate(value);
    });

    this.type_control.setValue(InitShutdownScriptType.Command);
  }

  formUpdate(type: InitShutdownScriptType): void {
    const isCommand = type == InitShutdownScriptType.Command;

    this.entityForm.setDisabled('script', isCommand, isCommand);
    this.entityForm.setDisabled('command', !isCommand, !isCommand);
  }
}
