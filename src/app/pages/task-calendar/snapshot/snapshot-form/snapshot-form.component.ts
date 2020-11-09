import { Component, OnDestroy } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import helptext from '../../../../helptext/task-calendar/snapshot/snapshot-form';
import { DialogService, StorageService, TaskService } from '../../../../services/';
import { FieldConfig, UnitType } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'cron-snapshot-task-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService]
})
export class SnapshotFormComponent implements OnDestroy {

  protected queryCall = "pool.snapshottask.query";
  protected addCall = "pool.snapshottask.create";
  protected editCall = "pool.snapshottask.update";
  protected customFilter: Array<any> = [[["id", "="]]];
  protected route_success: string[] = ['tasks', 'snapshot'];
  protected isEntity: boolean = true;
  protected pk: any;
  protected dataset: any;
  protected dataset_disabled = false;
  protected datasetFg: any;
  protected dataset_subscription: any;
  protected save_button_enabled = true;
  protected entityForm;

  public fieldSets: FieldSet[] = [
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
          type: 'checkbox',
          name: 'recursive',
          placeholder: helptext.recursive_placeholder,
          tooltip: helptext.recursive_tooltip,
          value: true,
        }, {
          type: 'chip',
          name: 'exclude',
          placeholder: helptext.exclude_placeholder,
          tooltip: helptext.exclude_tooltip
        },
      ]
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
          value: "2 WEEKS",
          required: true,
          inputUnit: {
            type: UnitType.duration,
            decimal: false,
            default: 'HOUR',
            allowUnits: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']
          }
        }, {
          type: 'input',
          name: 'naming_schema',
          placeholder: helptext.naming_schema_placeholder,
          tooltip: helptext.naming_schema_tooltip,
          value: 'auto-%Y-%m-%d_%H-%M',
          validation: [Validators.required, Validators.pattern('[^/]+')],
        }, {
          type: 'scheduler',
          name: 'snapshot_picker',
          placeholder: helptext.snapshot_picker_placeholder,
          tooltip: helptext.snapshot_picker_tooltip,
          options: ['begin', 'end'],
          validation: [Validators.required],
          required: true,
          value: "0 0 * * *"
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
        }
      ]
    }
  ]
  public fieldConfig: FieldConfig;

  constructor(protected router: Router, protected taskService: TaskService,
              protected aroute: ActivatedRoute, protected storageService: StorageService,
              private dialog: DialogService) {
    const begin_field = _.find(this.fieldSets[1].config, { 'name': 'begin' });
    const end_field = _.find(this.fieldSets[1].config, { 'name': 'end' });
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

  afterInit(entityForm) {
    this.entityForm = entityForm;
    const datasetField = _.find(this.fieldConfig, { 'name': 'dataset' });

    this.storageService.getDatasetNameOptions().subscribe(
      options => {
        if (this.dataset !== undefined && !_.find(options, {'label' : this.dataset})) {
          const disabled_dataset = {'label': this.dataset, 'value': this.dataset, 'disable': true};
          this.dataset_disabled = true;
          options.push(disabled_dataset);

          datasetField.warnings = helptext.dataset_warning;
          this.save_button_enabled = false;
        }
        datasetField.options = _.sortBy(options, [o => o.label]);
      },
      error => new EntityUtils().handleWSError(this, error, this.dialog)
    );
    
    this.datasetFg = entityForm.formGroup.controls['dataset'];
    this.dataset_subscription = this.datasetFg.valueChanges.subscribe(value => {
      if (this.dataset_disabled && this.dataset !== value) {
        this.save_button_enabled = true;
        datasetField.warnings = '';
      }
    });

    entityForm.formGroup.controls['snapshot_picker'].valueChanges.subscribe(value => {
      if (value === '0 0 * * *' || value === '0 0 * * sun' || value === '0 0 1 * *') {
        this.entityForm.setDisabled('begin', true, true);
        this.entityForm.setDisabled('end', true, true);

      } else {
        this.entityForm.setDisabled('begin', false, false);
        this.entityForm.setDisabled('end', false, false);
      }
    })
  }

  ngOnDestroy() {
    if (this.dataset_subscription) {
      this.dataset_subscription.unsubscribe();
    }
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

    this.dataset = data.dataset;
    data['lifetime'] = data['lifetime_value'] + ' ' + data['lifetime_unit'] + (data['lifetime_value'] > 1 ? 'S' : '');
    return data;
  }

  beforeSubmit(value) {
    const lifetime = value.lifetime.split(' ');
    value['lifetime_value'] = lifetime[0];
    value['lifetime_unit'] = _.endsWith(lifetime[1], 'S') ? lifetime[1].substring(0, lifetime[1].length -1) : lifetime[1];
    delete value.lifetime;

    const spl = value.snapshot_picker.split(" ");
    delete value.snapshot_picker;

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
