import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'system-certificate-import',
  template: `<entity-add [conf]="this"></entity-add>`
})

export class CertificateImportComponent {

  protected resource_name: string = 'system/certificate/import';
  protected route_success: string[] = ['system','certificates'];
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'cert_name',
        label: 'Identifier',
    }),
    new DynamicTextAreaModel({
        id: 'cert_certificate',
        label: 'Certificate',
    }),
    new DynamicTextAreaModel({
        id: 'cert_privatekey',
        label: 'Private Key',
    }),
    new DynamicInputModel({
        id: 'Passphrase',
        label: 'Passphrase',
    }),
    new DynamicInputModel({
        id: 'Passphrase2',
        label: 'Confirm Passphrase',
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
