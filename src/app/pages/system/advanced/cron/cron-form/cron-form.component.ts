import { Component, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import helptext from 'app/helptext/system/cron-form';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormComboboxConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { UserService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-cron-job-add',
  templateUrl: './cron-form.component.html',
  styleUrls: ['cron-form.component.scss'],
  providers: [UserService],
})
export class CronFormComponent implements FormConfiguration {
  title: string;
  queryCall = 'cronjob.query' as const;
  queryKey = 'id';
  editCall = 'cronjob.update' as const;
  addCall = 'cronjob.create' as const;
  pk: number;
  protected user_field: FormComboboxConfig;
  protected isOneColumnForm = true;
  isEntity = true;

  isNew = false;
  entityForm: EntityFormComponent;
  error: string;
  fieldConfig: FieldConfig[] = [];
  fieldSetDisplay = 'no-margins';

  fieldSets: FieldSet[] = [
    {
      name: helptext.cron_fieldsets[0],
      class: 'add-cron',
      label: true,
      config: [
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.cron_description_placeholder,
          tooltip: helptext.cron_description_tooltip,
        },
        {
          type: 'input',
          name: 'command',
          placeholder: helptext.cron_command_placeholder,
          required: true,
          validation: helptext.cron_command_validation,
          tooltip: helptext.cron_command_tooltip,
        },
        {
          type: 'combobox',
          name: 'user',
          placeholder: helptext.cron_user_placeholder,
          tooltip: helptext.cron_user_tooltip,
          options: [],
          required: true,
          validation: helptext.cron_user_validation,
          searchOptions: [],
          parent: this,
          updater: (value: string) => this.updateUserSearchOptions(value),
        },
        {
          type: 'scheduler',
          name: 'cron_picker',
          placeholder: helptext.cron_picker_placeholder,
          tooltip: helptext.cron_picker_tooltip,
          validation: helptext.cron_picker_validation,
          required: true,
          value: '0 0 * * *',
        },
        {
          type: 'checkbox',
          name: 'stdout',
          placeholder: helptext.cron_stdout_placeholder,
          tooltip: helptext.cron_stdout_tooltip,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'stderr',
          placeholder: helptext.cron_stderr_placeholder,
          tooltip: helptext.cron_stderr_tooltip,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.cron_enabled_placeholder,
          tooltip: helptext.cron_enabled_tooltip,
          value: true,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  @ViewChild('form', { static: true }) form: EntityFormComponent;

  constructor(protected userService: UserService, protected modalService: ModalService) {}

  updateUserSearchOptions(value = ''): void {
    this.userService.userQueryDsCache(value).pipe(untilDestroyed(this)).subscribe((users) => {
      this.user_field.searchOptions = users.map((user) => {
        return { label: user.username, value: user.username };
      });
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.pk = entityForm.pk;
    this.isNew = entityForm.isNew;
    this.title = entityForm.isNew ? helptext.cron_job_add : helptext.cron_job_edit;

    // Setup user field options
    this.user_field = _.find(this.fieldSets[0].config, { name: 'user' }) as FormComboboxConfig;
    this.userService.userQueryDsCache().pipe(untilDestroyed(this)).subscribe((users) => {
      for (const user of users) {
        this.user_field.options.push({
          label: user.username,
          value: user.username,
        });
      }
    });
  }

  resourceTransformIncomingRestData(data: Cronjob): Cronjob & { cron_picker: string } {
    const schedule = data['schedule'];
    return {
      ...data,
      cron_picker: `${schedule.minute} ${schedule.hour} ${schedule.dom} ${schedule.month} ${schedule.dow}`,
    };
  }

  beforeSubmit(value: { cron_picker: string; schedule?: Schedule }): void {
    const spl = value.cron_picker.split(' ');
    delete value.cron_picker;
    const schedule: Schedule = {};
    schedule['minute'] = spl[0];
    schedule['hour'] = spl[1];
    schedule['dom'] = spl[2];
    schedule['month'] = spl[3];
    schedule['dow'] = spl[4];
    value['schedule'] = schedule;
  }
}
