import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';

import helptext from '../../../../helptext/task-calendar/scrub/scrub-form';

@Component({
  selector: 'scrub-task-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, UserService, EntityFormService]
})
export class ScrubFormComponent {

  protected resource_name: string = 'storage/scrub';
  protected route_success: string[] = ['tasks', 'scrub'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  protected preTaskName: string = 'scrub';
  public fieldConfig: FieldConfig[] = [{
      type: 'select',
      name: 'scrub_volume',
      placeholder: helptext.scrub_volume_placeholder,
      tooltip : helptext.scrub_volume_tooltip,
      options: [],
      required: true,
      validation : helptext.scrub_volume_validation,
      value: '',
    }, {
      type: 'input',
      inputType: 'number',
      name: 'scrub_threshold',
      placeholder: helptext.scrub_threshold_placeholder,
      tooltip: helptext.scrub_threshold_tooltip,
      value: 35,
      min: 0,
      required: true,
      validation: helptext.scrub_threshold_validation
    }, {
      type: 'input',
      name: 'scrub_description',
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
      name: 'scrub_enabled',
      placeholder: helptext.scrub_enabled_placeholder,
      tooltip : helptext.scrub_enabled_tooltip,
      value: true,
    }
  ];

  protected volume_field: any;
  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  constructor(protected router: Router, protected taskService: TaskService, protected userService: UserService, protected entityFormService: EntityFormService) {
  }

  preInit() {
    this.volume_field = _.find(this.fieldConfig, { 'name': 'scrub_volume' });
    this.taskService.getVolumeList().subscribe((res) => {
      for (let i in res.data) {
        this.volume_field.options.push({ label: res.data[i].vol_name, value: res.data[i].id });
      };
    });
  }


  afterInit(entityForm) {
    entityForm.formGroup.controls['scrub_volume'].valueChanges.subscribe((res) => {
      if (!Number.isInteger(res)) {
        this.taskService.getVolumeList().subscribe((list) => {
          for (let i in list.data) {
            if (list.data[i].vol_name == res) {
              entityForm.formGroup.controls['scrub_volume'].setValue(list.data[i].id);
            }
          }
        });
      }
    });
  }

  beforeSubmit(value){
    let spl = value.scrub_picker.split(" ");
    delete value.scrub_picker;
    value['scrub_minute'] = spl[0];
    value['scrub_hour'] = spl[1];
    value['scrub_daymonth'] = spl[2];
    value['scrub_month'] = spl[3];
    value['scrub_dayweek'] = spl[4];
  }

  resourceTransformIncomingRestData(data) {
    data['scrub_picker'] = data.scrub_minute + " " + 
                          data.scrub_hour + " " + 
                          data.scrub_daymonth + " " + 
                          data.scrub_month + " " + 
                          data.scrub_dayweek;
    return data;
  }
}
