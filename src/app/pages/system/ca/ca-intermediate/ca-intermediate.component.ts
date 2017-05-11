import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel, DynamicTextAreaModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, SystemGeneralService } from '../../../../services/';

@Component({
  selector: 'system-certificate-intermediate',
  template: `<entity-add [conf]="this"></entity-add>`,
  providers: [SystemGeneralService]
})

export class CertificateAuthorityIntermediateComponent {

  protected resource_name: string = 'system/certificateauthority/intermediate';
  protected route_success: string[] = ['system','ca'];
  protected formModel: DynamicFormControlModel[] = [
    new DynamicSelectModel({
        id: 'cert_signedby',
        label: 'Signing Certificate Authority',
    }),
    new DynamicInputModel({
        id: 'cert_name',
        label: 'Identifier',
    }),
    new DynamicSelectModel({
        id: 'cert_key_length',
        label: 'Key Length',
        options: [
          { label: '1024', value: 1024 },
          { label: '2048', value: 2048 },
          { label: '4096', value: 4096 },
        ],
    }),
    new DynamicSelectModel({
        id: 'cert_digest_algorithm',
        label: 'Digest Algorithm',
        options: [
          { label: 'SHA1', value: 'SHA1' },
          { label: 'SHA224', value: 'SHA224' },
          { label: 'SHA256', value: 'SHA256' },
          { label: 'SHA384', value: 'SHA384' },
          { label: 'SHA512', value: 'SHA512' },
        ],
    }),
    new DynamicInputModel({
        id: 'cert_lifetime',
        label: 'lifetime',
    }),
    new DynamicSelectModel({
        id: 'cert_country',
        label: 'country',
        options: [
          { label: 'US', value: 'US' },
          { label: 'CHINA', value: 'CN' },
          { label: 'RUSSIA', value: 'RU' },
        ],
    }),
    new DynamicInputModel({
        id: 'cert_state',
        label: 'state',
    }),
    new DynamicInputModel({
        id: 'cert_city',
        label: 'local',
    }),
    new DynamicInputModel({
        id: 'cert_organization',
        label: 'organization',
    }),
    new DynamicInputModel({
        id: 'cert_email',
        label: 'email',
    }),
    new DynamicInputModel({
        id: 'cert_common',
        label: 'common',
    }),
  ];
  private cert_signedby: DynamicSelectModel<string>;

  afterInit(entityEdit: any) {
    this.systemGeneralService.getCA().subscribe((res) => {
      this.cert_signedby = <DynamicSelectModel<string>>this.formService.findById('cert_signedby', this.formModel);
      res.forEach((item) => {
        this.cert_signedby.add({ label: item.cert_name, value: item.id });
      });
    });
  }

  ngOnInit() {

  }

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState, protected systemGeneralService: SystemGeneralService) {

  }

}
