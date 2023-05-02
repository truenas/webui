import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { matchOtherValidator } from 'app/modules/ix-forms/validators/password-validation/password-validation';
import { getCertificatePreview } from 'app/pages/credentials/certificates-dash/utils/get-certificate-preview.utils';

@UntilDestroy()
@Component({
  selector: 'ix-ca-import',
  templateUrl: './ca-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaImportComponent implements SummaryProvider {
  form = this.formBuilder.group({
    certificate: ['', Validators.required],
    privatekey: [''],
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
    const certificatePreview = getCertificatePreview(values.certificate);

    const summary: SummarySection = [
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

  getPayload(): Omit<CaImportComponent['form']['value'], 'passphrase2'> {
    const values = this.form.value;

    return _.pick(values, ['certificate', 'privatekey', 'passphrase']);
  }
}
