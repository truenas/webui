import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';

import helptext from '../../../../helptext/task-calendar/scrub/scrub-form';

@Component({
  selector: 'scrub-task-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class ScrubFormComponent {

  protected queryCall: string = 'pool.scrub.query';
  protected queryKey = 'id';
  protected pk;
  protected editCall = 'pool.scrub.update';
  protected addCall = 'pool.scrub.create';
  protected route_success: string[] = ['tasks', 'scrub'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  protected preTaskName: string = 'scrub';
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name:helptext.scrub_fieldsets[0],
      class:'add-scrub',
      label:true,
      width:'300px',
      config: [
        {
          type: 'select',
          name: 'pool',
          placeholder: helptext.scrub_volume_placeholder,
          tooltip : helptext.scrub_volume_tooltip,
          options: [],
          required: true,
          validation : helptext.scrub_volume_validation,
          value: '',
        }, {
          type: 'input',
          inputType: 'number',
          name: 'threshold',
          placeholder: helptext.scrub_threshold_placeholder,
          tooltip: helptext.scrub_threshold_tooltip,
          value: 35,
          min: 0,
          required: true,
          validation: helptext.scrub_threshold_validation
        }, {
          type: 'input',
          name: 'description',
          placeholder: helptext.scrub_description_placeholder,
          tooltip : helptext.scrub_description_tooltip,
        }, {
          type: 'scheduler',
          name: 'scrub_picker',
          placeholder: helptext.scrub_picker_placeholder,
          tooltip: helptext.scrub_picker_tooltip,
          required: true,
        }, {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.scrub_enabled_placeholder,
          tooltip : helptext.scrub_enabled_tooltip,
          value: true,
        }
      ]
    },
    {
      name:'divider',
      divider:true
    },
  ]

  protected volume_field: any;
  protected month_field: any;
  protected day_field: any;
  protected minute_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  constructor(protected router: Router, protected taskService: TaskService, protected userService: UserService, protected entityFormService: EntityFormService,protected aroute: ActivatedRoute,) {
  }

  preInit(entityForm) {
    this.entityForm = entityForm;

    this.aroute.params.subscribe(params => {
      if (params.pk) {
        this.pk = params.pk;
      }
    });
    
  }


  afterInit(entityForm) {

    this.volume_field = _.find(this.fieldConfig, { 'name': 'pool' });
    this.taskService.getVolumeList().subscribe((res) => {
      for (let i in res.data) {
        this.volume_field.options.push({ label: res.data[i].vol_name, value: res.data[i].id });
      };
    });

    entityForm.formGroup.controls['pool'].valueChanges.subscribe((res) => {
      if (!Number.isInteger(res)) {
        this.taskService.getVolumeList().subscribe((list) => {
          for (let i in list.data) {
            if (list.data[i].vol_name == res) {
              entityForm.formGroup.controls['pool'].setValue(list.data[i].id);
            }
          }
        });
      }
    });

  }

  beforeSubmit(value){
    let spl = value.scrub_picker.split(" ");
    value.schedule = {};
    value.schedule['minute'] = spl[0];
    value.schedule['hour'] = spl[1];
    value.schedule['dom'] = spl[2];
    value.schedule['month'] = spl[3];
    value.schedule['dow'] = spl[4];
    delete value.scrub_picker;
  }

  resourceTransformIncomingRestData(data) {
    this.entityForm.formGroup.controls['threshold'].setValue(data.threshold);
    this.entityForm.formGroup.controls['enabled'].setValue(data.enabled);
    this.entityForm.formGroup.controls['description'].setValue(data.description);
    this.entityForm.formGroup.controls['pool'].setValue(data.id);

    data['scrub_picker'] = data.schedule.minute + " " + 
                          data.schedule.hour + " " + 
                          data.schedule.dom + " " + 
                          data.schedule.month + " " + 
                          data.schedule.dow;
    return data;
  }
}
