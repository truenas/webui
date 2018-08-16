import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { TaskService, StorageService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup, Validators } from '@angular/forms';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'smart-test-add',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [TaskService, StorageService, EntityFormService]
})
export class SmartFormComponent {

  protected resource_name: string = 'tasks/smarttest';
  protected route_success: string[] = ['tasks', 'smart'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  protected preTaskName: string = 'smarttest';
  public fieldSets: FieldSet[] = [
    {
      name:'S.M.A.R.T. Test',
      class:'add-cron',
      label:true,
      width:'300px',
      config: [
      {
        type: 'select',
        name: 'smarttest_disks',
        placeholder: T('Disks'),
        tooltip : T('Select the disks to monitor.'),
        options: [],
        multiple: true,
        required: true,
        validation : [ Validators.required ]
      }, {
        type: 'select',
        name: 'smarttest_type',
        placeholder: T('Type'),
        tooltip : T('Choose the test type. See <a\
                   href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
                   target="_blank">smartctl(8)</a> for descriptions of\
                   each type. Some types will degrade performance or\
                   take disks offline. Avoid scheduling S.M.A.R.T. tests\
                   simultaneously with scrub or resilver operations.'),
        options: [],
        required: true,
        validation : [ Validators.required ]
      }, {
        type: 'input',
        name: 'smarttest_desc',
        placeholder: T('Short description'),
        tooltip : T('Enter a description of the S.M.A.R.T. test.'),
      },
      {
        type: 'scheduler',
        name: 'smarttest_picker',
        placeholder: T('Schedule the S.M.A.R.T. Test'),
        tooltip: T('Choose one of the convenient presets\
          or choose <b>Custom</b> to trigger the advanced scheduler UI'),
        validation: [ Validators.required ],
        required: true,
        value: "0 0 * * *",
        noMinutes:true
      }
    ]}
  ];

  protected disk_field: any;
  protected type_field: any;
  protected month_field: any;
  protected day_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  constructor(protected router: Router, protected taskService: TaskService, protected storageService: StorageService, protected entityFormService: EntityFormService, ) {
    this.disk_field = _.find(this.fieldSets[0].config, { 'name': 'smarttest_disks' });
    this.storageService.listDisks().subscribe((res) => {
      for (let i in res) {
        this.disk_field.options.push({ label: res[i].name, value: res[i].identifier })
      }
    });

    this.type_field = _.find(this.fieldSets[0].config, { 'name': 'smarttest_type' });
    this.taskService.getSmarttestTypeChoices().subscribe((res) => {
      res.forEach((item) => {
        this.type_field.options.push({ label: item[1], value: item[0] });
      });
    });
  }

  resourceTransformIncomingRestData(data) {
    data['smarttest_picker'] = "0" + " " + 
                          data.smarttest_hour + " " + 
                          data.smarttest_daymonth + " " + 
                          data.smarttest_month + " " + 
                          data.smarttest_dayweek;
    return data;
  }


  afterInit(entityForm){ 
  }

  beforeSubmit(value){
    const spl = value.smarttest_picker.split(" ");
    delete value.smarttest_picker;
    value['smarttest_hour'] = spl[1];
    value['smarttest_daymonth'] = spl[2];
    value['smarttest_month'] = spl[3];
    value['smarttest_dayweek'] = spl[4];
  }
}
