import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/';

@Component({
  selector: 'app-iscsi-globalconfiguration',
  template: `<entity-config [conf]="this"></entity-config>`
})
export class GlobalconfigurationComponent {

  protected resource_name: string = 'services/iscsi/globalconfiguration/';

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'iscsi_basename',
      label: 'Base Name',
    }),
    new DynamicTextAreaModel({
      id: 'iscsi_isns_servers',
      label: 'ISNS Servers',
    }),
    new DynamicInputModel({
      id: 'iscsi_pool_avail_threshold',
      label: 'Pool Available Space Threshold (%)',
      inputType: 'integer',
    }),
  ];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService) {

  }

  afterInit(entityEdit: any) {
  }
}
