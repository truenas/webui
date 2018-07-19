import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { EntityTaskComponent } from '../../../common/entity/entity-task';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService } from '../../../../services';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup, Validators } from '@angular/forms';
import { T } from '../../../../translate-marker';

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
      placeholder: T('Pool'),
      tooltip : T('Choose a pool to scrub.'),
      options: [],
      required: true,
      validation : [ Validators.required ],
      value: '',
    }, {
      type: 'input',
      inputType: 'number',
      name: 'scrub_threshold',
      placeholder: T('Threshold days'),
      tooltip: T('Define the number of days to prevent a scrub from\
                  running after the last has completed. This ignores any\
                  other calendar schedule. The default is a multiple of\
                  7 to ensure the scrub always occurs on the same\
                  weekday.'),
      value: 35,
      min: 0,
      required: true,
      validation: [ Validators.min(0), Validators.required ]
    }, {
      type: 'input',
      name: 'scrub_description',
      placeholder: T('Description'),
      tooltip : T('Describe the scrub task.'),
    }, {
      type: 'scheduler',
      name: 'scrub_picker',
      placeholder: T('Schedule the Scrub Task'),
      tooltip: T('Choose one of the convenient presets\
        or choose <b>Custom</b> to trigger the advanced scheduler UI'),
      required: true,
    }, {
      type: 'checkbox',
      name: 'scrub_enabled',
      placeholder: T('Enabled'),
      tooltip : T('Unset to disable the scheduled scrub without\
                   deleting it.'),
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
