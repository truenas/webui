import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicTextAreaModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'system-tunable-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class TunableEditComponent {

  protected resource_name: string = 'system/tunable';
  protected route_success: string[] = ['system', 'tunable'];

  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'tun_var',
        label: 'Variable',
    }),
    new DynamicTextAreaModel({
        id: 'tun_value',
        label: 'Value',
    }),
    new DynamicSelectModel({
        id: 'tun_type',
        label: 'Type',
        options: [
            {label: 'Loader', value: 'loader'},
            {label: 'rc.conf', value: 'rc'},
            {label: 'Sysctl', value: 'sysctl'},
        ]
    }),
    new DynamicInputModel({
        id: 'tun_comment',
        label: 'Comment',
    }),
    new DynamicCheckboxModel({
        id: 'tun_enabled',
        label: 'Enable',
    }),
  ];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef) {
  }

  afterInit(entityEdit) {
  }

}
