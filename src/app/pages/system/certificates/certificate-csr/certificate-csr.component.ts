import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'system-certificate-csr',
  template: `<entity-add [conf]="this"></entity-add>`
})

export class CertificateCSRComponent {

  protected resource_name: string = 'system/certificate';
  protected pk: any;
  protected route_success: string[];
  protected vm: string;
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'Identifier',
        label: 'Identifier',
    }),
    new DynamicSelectModel({
        id: 'key_length',
        label: 'Key Length',
    }),
    new DynamicTextAreaModel({
        id: 'digest',
        label: 'Digest Algorithm',
    }),
    new DynamicSelectModel({
        id: 'country',
        label: 'Country',
    }),
    new DynamicInputModel({
        id: 'state',
        label: 'State',
    }),
    new DynamicInputModel({
        id: 'locality',
        label: 'Locality(City)',
    }),
    new DynamicInputModel({
        id: 'organization',
        label: 'Organization',
    }),
    new DynamicInputModel({
        id: 'email',
        label: 'Email',
    }),
    new DynamicInputModel({
        id: 'common',
        label: 'Common Name',
    }),
  ];
  // protected dtype: string = 'CDROM';

  afterInit() {
    this.route.params.subscribe(params => {
        // this.pk = params['pk'];
        // this.vm = params['name'];
        // this.route_success = ['vm', this.pk, 'devices', this.vm];
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

}
