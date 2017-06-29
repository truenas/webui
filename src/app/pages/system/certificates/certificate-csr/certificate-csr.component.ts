import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EntityConfigComponent } from '../../../common/entity/entity-config/';

import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';


@Component({
  selector: 'system-certificate-csr',
  template: `<entity-form [conf]="this"></entity-form>`
})

export class CertificateCSRComponent {

  protected resource_name: string = 'system/certificate/csr';
  protected route_success: string[] = ['system','certificates'];
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'cert_name',
        placeholder: 'Identifier',
    },
    {
        type: 'select',
        name: 'cert_key_length',
        placeholder: 'Key Length',
        options: [
          { label: '1024', value: 1024 },
          { label: '2048', value: 2048 },
          { label: '4096', value: 4096 },
        ],
    },
    {
        type: 'select',
        name: 'cert_digest_algorithm',
        placeholder: 'Digest Algorithm',
        options: [
          { label: 'SHA1', value: 'SHA1' },
          { label: 'SHA224', value: 'SHA224' },
          { label: 'SHA256', value: 'SHA256' },
          { label: 'SHA384', value: 'SHA384' },
          { label: 'SHA512', value: 'SHA512' },
        ],
    },
    {
        type: 'select',
        name: 'cert_country',
        placeholder: 'Country',
        options: [
          { label: 'US', value: 'US' },
          { label: 'CHINA', value: 'CN' },
          { label: 'RUSSIA', value: 'RU' },
        ],
    },
    {
        type: 'input',
        name: 'cert_state',
        placeholder: 'State',
    },
    {
        type: 'input',
        name: 'cert_city',
        placeholder: 'Locality',
    },
    {
        type: 'input',
        name: 'cert_organization',
        placeholder: 'Organization',
    },
    {
        type: 'input',
        name: 'cert_email',
        placeholder: 'Email',
        validation: [
          Validators.email
        ]
    },
    {
        type: 'input',
        name: 'cert_common',
        placeholder: 'Common Name',
    },
  ];

  afterInit(entityEdit: any) {
  }

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState,
  ) {}

}
