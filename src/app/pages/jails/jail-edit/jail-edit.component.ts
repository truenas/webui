import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../services/rest.service';

@Component({
  selector: 'app-jail-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class JailEditComponent {

  protected resource_name: string = 'jails/jails';
  protected route_delete: string[] = ['jails', 'delete'];
  protected route_success: string[] = ['jails'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'jail_host',
      label: 'Jail Name',
      validators: { required: null },
    }),
    new DynamicInputModel({
      id: 'jail_ipv4',
      label: 'IPv4 address',
    }),
    new DynamicInputModel({
      id: 'jail_ipv6',
      label: 'IPv6 address',
    }),
  ];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef) {

  }

  afterInit(entityEdit) {
  }

}
