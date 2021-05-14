import { Subscription } from 'rxjs';
import { ModalService } from 'app/services/modal.service';
import { Component } from '@angular/core';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService } from '../../../../services';

import helptext from '../../../../helptext/data-protection/scrub/scrub-form';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
@Component({
  selector: 'app-scrub-task-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [TaskService],
})
export class ScrubFormComponent implements FormConfiguration {
  queryCall: 'pool.scrub.query' = 'pool.scrub.query';
  queryKey = 'id';
  pk: number;
  editCall: 'pool.scrub.update' = 'pool.scrub.update';
  addCall: 'pool.scrub.create' = 'pool.scrub.create';
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
          name: 'scrub_picker',
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

  protected volume_field: any;
  protected month_field: any;
  protected day_field: any;
  protected minute_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  constructor(protected taskService: TaskService, protected modalService: ModalService) {}

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.pk = entityForm.pk;
    this.isNew = entityForm.isNew;
    this.title = entityForm.isNew ? helptext.scrub_task_add : helptext.scrub_task_edit;

    this.volume_field = this.fieldSets.config('pool');
    this.taskService.getVolumeList().subscribe((pools) => {
      pools.forEach((pool) => {
        this.volume_field.options.push({ label: pool.name, value: pool.id });
      });
    });

    entityForm.formGroup.controls['pool'].valueChanges.subscribe((res) => {
      if (!Number.isInteger(res)) {
        this.taskService.getVolumeList().subscribe((list: any) => {
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
    const spl = value.scrub_picker.split(' ');
    value.schedule = {};
    value.schedule['minute'] = spl[0];
    value.schedule['hour'] = spl[1];
    value.schedule['dom'] = spl[2];
    value.schedule['month'] = spl[3];
    value.schedule['dow'] = spl[4];
    delete value.scrub_picker;
  }

  resourceTransformIncomingRestData(data: any) {
    this.entityForm.formGroup.controls['threshold'].setValue(data.threshold);
    this.entityForm.formGroup.controls['enabled'].setValue(data.enabled);
    this.entityForm.formGroup.controls['description'].setValue(data.description);
    this.entityForm.formGroup.controls['pool'].setValue(data.id);

    data[
      'scrub_picker'
    ] = `${data.schedule.minute} ${data.schedule.hour} ${data.schedule.dom} ${data.schedule.month} ${data.schedule.dow}`;

    return data;
  }
}
