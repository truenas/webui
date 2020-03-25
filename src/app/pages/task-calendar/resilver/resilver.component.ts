import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { TaskService } from '../../../services/';
import helptext from '../../../helptext/task-calendar/resilver/resilver';

@Component({
  selector: 'resilver-priority',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService]
})
export class ResilverComponent {

  protected queryCall = 'pool.resilver.config';
  protected editCall = 'pool.resilver.update';

  public fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_resilver,
      class: 'resilver',
      label: true,
      width: '50%',
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
          validation : helptext.weekday_validation
        }
      ]
    }
  ];
  public fieldConfig: FieldConfig[];

  constructor(protected router: Router, protected taskService: TaskService) {
    const begin_field = _.find(this.fieldSets[0].config, { 'name': 'begin' });
    const end_field = _.find(this.fieldSets[0].config, { 'name': 'end' });
    const time_options = this.taskService.getTimeOptions();
    for (let i = 0; i < time_options.length; i++) {
      begin_field.options.push({ label: time_options[i].label, value: time_options[i].value });
      end_field.options.push({ label: time_options[i].label, value: time_options[i].value });
    }
  }

  afterInit(entityForm) {
    entityForm.submitFunction = entityForm.editCall;
  }
}
