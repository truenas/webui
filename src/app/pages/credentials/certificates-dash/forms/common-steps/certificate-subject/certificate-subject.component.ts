import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { pickBy } from 'lodash-es';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SystemGeneralService } from 'app/services/system-general.service';

@Component({
  selector: 'ix-certificate-subject',
  templateUrl: './certificate-subject.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    IxInputComponent,
    IxChipsComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
  ],
})
export class CertificateSubjectComponent implements SummaryProvider {
  form = this.formBuilder.nonNullable.group({
    country: ['US', Validators.required],
    state: ['', Validators.required],
    city: ['', Validators.required],
    organization: ['', Validators.required],
    organizational_unit: [''],
    email: ['', [Validators.required, emailValidator()]],
    common: [''],
    san: [[] as string[], Validators.required],
  });

  readonly helptext = helptextSystemCertificates;

  readonly countries$ = this.systemGeneralService.getCertificateCountryChoices()
    .pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private systemGeneralService: SystemGeneralService,
    private translate: TranslateService,
  ) { }

  getSummary(): SummarySection {
    const values = this.form.value;
    const summary = [
      {
        label: this.translate.instant('SAN'),
        value: this.form.value.san?.join(', ') || '',
      },
    ];

    if (values.common) {
      summary.push({ label: this.translate.instant('Common Name'), value: values.common });
    }

    summary.push({ label: this.translate.instant('Email'), value: values.email || '' });

    // Dept of Connections, Cisco, New York, NY, Unites States
    const subjectFields = [
      'organizational_unit',
      'organization',
      'city',
      'state',
      'country',
    ] as const;
    const subject = subjectFields.map((field) => values[field]).filter(Boolean).join(', ');
    summary.push({ label: this.translate.instant('Subject'), value: subject });

    return summary;
  }

  getPayload(): CertificateSubjectComponent['form']['value'] {
    // Filter out empty values
    return pickBy(this.form.value, Boolean);
  }
}
