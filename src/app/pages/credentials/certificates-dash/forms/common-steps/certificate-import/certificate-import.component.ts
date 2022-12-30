import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';

@Component({
  selector: 'ix-certificate-import',
  templateUrl: './certificate-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateImportComponent {
  form = this.formBuilder.group({
    certificate: ['', [Validators.required]],
    private_key: ['', [Validators.required]],
    passphrase: ['', [matchOtherValidator('passphrase2')]],
    passphrase2: [''],
  });

  readonly helptext = helptextSystemCertificates;

  constructor(
    private formBuilder: FormBuilder,
  ) {}
}
