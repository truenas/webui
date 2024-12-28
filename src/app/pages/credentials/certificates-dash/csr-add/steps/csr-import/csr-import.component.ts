import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { pick } from 'lodash-es';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { getCertificatePreview } from 'app/pages/credentials/certificates-dash/utils/get-certificate-preview.utils';

@UntilDestroy()
@Component({
  selector: 'ix-csr-import',
  templateUrl: './csr-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxTextareaComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
  ],
})
export class CsrImportComponent implements SummaryProvider {
  form = this.formBuilder.nonNullable.group({
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
    const values = this.form.getRawValue();
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

    return pick(values, ['CSR', 'privatekey', 'passphrase']);
  }
}
