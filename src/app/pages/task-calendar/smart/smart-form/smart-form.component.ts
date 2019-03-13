import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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

  public queryCall = "smart.test.query";
  protected addCall = 'smart.test.create';
  protected editCall = 'smart.test.update';
  protected customFilter: Array<any> = [[["id", "="]]];
  protected route_success: string[] = ['tasks', 'smart'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  public fieldSets: FieldSet[] = [
    {
      name: 'S.M.A.R.T. Test',
      class: 'add-cron',
      label: true,
      width: '300px',
      config: [
        {
          type: 'checkbox',
          name: 'all_disks',
          placeholder: helptext.smarttest_all_disks_placeholder,
          tooltip: helptext.smarttest_all_disks_tooltip,
        },
        {
          type: 'select',
          name: 'disks',
          placeholder: helptext.smarttest_disks_placeholder,
          tooltip: helptext.smarttest_disks_tooltip,
          options: [],
          multiple: true,
          required: true,
          validation: helptext.smarttest_disks_validation,
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'all_disks',
              value: true,
            }]
          }],
        }, {
          type: 'select',
          name: 'type',
          placeholder: helptext.smarttest_type_placeholder,
          tooltip: helptext.smarttest_type_tooltip,
          options: [
            {
              label: 'LONG',
              value: 'LONG',
            },
            {
              label: 'SHORT',
              value: 'SHORT',
            },
            {
              label: 'CONVEYANCE',
              value: 'CONVEYANCE',
            },
            {
              label: 'OFFLINE',
              value: 'OFFLINE',
            }
          ],
          required: true,
          validation: helptext.smarttest_type_validation
        }, {
          type: 'input',
          name: 'desc',
          placeholder: helptext.smarttest_desc_placeholder,
          tooltip: helptext.smarttest_desc_tooltip
        },
        {
          type: 'scheduler',
          name: 'smarttest_picker',
          placeholder: helptext.smarttest_picker_placeholder,
          tooltip: helptext.smarttest_picker_tooltip,
          validation: helptext.smarttest_picker_validation,
          required: true,
          value: "0 0 * * *",
          noMinutes: true
        }
      ]
    }
  ];

  protected disk_field: any;
  protected pk: any;

  constructor(protected router: Router,
              protected taskService: TaskService,
              protected storageService: StorageService,
              protected entityFormService: EntityFormService,
              protected aroute: ActivatedRoute) {
    this.disk_field = _.find(this.fieldSets[0].config, { 'name': 'disks' });
    this.storageService.listDisks().subscribe((res) => {
      for (const i in res) {
        this.disk_field.options.push({ label: res[i].name, value: res[i].identifier })
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    data['smarttest_picker'] = "0" + " " +
      data.schedule.hour + " " +
      data.schedule.dom + " " +
      data.schedule.month + " " +
      data.schedule.dow;
    return data;
  }

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });
  }

  beforeSubmit(value) {
    const spl = value.smarttest_picker.split(" ");
    delete value.smarttest_picker;

    value['schedule'] = {
      hour: spl[1],
      dom: spl[2],
      month: spl[3],
      dow: spl[4],
    };

    if (value.all_disks) {
      value.disks = [];
    }
  }
}
