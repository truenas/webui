import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
  TnStepperNextDirective, TnStepperPreviousDirective,
} from '@truenas/ui-components';
import { map, startWith } from 'rxjs/operators';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { getCertificatePreview } from 'app/pages/credentials/certificates-dash/utils/get-certificate-preview.utils';
import { normalizeCertificateNewlines } from 'app/pages/credentials/certificates-dash/utils/normalize-certificate.utils';

@Component({
  selector: 'ix-csr-import',
  templateUrl: './csr-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnInputComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnStepperPreviousDirective,
    TnStepperNextDirective,
    TranslateModule,
  ],
})
export class CsrImportComponent implements SummaryProvider {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);

  protected readonly InputType = InputType;

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

  // Drives the stepper's linear gating (replaces mat's [stepControl]).
  readonly completed = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status), map(() => this.form.valid)),
    { initialValue: this.form.valid },
  );

  readonly helptext = helptextSystemCertificates;

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

  getPayload(): { CSR: string; privatekey: string | null; passphrase: string | null } {
    const values = this.form.getRawValue();

    return {
      CSR: normalizeCertificateNewlines(values.CSR) || '',
      privatekey: normalizeCertificateNewlines(values.privatekey) || null,
      passphrase: values.passphrase?.trim() || null,
    };
  }
}
