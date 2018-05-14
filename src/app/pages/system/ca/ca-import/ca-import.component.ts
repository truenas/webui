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
import { T } from '../../../../translate-marker';
import {RestService, WebSocketService} from '../../../../services/';
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
      placeholder : T('Identifier'),
      tooltip : T('Enter a descriptive name for the CA. Underscore (_),\
                   and dash (-) characters are allowed.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'textarea',
      name : 'cert_certificate',
      placeholder : T('Certificate'),
      tooltip : T('Enter or paste the certificate for the CA.'),
    },
    {
      type : 'textarea',
      name : 'cert_privatekey',
      placeholder : T('Private Key'),
      tooltip : T('Enter or paste a private key associated with the\
                   <b>Certificate</b>.'),
    },
    {
      type : 'input',
      name : 'Passphrase',
      placeholder : T('Passphrase'),
      tooltip : T('Enter a passphrase associated with the\
                   <b>Private Key</b>.'),
      inputType : 'password',
      validation : [ matchOtherValidator('Passphrase2') ]
    },
    {
      type : 'input',
      name : 'Passphrase2',
      inputType : 'password',
      placeholder : T('Confirm Passphrase'),
    },
    {
      type : 'input',
      name : 'cert_serial',
      placeholder : T('Serial'),
      tooltip : T('Enter the serial number for the certificate.'),
      required: true,
      validation : [ Validators.required ]
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}
}
