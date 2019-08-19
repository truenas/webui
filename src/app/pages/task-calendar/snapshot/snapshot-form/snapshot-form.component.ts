import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import helptext from '../../../../helptext/task-calendar/snapshot/snapshot-form';
import { DialogService, StorageService, TaskService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../common/entity/utils';

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
    tooltip: helptext.recursive_tooltip,
    value: true,
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
      label: 'Hours',
      value: 'HOUR',
    }, {
      label: 'Days',
      value: 'DAY',
    }, {
      label: 'Weeks',
      value: 'WEEK',
    }, {
      label: 'Months',
      value: 'MONTH',
    }, {
      label: 'Years',
      value: 'YEAR',
    }],
    value: 'WEEK',
    class: 'inline',
  }, {
    type: 'input',
    name: 'naming_schema',
    placeholder: helptext.naming_schema_placeholder,
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
    value: '09:00',
    required: true,
    validation: [Validators.required],
  }, {
    type: 'select',
    name: 'end',
    placeholder: helptext.end_placeholder,
    tooltip: helptext.end_tooltip,
    options: [],
    value: '18:00',
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
  }];

  constructor(protected router: Router, protected taskService: TaskService,
              protected aroute: ActivatedRoute, protected storageService: StorageService,
              private dialog: DialogService) {
    const datasetField = _.find(this.fieldConfig, { 'name': 'dataset' });

    this.storageService.getDatasetNameOptions().subscribe(
      options => {
        datasetField.options = _.sortBy(options, [o => o.label]);
      },
      error => new EntityUtils().handleWSError(this, error, this.dialog)
    );

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
    data['snapshot_picker'] = 
      data.schedule.minute + " " +
      data.schedule.hour + " " +
      data.schedule.dom + " " +
      data.schedule.month + " " +
      data.schedule.dow;
    data['begin'] = data.schedule.begin;
    data['end'] = data.schedule.end;
    if (data.exclude && Array.isArray(data.exclude) && data.exclude.length > 0) {
      const newline = String.fromCharCode(13, 10);
      data.exclude = data.exclude.join(`,${newline}`);
    } else {
      data.exclude = '';
    }
    return data;
  }

  beforeSubmit(value) {
    const spl = value.snapshot_picker.split(" ");
    delete value.snapshot_picker;

    if (value.exclude && value.exclude.trim()) {
      // filter() needed because: "hello, world,".split(",") === ["hello", "world", ""]
      value.exclude = value.exclude.split(",").map((val: string) => val.trim()).filter((val: string) => !!val);
    } else {
      value.exclude = [];
    }

    value['schedule'] = {
      begin: value['begin'],
      end: value['end'],
      hour: spl[1],
      dom: spl[2],
      month: spl[3],
      dow: spl[4],
      minute: spl[0]
    };
    delete value['begin'];
    delete value['end'];
  }
}
