import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
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
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-options',
  templateUrl: './certificate-options.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateOptionsComponent implements OnInit, OnChanges, SummaryProvider {
  @Input() hasSignedBy = false;
  @Input() hasLifetime = false;

  form = this.formBuilder.group({
    signedby: [null as number],
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
  readonly ecCurves$ = this.ws.call('certificate.ec_curve_choices').pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private systemGeneralService: SystemGeneralService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.setSignedByValidator();
  }

  ngOnInit(): void {
    this.loadSigningAuthorities();
    this.setSignedByValidator();
  }

  getSummary(): SummarySection {
    const values = this.form.value;
    const signingAuthority = this.signingAuthorities.find((option) => option.value === values.signedby);

    const summary: SummarySection = [];

    if (this.hasSignedBy) {
      summary.push(
        { label: this.translate.instant('Signing Certificate Authority'), value: signingAuthority?.label || '' },
      );
    }

    summary.push(
      { label: this.translate.instant('Key Type'), value: certificateKeyTypeLabels.get(values.key_type) },
      this.isRsa
        ? { label: this.translate.instant('Key Length'), value: String(values.key_length) }
        : { label: this.translate.instant('EC Curve'), value: String(values.ec_curve) },
      { label: this.translate.instant('Digest Algorithm'), value: values.digest_algorithm },
    );

    if (this.hasLifetime) {
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

    if (this.hasSignedBy) {
      payload.signedby = this.form.value.signedby;
    }

    if (this.hasLifetime) {
      payload.lifetime = this.form.value.lifetime;
    }

    return payload;
  }

  private setSignedByValidator(): void {
    if (this.hasSignedBy) {
      this.form.controls.signedby.addValidators(Validators.required);
    } else {
      this.form.controls.signedby.clearValidators();
    }
  }

  private loadSigningAuthorities(): void {
    this.systemGeneralService.getUnsignedCas()
      .pipe(idNameArrayToOptions(), untilDestroyed(this))
      .subscribe((options) => {
        if (this.hasSignedBy && options.length) {
          this.form.patchValue({ signedby: options[0].value as number });
        }
        this.signingAuthorities = options;
        this.signingAuthorities$ = of(options);
        this.cdr.markForCheck();
      });
  }
}
