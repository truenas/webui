import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  CertificateDigestAlgorithm,
  certificateDigestAlgorithmLabels,
  certificateKeyLengths,
} from 'app/enums/certificate-digest-algorithm.enum';
import { CertificateKeyType, certificateKeyTypeLabels } from 'app/enums/certificate-key-type.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-csr-options',
  templateUrl: './csr-options.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
  ],
})
export class CsrOptionsComponent implements SummaryProvider {
  hasLifetime = input(false);

  form = this.formBuilder.nonNullable.group({
    key_type: [CertificateKeyType.Rsa],
    key_length: [2048],
    ec_curve: ['BrainpoolP384R1'],
    digest_algorithm: [CertificateDigestAlgorithm.Sha256],
    lifetime: [3650, [Validators.required, Validators.min(0)]],
  });

  readonly helptext = helptextSystemCertificates;

  get isRsa(): boolean {
    return this.form.value.key_type === CertificateKeyType.Rsa;
  }

  readonly keyTypes$ = of(mapToOptions(certificateKeyTypeLabels, this.translate));
  readonly digestAlgorithms$ = of(mapToOptions(certificateDigestAlgorithmLabels, this.translate));
  readonly keyLengths$ = of(certificateKeyLengths);
  readonly ecCurves$ = this.api.call('certificate.ec_curve_choices').pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private api: ApiService,
  ) { }

  getSummary(): SummarySection {
    const values = this.form.getRawValue();

    const summary: SummarySection = [];

    summary.push(
      {
        label: this.translate.instant('Key Type'),
        value: certificateKeyTypeLabels.get(values.key_type) || values.key_type,
      },
      this.isRsa
        ? { label: this.translate.instant('Key Length'), value: String(values.key_length) }
        : { label: this.translate.instant('EC Curve'), value: String(values.ec_curve) },
      { label: this.translate.instant('Digest Algorithm'), value: values.digest_algorithm },
    );

    if (this.hasLifetime()) {
      summary.push({ label: this.translate.instant('Lifetime'), value: String(values.lifetime) });
    }

    return summary;
  }

  getPayload(): CsrOptionsComponent['form']['value'] {
    const payload: CsrOptionsComponent['form']['value'] = {
      key_type: this.form.value.key_type,
      digest_algorithm: this.form.value.digest_algorithm,
    };

    if (this.isRsa) {
      payload.key_length = this.form.value.key_length;
    } else {
      payload.ec_curve = this.form.value.ec_curve;
    }

    if (this.hasLifetime()) {
      payload.lifetime = this.form.value.lifetime;
    }

    return payload;
  }
}
