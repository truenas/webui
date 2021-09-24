import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import helptext from 'app/helptext/storage/resilver/resilver';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { TaskService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'resilver-priority',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [TaskService],
})
export class ResilverComponent implements FormConfiguration {
  queryCall: 'pool.resilver.config' = 'pool.resilver.config';
  editCall: 'pool.resilver.update' = 'pool.resilver.update';
  route_success: string[] = ['data-protection'];

  fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_resilver,
      class: 'resilver',
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.enabled_placeholder,
          tooltip: helptext.enabled_tooltip,
          value: true,
        },
        {
          type: 'select',
          name: 'begin',
          placeholder: helptext.begin_placeholder,
          tooltip: helptext.begin_tooltip,
          options: [],
          value: '',
        },
        {
          type: 'select',
          name: 'end',
          placeholder: helptext.end_placeholder,
          tooltip: helptext.end_tooltip,
          options: [],
          value: '',
        },
        {
          type: 'select',
          name: 'weekday',
          placeholder: helptext.weekday_placeholder,
          tooltip: helptext.weekday_tooltip,
          multiple: true,
          options: [{
            label: 'Monday',
            value: 1,
          }, {
            label: 'Tuesday',
            value: 2,
          }, {
            label: 'Wednesday',
            value: 3,
          }, {
            label: 'Thursday',
            value: 4,
          }, {
            label: 'Friday',
            value: 5,
          }, {
            label: 'Saturday',
            value: 6,
          }, {
            label: 'Sunday',
            value: 7,
          }],
          value: [1, 2, 3, 4, 5, 6, 7],
          required: true,
          validation: helptext.weekday_validation,
        },
      ],
    },
  ];
  fieldConfig: FieldConfig[];

  constructor(protected router: Router, protected taskService: TaskService) {
    const begin_field = _.find(this.fieldSets[0].config, { name: 'begin' }) as FormSelectConfig;
    const end_field = _.find(this.fieldSets[0].config, { name: 'end' }) as FormSelectConfig;
    const time_options = this.taskService.getTimeOptions();
    for (let i = 0; i < time_options.length; i++) {
      begin_field.options.push({ label: time_options[i].label, value: time_options[i].value });
      end_field.options.push({ label: time_options[i].label, value: time_options[i].value });
    }
  }

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.submitFunction = entityForm.editCall;
  }
}
