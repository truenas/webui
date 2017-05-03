import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';
import { EntityConfigComponent } from '../../common/entity/entity-config/';

@Component({
    selector: 'certificate-list',
    template: `<entity-list [conf]="this"></entity-list>`
})

export class CertificateListComponent {

  protected resource_name: string = 'system/certificate';
  protected route_add: string[] = ['certificate', 'add'];
  protected route_edit: string[] = ['certificate', 'edit'];
  protected route_delete: string[] = ['certificate', 'delete'];

  private busy: Subscription;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  public columns:Array<any> = [
    {title: 'Name', name: 'cert_name'},
    {title: 'Issuer', name: 'cert_issuer'},
    {title: 'Internal', name: 'cert_type_internal'},
    {title: 'Lifetime', name: 'cert_lifetime'},
    {title: 'From', name: 'cert_from'},
    {title: 'Until', name: 'cert_from'},
  ];

  public config: any = {
      paging: true,
      sorting: {columns: this.columns},
  }

}