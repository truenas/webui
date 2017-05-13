import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-jail-template-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class TemplateEditComponent {

  protected resource_name: string = 'jails/templates';
  protected route_success: string[] = ['jails', 'templates'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'jt_name',
      label: 'Name',
    }),
    new DynamicSelectModel({
      id: 'jt_os',
      label: 'OS',
      options: [
        { label: 'FreeBSD', value: 'FreeBSD' },
        { label: 'Linux', value: 'Linux' },
      ],
    }),
    new DynamicSelectModel({
      id: 'jt_arch',
      label: 'Architecture',
      options: [
        { label: 'x64', value: 'x64' },
        { label: 'x86', value: 'x86' },
      ],
    }),
    new DynamicInputModel({
      id: 'jt_url',
      label: 'URL',
    }),
    new DynamicInputModel({
      id: 'jt_mtree',
      label: 'Mtree',
    }),
  ];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef) {

  }

  afterInit(entityEdit) {
  }

}
