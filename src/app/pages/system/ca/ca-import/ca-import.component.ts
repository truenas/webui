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
      placeholder : 'Identifier',
      tooltip : 'Mandatory. Enter a descriptive name for the CA using\
 only alphanumeric, underscore (_), and dash(-) characters.',
    },
    {
      type : 'textarea',
      name : 'cert_certificate',
      placeholder : 'Certificate',
      tooltip : 'Mandatory. Paste in the certificate for the CA.',
    },
    {
      type : 'textarea',
      name : 'cert_privatekey',
      placeholder : 'Private Key',
      tooltip : 'If there is a private key associated with the\
 <b>Certificate</b>, paste it here.',
    },
    {
      type : 'input',
      name : 'Passphrase',
      placeholder : 'Passphrase',
      tooltip : 'If the <b>Private Key</b> is protected by a passphrase,\
 enter it here and repeat it in the "Confirm Passphrase" field.',
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
      tooltip : 'Mandatory. Enter the serial number for the\
 certificate.',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}
}
