import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-storage-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class StorageEditComponent {

  protected resource_name: string = 'jails/mountpoints';
  protected route_success: string[] = ['jails', 'storage'];
  protected jail: any;
  
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
    }),
    new DynamicCheckboxModel({
      id: 'mounted',
      label: 'Mounted?',
    })
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService) {

  }

}
