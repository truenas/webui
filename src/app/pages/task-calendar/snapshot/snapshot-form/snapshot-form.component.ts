import { Component } from '@angular/core';
import { Router,ActivatedRoute} from '@angular/router';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import helptext from '../../../../helptext/task-calendar/snapshot/snapshot-form';


@Component({
  selector: 'cron-snapshot-task-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService]
})
export class SnapshotFormComponent {

  protected queryCall = "pool.snapshottask.query";
  protected addCall = "pool.snapshottask.create";
  protected editCall = "pool.snapshottask.update";
  protected customFilter: Array<any> = [[["id", "="]]];
  protected route_success: string[] = ['tasks', 'snapshot'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  protected pk: any;

  public fieldConfig: FieldConfig[] = [{
    type: 'select',
    name: 'dataset',
    placeholder: helptext.dataset_placeholder,
    tooltip: helptext.dataset_tooltip,
    options: [],
    required: true,
    validation: [Validators.required],
  }, {
    type: 'checkbox',
    name: 'recursive',
    placeholder: helptext.recursive_placeholder,
    tooltip: helptext.recursive_tooltip
  }, {
    type: 'textarea',
    name: 'exclude',
    placeholder: helptext.exclude_placeholder,
    tooltip: helptext.exclude_tooltip
  }, {
    placeholder: helptext.lifetime_value_placeholder,
    type: 'input',
    name: 'lifetime_value',
    inputType: 'number',
    class: 'inline',
    value: 2,
    validation: [Validators.min(0)]
  }, {
    type: 'select',
    name: 'lifetime_unit',
    tooltip: helptext.lifetime_unit_tooltip,
    options: [{
      label: 'Hour(s)',
      value: 'HOUR',
    }, {
      label: 'Day(s)',
      value: 'DAY',
    }, {
      label: 'Week(s)',
      value: 'WEEK',
    }, {
      label: 'Month(s)',
      value: 'MONTH',
    }, {
      label: 'Year(s)',
      value: 'YEAR',
    }],
    value: 'WEEK',
    class: 'inline',
  }, {
    type: 'input',
    name: 'naming_schema',
    placeholder: helptext.naming_schema_placeholer,
    tooltip: helptext.naming_schema_tooltip,
    value: 'auto-%Y-%m-%d_%H-%M',
  }, {
    type: 'scheduler',
    name: 'snapshot_picker',
    placeholder: helptext.snapshot_picker_placeholder,
    tooltip: helptext.snapshot_picker_tooltip,
    validation: [Validators.required],
    required: true,
    value: "0 0 * * *"
  }, {
    type: 'select',
    name: 'begin',
    placeholder: helptext.begin_placeholder,
    tooltip: helptext.begin_tooltip,
    options: [],
    value: '09:00:00',
    required: true,
    validation: [Validators.required],
  }, {
    type: 'select',
    name: 'end',
    placeholder: helptext.end_placeholder,
    tooltip: helptext.end_tooltip,
    options: [],
    value: '18:00:00',
    required: true,
    validation: [Validators.required],
  }, {
    type: 'checkbox',
    name: 'enabled',
    placeholder: helptext.enabled_placeholder,
    tooltip: helptext.enabled_tooltip,
    value: true,
  }];

  constructor(protected router: Router, protected taskService: TaskService,
              protected aroute: ActivatedRoute) {
    const datasetField = _.find(this.fieldConfig, { 'name': 'dataset' });
    this.taskService.getVolumeList().subscribe((res) => {
      for (let i = 0; i < res.data.length; i++) {
        const volume_list = new EntityUtils().flattenData(res.data[i].children);
        for (const j in volume_list) {
          datasetField.options.push({ label: volume_list[j].path, value: volume_list[j].path });
        }
      }
      datasetField.options = _.sortBy(datasetField.options, [function (o) { return o.label; }]);
    });

    const begin_field = _.find(this.fieldConfig, { 'name': 'begin' });
    const end_field = _.find(this.fieldConfig, { 'name': 'end' });
    const time_options = this.taskService.getTimeOptions();
    for (let i = 0; i < time_options.length; i++) {
      begin_field.options.push({ label: time_options[i].label, value: time_options[i].value });
      end_field.options.push({ label: time_options[i].label, value: time_options[i].value });
    }
  }

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    data['snapshot_picker'] = "0" + " " +
      data.schedule.hour + " " +
      data.schedule.dom + " " +
      data.schedule.month + " " +
      data.schedule.dow;
    data['begin'] = data.schedule.begin;
    data['end'] = data.schedule.end;
    return data;
  }

  beforeSubmit(value) {
    const spl = value.snapshot_picker.split(" ");
    delete value.snapshot_picker;

    value['schedule'] = {
      begin: value['begin'],
      end: value['end'],
      hour: spl[1],
      dom: spl[2],
      month: spl[3],
      dow: spl[4],
    };
    delete value['begin'];
    delete value['end'];
  }
}
