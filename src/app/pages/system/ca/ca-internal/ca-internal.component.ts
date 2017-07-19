import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'system-ca-internal',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class CertificateAuthorityInternalComponent {

  protected resource_name: string = 'system/certificateauthority/internal';
  protected route_success: string[] = [ 'system', 'ca' ];
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'cert_name',
      placeholder : 'Identifier',
    },
    {
      type : 'select',
      name : 'cert_key_length',
      placeholder : 'Key Length',
      options : [
        {label : '1024', value : 1024},
        {label : '2048', value : 2048},
        {label : '4096', value : 4096},
      ],
    },
    {
      type : 'select',
      name : 'cert_digest_algorithm',
      placeholder : 'Digest Algorithm',
      options : [
        {label : 'SHA1', value : 'SHA1'},
        {label : 'SHA224', value : 'SHA224'},
        {label : 'SHA256', value : 'SHA256'},
        {label : 'SHA384', value : 'SHA384'},
        {label : 'SHA512', value : 'SHA512'},
      ],
    },
    {
      type : 'input',
      name : 'cert_lifetime',
      placeholder : 'Lifetime',
    },
    {
      type : 'select',
      name : 'cert_country',
      placeholder : 'Country',
      options : [
        {label : 'US', value : 'US'},
        {label : 'CHINA', value : 'CN'},
        {label : 'RUSSIA', value : 'RU'},
      ],
    },
    {
      type : 'input',
      name : 'cert_state',
      placeholder : 'State',
    },
    {
      type : 'input',
      name : 'cert_city',
      placeholder : 'Locality',
    },
    {
      type : 'input',
      name : 'cert_organization',
      placeholder : 'Organization',
    },
    {
      type : 'input',
      name : 'cert_email',
      placeholder : 'Email',
      validation : [ Validators.email ]
    },
    {
      type : 'input',
      name : 'cert_common',
      placeholder : 'Common Name',
    },
  ];

  ngOnInit() {}

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState,
              protected systemGeneralService: SystemGeneralService) {}
}
