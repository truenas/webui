import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  DynamicCheckboxModel,
  DynamicFormControlModel,
  DynamicFormService,
  DynamicInputModel,
  DynamicRadioGroupModel,
  DynamicSelectModel,
  DynamicTextAreaModel
} from '@ng2-dynamic-forms/core';

import {RestService} from '../../../../services/';
import {EntityFormComponent} from '../../../common/entity/entity-form';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-iscsi-globalconfiguration',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class GlobalconfigurationComponent {

  protected resource_name: string = 'services/iscsi/globalconfiguration/';

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'iscsi_basename',
      placeholder : 'Base Name',
    },
    {
      type : 'textarea',
      name : 'iscsi_isns_servers',
      placeholder : 'ISNS Servers',
    },
    {
      type : 'input',
      name : 'iscsi_pool_avail_threshold',
      placeholder : 'Pool Available Space Threshold (%)',
      inputType : 'number',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService,
              protected formService: DynamicFormService) {}

  afterInit(entityEdit: any) {}
}
