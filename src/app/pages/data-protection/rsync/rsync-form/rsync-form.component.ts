import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Direction } from 'app/enums/direction.enum';
import { RsyncMode } from 'app/enums/rsync-mode.enum';
import helptext from 'app/helptext/data-protection/resync/resync-form';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormComboboxConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-rsync-task-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [TaskService, UserService],
})
export class RsyncFormComponent implements FormConfiguration {
  addCall: 'rsynctask.create' = 'rsynctask.create';
  editCall: 'rsynctask.update' = 'rsynctask.update';
  queryCall: 'rsynctask.query' = 'rsynctask.query';
  queryKey = 'id';
  protected entityForm: EntityFormComponent;
  pk: number;
  isEntity = true;
  title: string;
  isNew: boolean;

  protected preTaskName = 'rsync';
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSets = new FieldSets([
    {
      name: helptext.fieldset_source,
      class: 'source',
      label: true,
      width: '50%',
      config: [
        {
          type: 'explorer',
          initial: '/mnt',
          name: 'path',
          explorerType: 'file',
          placeholder: helptext.rsync_path_placeholder,
          tooltip: helptext.rsync_path_tooltip,
          required: true,
          validation: helptext.rsync_path_validation,
        },
        {
          type: 'combobox',
          name: 'user',
          placeholder: helptext.rsync_user_placeholder,
          tooltip: helptext.rsync_user_tooltip,
          options: [],
          required: true,
          validation: helptext.rsync_user_validation,
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
        },
        {
          type: 'select',
          name: 'direction',
          placeholder: helptext.rsync_direction_placeholder,
          tooltip: helptext.rsync_direction_tooltip,
          options: [
            { label: T('Push'), value: Direction.Push },
            { label: T('Pull'), value: Direction.Pull },
          ],
          required: true,
          validation: helptext.rsync_direction_validation,
        },
        {
          type: 'input',
          name: 'desc',
          placeholder: helptext.rsync_description_placeholder,
          tooltip: helptext.rsync_description_tooltip,
        },
      ],
    },
    {
      name: helptext.fieldset_remote,
      class: 'remote',
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'remotehost',
          placeholder: helptext.rsync_remotehost_placeholder,
          required: true,
          validation: helptext.rsync_remotehost_validation,
          tooltip: helptext.rsync_remotehost_tooltip,
        },
        {
          type: 'select',
          name: 'mode',
          placeholder: helptext.rsync_mode_placeholder,
          tooltip: helptext.rsync_mode_tooltip,
          options: [
            { label: 'Module', value: 'MODULE' },
            { label: 'SSH', value: 'SSH' },
          ],
          value: 'MODULE',
        },
        {
          type: 'input',
          name: 'remoteport',
          placeholder: helptext.rsync_remoteport_placeholder,
          value: 22,
          required: true,
          tooltip: helptext.rsync_remoteport_tooltip,
          validation: helptext.rsync_remoteport_validation,
        },
        {
          type: 'input',
          name: 'remotemodule',
          placeholder: helptext.rsync_remotemodule_placeholder,
          tooltip: helptext.rsync_remotemodule_tooltip,
          required: true,
          validation: helptext.rsync_remotemodule_validation,
        },
        {
          type: 'explorer',
          initial: '/mnt',
          name: 'remotepath',
          explorerType: 'directory',
          placeholder: helptext.rsync_remotepath_placeholder,
          tooltip: helptext.rsync_remotepath_tooltip,
        },
        {
          type: 'checkbox',
          name: 'validate_rpath',
          placeholder: helptext.rsync_validate_rpath_placeholder,
          tooltip: helptext.rsync_validate_rpath_tooltip,
          value: true,
        },
      ],
    },
    {
      name: helptext.fieldset_schedule,
      class: 'schedule',
      label: true,
      width: '50%',
      config: [
        {
          type: 'scheduler',
          name: 'cron_schedule',
          placeholder: helptext.rsync_picker_placeholder,
          tooltip: helptext.rsync_picker_tooltip,
          required: true,
        },
        {
          type: 'checkbox',
          name: 'recursive',
          placeholder: helptext.rsync_recursive_placeholder,
          tooltip: helptext.rsync_recursive_tooltip,
          value: true,
        },
      ],
    },
    {
      name: helptext.fieldset_options,
      class: 'options',
      label: true,
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'times',
          placeholder: helptext.rsync_times_placeholder,
          tooltip: helptext.rsync_times_tooltip,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'compress',
          placeholder: helptext.rsync_compress_placeholder,
          tooltip: helptext.rsync_compress_tooltip,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'archive',
          placeholder: helptext.rsync_archive_placeholder,
          tooltip: helptext.rsync_archive_tooltip,
        },
        {
          type: 'checkbox',
          name: 'delete',
          placeholder: helptext.rsync_delete_placeholder,
          tooltip: helptext.rsync_delete_tooltip,
        },
        {
          type: 'checkbox',
          name: 'quiet',
          placeholder: helptext.rsync_quiet_placeholder,
          tooltip: helptext.rsync_quiet_tooltip,
        },
        {
          type: 'checkbox',
          name: 'preserveperm',
          placeholder: helptext.rsync_preserveperm_placeholder,
          tooltip: helptext.rsync_preserveperm_tooltip,
        },
        {
          type: 'checkbox',
          name: 'preserveattr',
          placeholder: helptext.rsync_preserveattr_placeholder,
          tooltip: helptext.rsync_preserveattr_tooltip,
        },
        {
          type: 'checkbox',
          name: 'delayupdates',
          placeholder: helptext.rsync_delayupdates_placeholder,
          tooltip: helptext.rsync_delayupdates_tooltip,
          value: true,
        },
        {
          type: 'chip',
          name: 'extra',
          placeholder: helptext.rsync_extra_placeholder,
          tooltip: helptext.rsync_extra_tooltip,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.rsync_enabled_placeholder,
          tooltip: helptext.rsync_enabled_tooltip,
          value: true,
        },
      ],
    },
    { name: 'divider', divider: true },
  ]);

  protected rsync_module_field: string[] = ['remotemodule'];
  protected rsync_ssh_field: string[] = ['remoteport', 'remotepath', 'validate_rpath'];
  protected user_field: FormComboboxConfig;

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected userService: UserService,
    protected modalService: ModalService,
  ) {}

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.isNew = entityForm.isNew;
    this.title = entityForm.isNew ? helptext.rsync_task_add : helptext.rsync_task_edit;

    this.user_field = this.fieldSets.config('user') as FormComboboxConfig;
    this.userService.userQueryDSCache().pipe(untilDestroyed(this)).subscribe((items) => {
      for (let i = 0; i < items.length; i++) {
        this.user_field.options.push({
          label: items[i].username,
          value: items[i].username,
        });
      }
    });

    this.hideFields(entityForm.formGroup.controls['mode'].value);
    entityForm.formGroup.controls['mode'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.hideFields(res);
    });
  }

  beforeSubmit(value: any): void {
    const spl = value.cron_schedule.split(' ');
    delete value.cron_schedule;
    const schedule: Schedule = {};
    schedule['minute'] = spl[0];
    schedule['hour'] = spl[1];
    schedule['dom'] = spl[2];
    schedule['month'] = spl[3];
    schedule['dow'] = spl[4];
    value['schedule'] = schedule;
  }

  resourceTransformIncomingRestData(data: RsyncTaskUi): RsyncTaskUi {
    return {
      ...data,
      cron_schedule: `${data.schedule.minute} ${data.schedule.hour} ${data.schedule.dom} ${data.schedule.month} ${data.schedule.dow}`,
    };
  }

  updateUserSearchOptions(value = '', parent: this): void {
    parent.userService.userQueryDSCache(value).pipe(untilDestroyed(this)).subscribe((items) => {
      const users: Option[] = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      parent.user_field.searchOptions = users;
    });
  }

  hideFields(mode: RsyncMode): void {
    let hide_fields;
    let show_fields;
    if (mode === RsyncMode.Ssh) {
      hide_fields = this.rsync_module_field;
      show_fields = this.rsync_ssh_field;
    } else {
      hide_fields = this.rsync_ssh_field;
      show_fields = this.rsync_module_field;
    }
    for (let i = 0; i < hide_fields.length; i++) {
      this.entityForm.setDisabled(hide_fields[i], true, true);
    }
    for (let i = 0; i < show_fields.length; i++) {
      this.entityForm.setDisabled(show_fields[i], false, false);
    }
  }
}
