import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  CertificateDigestAlgorithm,
  certificateDigestAlgorithmLabels,
  certificateKeyLengths,
} from 'app/enums/certificate-digest-algorithm.enum';
import { CertificateKeyType, certificateKeyTypeLabels } from 'app/enums/certificate-key-type.enum';
import { choicesToOptions, idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-options',
  templateUrl: './certificate-options.component.html',
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
export class CertificateOptionsComponent implements OnInit, OnChanges, SummaryProvider {
  hasSignedBy = input(false);
  hasLifetime = input(false);

  form = this.formBuilder.nonNullable.group({
    signedby: [null as number | null],
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

  signingAuthorities: Option[] = [];
  signingAuthorities$ = of<Option[]>([]);

  readonly keyTypes$ = of(mapToOptions(certificateKeyTypeLabels, this.translate));
  readonly digestAlgorithms$ = of(mapToOptions(certificateDigestAlgorithmLabels, this.translate));
  readonly keyLengths$ = of(certificateKeyLengths);
  readonly ecCurves$ = this.api.call('certificate.ec_curve_choices').pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private api: ApiService,
    private systemGeneralService: SystemGeneralService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) { }

  ngOnChanges(): void {
    this.setSignedByValidator();
  }

  ngOnInit(): void {
    this.loadSigningAuthorities();
    this.setSignedByValidator();
  }

  getSummary(): SummarySection {
    const values = this.form.getRawValue();
    const signingAuthority = this.signingAuthorities.find((option) => option.value === values.signedby);

    const summary: SummarySection = [];

    if (this.hasSignedBy()) {
      summary.push(
        { label: this.translate.instant('Signing Certificate Authority'), value: signingAuthority?.label || '' },
      );
    }

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

  getPayload(): CertificateOptionsComponent['form']['value'] {
    const payload: CertificateOptionsComponent['form']['value'] = {
      key_type: this.form.value.key_type,
      digest_algorithm: this.form.value.digest_algorithm,
    };

    if (this.isRsa) {
      payload.key_length = this.form.value.key_length;
    } else {
      payload.ec_curve = this.form.value.ec_curve;
    }

    if (this.hasSignedBy()) {
      payload.signedby = this.form.value.signedby;
    }

    if (this.hasLifetime()) {
      payload.lifetime = this.form.value.lifetime;
    }

    return payload;
  }

  private setSignedByValidator(): void {
    if (this.hasSignedBy()) {
      this.form.controls.signedby.addValidators(Validators.required);
    } else {
      this.form.controls.signedby.clearValidators();
    }
  }

  private loadSigningAuthorities(): void {
    this.systemGeneralService.getUnsignedCas()
      .pipe(
        idNameArrayToOptions(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((options) => {
        if (this.hasSignedBy() && options.length) {
          this.form.patchValue({ signedby: options[0].value });
        }
        this.signingAuthorities = options;
        this.signingAuthorities$ = of(options);
        this.cdr.markForCheck();
      });
  }
}
