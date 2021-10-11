import { Component } from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import helptext from 'app/helptext/data-protection/snapshot/snapshot-form';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FormSelectConfig, UnitType } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, StorageService, TaskService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-cron-snapshot-task-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [TaskService],
})
export class SnapshotFormComponent implements FormConfiguration {
  queryKey = 'id';
  queryCall = 'pool.snapshottask.query' as const;
  addCall = 'pool.snapshottask.create' as const;
  editCall = 'pool.snapshottask.update' as const;
  isEntity = true;
  pk: number;
  protected dataset: string;
  protected dataset_disabled = false;
  protected datasetFg: AbstractControl;
  save_button_enabled = true;
  protected entityForm: EntityFormComponent;
  title: string;
  isNew = false;

  fieldSets: FieldSets = new FieldSets([
    {
      name: helptext.fieldset_dataset,
      class: 'dataset',
      label: true,
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'dataset',
          placeholder: helptext.dataset_placeholder,
          tooltip: helptext.dataset_tooltip,
          options: [],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'chip',
          name: 'exclude',
          placeholder: helptext.exclude_placeholder,
          tooltip: helptext.exclude_tooltip,
        }, {
          type: 'checkbox',
          name: 'recursive',
          placeholder: helptext.recursive_placeholder,
          tooltip: helptext.recursive_tooltip,
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
          type: 'input',
          name: 'lifetime',
          placeholder: helptext.lifetime_placeholder,
          tooltip: helptext.lifetime_tooltip,
          value: '2 WEEKS',
          required: true,
          inputUnit: {
            type: UnitType.Duration,
            decimal: false,
            default: 'HOUR',
            allowUnits: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'],
          },
        }, {
          type: 'input',
          name: 'naming_schema',
          placeholder: helptext.naming_schema_placeholder,
          tooltip: helptext.naming_schema_tooltip,
          value: 'auto-%Y-%m-%d_%H-%M',
          validation: [Validators.required, Validators.pattern('[^/]+')],
        }, {
          type: 'scheduler',
          name: 'cron_schedule',
          placeholder: helptext.snapshot_picker_placeholder,
          tooltip: helptext.snapshot_picker_tooltip,
          options: ['begin', 'end'],
          validation: [Validators.required],
          required: true,
          value: '0 0 * * *',
        }, {
          type: 'select',
          name: 'begin',
          placeholder: helptext.begin_placeholder,
          tooltip: helptext.begin_tooltip,
          options: [],
          value: '00:00',
          required: true,
          validation: [Validators.required],
        }, {
          type: 'select',
          name: 'end',
          placeholder: helptext.end_placeholder,
          tooltip: helptext.end_tooltip,
          options: [],
          value: '23:59',
          required: true,
          validation: [Validators.required],
        }, {
          type: 'checkbox',
          name: 'allow_empty',
          placeholder: helptext.allow_empty_placeholder,
          tooltip: helptext.allow_empty_tooltip,
          value: true,
        }, {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.enabled_placeholder,
          tooltip: helptext.enabled_tooltip,
          value: true,
        },
      ],
    },
    { name: 'divider', divider: true },
  ]);

  constructor(protected taskService: TaskService,
    protected storageService: StorageService,
    protected dialog: DialogService,
    protected modalService: ModalService) {
    const begin_field = this.fieldSets.config('begin') as FormSelectConfig;
    const end_field = this.fieldSets.config('end') as FormSelectConfig;
    const time_options = this.taskService.getTimeOptions();
    time_options.forEach((option) => {
      begin_field.options.push({ label: option.label, value: option.value });
      end_field.options.push({ label: option.label, value: option.value });
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.pk = entityForm.pk;
    this.isNew = entityForm.isNew;
    this.title = this.isNew ? helptext.snapshot_task_add : helptext.snapshot_task_edit;

    const datasetField = this.fieldSets.config('dataset') as FormSelectConfig;

    this.storageService.getDatasetNameOptions().pipe(untilDestroyed(this)).subscribe(
      (options) => {
        if (this.dataset !== undefined && !_.find(options, { label: this.dataset })) {
          const disabled_dataset = { label: this.dataset, value: this.dataset, disable: true };
          this.dataset_disabled = true;
          options.push(disabled_dataset);

          datasetField.warnings = helptext.dataset_warning;
          this.save_button_enabled = false;
        }
        datasetField.options = _.sortBy(options, [(o) => o.label]);
      },
      (error) => new EntityUtils().handleWSError(this, error, this.dialog),
    );

    this.datasetFg = entityForm.formGroup.controls['dataset'];

    this.datasetFg.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      if (this.dataset_disabled && this.dataset !== value) {
        this.save_button_enabled = true;
        datasetField.warnings = '';
      }
    });

    entityForm.formGroup.controls['cron_schedule'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value === '0 0 * * *' || value === '0 0 * * sun' || value === '0 0 1 * *') {
        this.entityForm.setDisabled('begin', true, true);
        this.entityForm.setDisabled('end', true, true);
      } else {
        this.entityForm.setDisabled('begin', false, false);
        this.entityForm.setDisabled('end', false, false);
      }
    });
  }

  resourceTransformIncomingRestData(data: PeriodicSnapshotTask): any {
    this.dataset = data.dataset;
    return {
      ...data,
      cron_schedule: `${data.schedule.minute} ${data.schedule.hour} ${data.schedule.dom} ${data.schedule.month} ${data.schedule.dow}`,
      begin: data.schedule.begin,
      end: data.schedule.end,
      lifetime: data.lifetime_value + ' ' + data.lifetime_unit + (data.lifetime_value > 1 ? 'S' : ''),
    };
  }

  beforeSubmit(value: any): void {
    const lifetime = value.lifetime.split(' ');
    value['lifetime_value'] = lifetime[0];
    value['lifetime_unit'] = _.endsWith(lifetime[1], 'S') ? lifetime[1].substring(0, lifetime[1].length - 1) : lifetime[1];
    delete value.lifetime;

    const spl = value.cron_schedule.split(' ');
    delete value.cron_schedule;

    value['schedule'] = {
      begin: value['begin'],
      end: value['end'],
      hour: spl[1],
      dom: spl[2],
      month: spl[3],
      dow: spl[4],
      minute: spl[0],
    };
    delete value['begin'];
    delete value['end'];
  }

  dataHandler(entity: EntityFormComponent): void {
    // Setup cron_schedule
    const schedule = entity.wsResponse.schedule;
    if (Number(entity.wsResponse.id) !== Number(this.pk)) console.error({ id: entity.wsResponse.id, pk: this.pk });
    const formatted = schedule.minute + ' ' + schedule.hour + ' ' + schedule.dom + ' ' + schedule.month + ' ' + schedule.dow;
    const cronField = entity.formGroup.controls['cron_schedule'];
    cronField.setValue(formatted);
    const cronEntity = entity.fieldConfig.find((field) => field.name == 'cron_schedule');
    cronEntity.value = formatted;

    // Setup all the other fields
    for (const [key] of Object.entries(entity.wsResponse)) {
      const field = entity.formGroup.controls[key];
      if (field && key !== 'schedule') {
        field.setValue(entity.wsResponse[key]);
      }
    }
  }
}
