import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'system-tunable-add',
  template: `<entity-add [conf]="this"></entity-add>`
})

export class TunableAddComponent {

  protected resource_name: string = 'system/tunable';
  protected route_success: string[] = ['system','tunable'];
  protected formModel: DynamicFormControlModel[] = [
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

  afterInit() {
    this.route.params.subscribe(params => {
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

}
