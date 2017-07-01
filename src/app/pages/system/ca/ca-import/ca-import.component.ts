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
import {RestService, WebSocketService} from '../../../../services/';
import {EntityConfigComponent} from '../../../common/entity/entity-config/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'system-ca-import',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class CertificateAuthorityImportComponent {

  protected resource_name: string = 'system/certificateauthority/import';
  protected route_success: string[] = [ 'system', 'ca' ];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'cert_name',
      placeholder : 'Identifier',
    },
    {
      type : 'textarea',
      name : 'cert_certificate',
      placeholder : 'Certificate',
    },
    {
      type : 'textarea',
      name : 'cert_privatekey',
      placeholder : 'Private Key',
    },
    {
      type : 'input',
      name : 'Passphrase',
      placeholder : 'Passphrase',
      inputType : 'password',
      validation : [ matchOtherValidator('Passphrase2') ]
    },
    {
      type : 'input',
      name : 'Passphrase2',
      inputType : 'password',
      placeholder : 'Confirm Passphrase',
    },
    {
      type : 'input',
      name : 'cert_serial',
      placeholder : 'Serial',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}
}
