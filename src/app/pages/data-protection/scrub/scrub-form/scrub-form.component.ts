import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/data-protection/scrub/scrub-form';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { PoolScrub } from 'app/interfaces/pool-scrub.interface';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { TaskService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-scrub-task-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [TaskService],
})
export class ScrubFormComponent implements FormConfiguration {
  queryCall = 'pool.scrub.query' as const;
  queryKey = 'id';
  pk: number;
  editCall = 'pool.scrub.update' as const;
  addCall = 'pool.scrub.create' as const;
  protected entityForm: EntityFormComponent;
  isEntity = true;
  protected preTaskName = 'scrub';
  protected isOneColumnForm = true;
  title: string;
  isNew = false;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSets = new FieldSets([
    {
      name: helptext.scrub_fieldsets[0],
      class: 'add-scrub',
      label: true,
      config: [
        {
          type: 'select',
          name: 'pool',
          placeholder: helptext.scrub_volume_placeholder,
          tooltip: helptext.scrub_volume_tooltip,
          options: [],
          required: true,
          validation: helptext.scrub_volume_validation,
          value: '',
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'threshold',
          placeholder: helptext.scrub_threshold_placeholder,
          tooltip: helptext.scrub_threshold_tooltip,
          value: 35,
          min: 0,
          required: true,
          validation: helptext.scrub_threshold_validation,
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.scrub_description_placeholder,
          tooltip: helptext.scrub_description_tooltip,
        },
        {
          type: 'scheduler',
          name: 'cron_schedule',
          placeholder: helptext.scrub_picker_placeholder,
          tooltip: helptext.scrub_picker_tooltip,
          required: true,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.scrub_enabled_placeholder,
          tooltip: helptext.scrub_enabled_tooltip,
          value: true,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ]);

  protected volumeField: FormSelectConfig;

  constructor(protected taskService: TaskService, protected modalService: ModalService) {}

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.pk = entityForm.pk;
    this.isNew = entityForm.isNew;
    this.title = entityForm.isNew ? helptext.scrub_task_add : helptext.scrub_task_edit;

    this.volumeField = this.fieldSets.config('pool') as FormSelectConfig;
    this.taskService.getVolumeList().pipe(untilDestroyed(this)).subscribe((pools) => {
      pools.forEach((pool) => {
        this.volumeField.options.push({ label: pool.name, value: pool.id });
      });
    });

    entityForm.formGroup.controls['pool'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (!Number.isInteger(res)) {
        this.taskService.getVolumeList().pipe(untilDestroyed(this)).subscribe((list: any) => {
          // TODO: Weird typing.
          for (const i in list.data) {
            if (list.data[i].vol_name === res) {
              entityForm.formGroup.controls['pool'].setValue(list.data[i].id);
            }
          }
        });
      }
    });
  }

  beforeSubmit(value: any): void {
    const spl = value.cron_schedule.split(' ');
    value.schedule = {};
    value.schedule['minute'] = spl[0];
    value.schedule['hour'] = spl[1];
    value.schedule['dom'] = spl[2];
    value.schedule['month'] = spl[3];
    value.schedule['dow'] = spl[4];
    delete value.cron_schedule;
  }

  resourceTransformIncomingRestData(data: PoolScrub): PoolScrub & { cron_schedule: string } {
    this.entityForm.formGroup.controls['threshold'].setValue(data.threshold);
    this.entityForm.formGroup.controls['enabled'].setValue(data.enabled);
    this.entityForm.formGroup.controls['description'].setValue(data.description);
    this.entityForm.formGroup.controls['pool'].setValue(data.id);

    return {
      ...data,
      cron_schedule: `${data.schedule.minute} ${data.schedule.hour} ${data.schedule.dom} ${data.schedule.month} ${data.schedule.dow}`,
    };
  }

  dataHandler(entity: EntityFormComponent): void {
    // Setup cron_schedule
    const schedule = entity.wsResponse.schedule;
    if (Number(entity.wsResponse.id) !== Number(this.pk)) console.error({ id: entity.wsResponse.id, pk: this.pk });
    const formatted = schedule.minute + ' ' + schedule.hour + ' ' + schedule.dom + ' ' + schedule.month + ' ' + schedule.dow;
    const cronField = entity.formGroup.controls['cron_schedule'];
    cronField.setValue(formatted);
    const cronEntity = entity.fieldConfig.find((field) => field.name === 'cron_schedule');
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
