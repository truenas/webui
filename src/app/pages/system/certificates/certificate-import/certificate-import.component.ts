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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { FileUploader } from 'ng2-file-upload';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'system-certificate-import',
  template: `<entity-form [conf]="this"></entity-form>`,
})

export class CertificateImportComponent {

  protected resource_name: string = 'system/certificate/import/';
  protected route_success: string[] = ['system', 'certificates'];
  protected isEntity: boolean = true;
  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'cert_name',
      placeholder: T('Identifier'),
      tooltip: T('Internal identifier of the certificate. Alphanumeric,\
                  underscore (_), and dash (-) characters are allowed.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'textarea',
      name: 'cert_certificate',
      placeholder: T('Certificate'),
      tooltip: T('Enter or paste the contents of the certificate.'),
    },
    {
      type: 'textarea',
      name: 'cert_privatekey',
      placeholder: T('Private Key'),
      tooltip: T('Enter or paste the contents of the private key.'),
    },
    {
      type: 'input',
      name: 'Passphrase',
      placeholder: T('Passphrase'),
      tooltip: T('Enter a passphrase when using an encrypted private key.'),
      inputType: 'password',
      validation: [matchOtherValidator('Passphrase2')]
    },
    {
      type: 'input',
      name: 'Passphrase2',
      inputType: 'password',
      placeholder: T('Confirm Passphrase'),
    },
  ];

  afterInit() { this.route.params.subscribe(params => {}); }

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}
}
