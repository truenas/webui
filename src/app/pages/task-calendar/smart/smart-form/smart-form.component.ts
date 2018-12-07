import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { TaskService, StorageService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import helptext from '../../../../helptext/task-calendar/smart/smart-form';

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
        placeholder: helptext.smarttest_disks_placeholder,
        tooltip : helptext.smarttest_disks_tooltip,
        options: [],
        multiple: true,
        required: true,
        validation : helptext.smarttest_disks_validation
      }, {
        type: 'select',
        name: 'smarttest_type',
        placeholder: helptext.smarttest_type_placeholder,
        tooltip : helptext.smarttest_type_tooltip,
        options: [],
        required: true,
        validation : helptext.smarttest_type_validation
      }, {
        type: 'input',
        name: 'smarttest_desc',
        placeholder: helptext.smarttest_desc_placeholder,
        tooltip : helptext.smarttest_desc_tooltip
      },
      {
        type: 'scheduler',
        name: 'smarttest_picker',
        placeholder: helptext.smarttest_picker_placeholder,
        tooltip: helptext.smarttest_picker_tooltip,
        validation: helptext.smarttest_picker_validation,
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
