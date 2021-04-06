import { Component } from '@angular/core';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { WebSocketService } from '../../../../services';
import { ModalService } from '../../../../services/modal.service';
import { FieldSets } from '../../../common/entity/entity-form/classes/field-sets';
import helptext from '../../../../helptext/data-protection/smart/smart';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-smart-test-add',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class SmartFormComponent {
  protected queryCall = "smart.test.query";
  protected addCall = 'smart.test.create';
  protected editCall = 'smart.test.update';
  protected customFilter: Array<any> = [];
  // protected route_success: string[] = ['tasks', 'smart'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  protected isNew: boolean = false;
  protected disk_field: any;
  protected pk: number;
  protected title: string;
  protected isOneColumnForm: boolean = true

  public fieldSets: FieldSets = new FieldSets([
    {
      name: 'S.M.A.R.T. Test',
      label: true,
      config: [
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
        },{
          type: 'checkbox',
          name: 'all_disks',
          placeholder: helptext.smarttest_all_disks_placeholder,
          tooltip: helptext.smarttest_all_disks_tooltip,
        },{
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
    },
    { name: 'divider', divider: true },
  ]);


  constructor(protected ws: WebSocketService, protected modalService: ModalService) {
    this.disk_field = this.fieldSets.config('disks');
    this.ws.call('smart.test.disk_choices').subscribe(
      (res) => {
        for (const key in res) {
          this.disk_field.options.push({ label: res[key], value: key })
        }
      }, err => new EntityUtils().handleWSError(this, err)
    )
    this.modalService.getRow$.pipe(take(1)).subscribe((id: string) => {
      this.customFilter = [[["id", "=", id]]];
    })
  }

  resourceTransformIncomingRestData(data) {
    data['smarttest_picker'] = `0 ${data.schedule.hour} ${data.schedule.dom} ${data.schedule.month} ${data.schedule.dow}`
    return data;
  }

  async afterInit(entityForm: EntityFormComponent) {
    this.entityForm = entityForm;
    this.pk = entityForm.pk;
    this.isNew = entityForm.isNew;
    this.title = !!entityForm.isNew ? helptext.smart_test_add : helptext.smart_test_edit;
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
