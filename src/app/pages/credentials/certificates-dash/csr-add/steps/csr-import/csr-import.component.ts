import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { matchOthersFgValidator } from 'app/modules/ix-forms/validators/password-validation/password-validation';
import { getCertificatePreview } from 'app/pages/credentials/certificates-dash/utils/get-certificate-preview.utils';

@UntilDestroy()
@Component({
  selector: 'ix-csr-import',
  templateUrl: './csr-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsrImportComponent implements SummaryProvider {
  form = this.formBuilder.group({
    CSR: ['', Validators.required],
    privatekey: ['', Validators.required],
    passphrase: [''],
    passphrase2: [''],
  }, {
    validators: [
      matchOthersFgValidator(
        'passphrase',
        ['passphrase2'],
        this.translate.instant('Passphrase value must match Confirm Passphrase'),
      ),
    ],
  });

  readonly helptext = helptextSystemCertificates;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
  ) {}

  getSummary(): SummarySection {
    const values = this.form.value;
    const csrPreview = getCertificatePreview(values.CSR);

    const summary: SummarySection = [
      {
        label: this.translate.instant('Signing Request'),
        value: csrPreview,
      },
    ];

    if (values.passphrase) {
      summary.push({ label: 'Passphrase', value: 'With passphrase' });
    }

    return summary;
  }

  getPayload(): Omit<CsrImportComponent['form']['value'], 'passphrase2'> {
    const values = this.form.value;

    return _.pick(values, ['CSR', 'privatekey', 'passphrase']);
  }
}
