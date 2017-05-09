import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'app-storage-add',
  template: `<entity-add [conf]="this"></entity-add>`
})
export class StorageAddComponent {

  protected resource_name: string = 'jails/mountpoints';
  protected route_success: string[];
  protected pk: any;

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'jail',
        label: 'Jail',
    }),
    new DynamicInputModel({
      id: 'source',
      label: 'Source',
    }),
    new DynamicInputModel({
      id: 'destination',
      label: 'Destination',
    }),
    new DynamicCheckboxModel({
      id: 'readonly',
      label: 'Read-Only',
    }),
    new DynamicCheckboxModel({
      id: 'create directory',
      label: 'Create directory',
    })
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityAdd: any) {
    this.aroute.params.subscribe(params => {
        this.pk = params['pk'];
        this.route_success = ['jails', this.pk, 'storages'];
    });
  }
}