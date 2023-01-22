import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';

@Component({
  selector: 'ix-certificate-import',
  templateUrl: './certificate-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateImportComponent implements SummaryProvider {
  form = this.formBuilder.group({
    certificate: ['', [Validators.required]],
    private_key: ['', [Validators.required]],
    passphrase: ['', [matchOtherValidator('passphrase2')]],
    passphrase2: [''],
  });

  readonly helptext = helptextSystemCertificates;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
  ) {}

  getSummary(): SummarySection {
    const values = this.form.value;
    const certificateBody = values.certificate.match(/-----BEGIN CERTIFICATE-----\s(.*)\s-----END CERTIFICATE-----/s)?.[1] || '';
    const certificatePreview = certificateBody.replace(/(.{6}).*(.{6})/s, '$1......$2');

    const summary = [
      {
        label: this.translate.instant('Certificate'),
        value: certificatePreview,
      },
    ];

    if (values.passphrase) {
      summary.push({ label: 'Passphrase', value: 'With passphrase' });
    }

    return summary;
  }
}
