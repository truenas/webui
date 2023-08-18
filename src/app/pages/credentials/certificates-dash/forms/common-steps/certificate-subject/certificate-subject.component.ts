import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { SystemGeneralService } from 'app/services/system-general.service';

@Component({
  selector: 'ix-certificate-subject',
  templateUrl: './certificate-subject.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateSubjectComponent implements SummaryProvider {
  form = this.formBuilder.group({
    country: ['US', Validators.required],
    state: ['', Validators.required],
    city: ['', Validators.required],
    organization: ['', Validators.required],
    organizational_unit: [''],
    email: ['', [Validators.required, Validators.email]],
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
        value: this.form.value.san.join(', '),
      },
    ];

    if (values.common) {
      summary.push({ label: this.translate.instant('Common Name'), value: values.common });
    }

    summary.push({ label: this.translate.instant('Email'), value: values.email });

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
    return _.pickBy(this.form.value, Boolean);
  }
}
