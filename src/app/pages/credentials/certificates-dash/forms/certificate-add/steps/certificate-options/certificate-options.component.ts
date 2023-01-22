import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
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
import { EcCurve } from 'app/enums/ec-curve.enum';
import { choicesToOptions, idNameArrayToOptions, mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Option } from 'app/interfaces/option.interface';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { SystemGeneralService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-options',
  templateUrl: './certificate-options.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateOptionsComponent implements OnInit, SummaryProvider {
  form = this.formBuilder.group({
    signedby: ['', Validators.required],
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

  ngOnInit(): void {
    this.loadSigningAuthorities();
  }

  getSummary(): SummarySection {
    const values = this.form.value;
    const signingAuthority = this.signingAuthorities.find((option) => option.value === values.signedby);

    return [
      { label: this.translate.instant('Signing Certificate Authority'), value: signingAuthority?.label || '' },
      { label: this.translate.instant('Key Type'), value: certificateKeyTypeLabels.get(values.key_type) },
      this.isRsa
        ? { label: this.translate.instant('Key Length'), value: String(values.key_length) }
        : { label: this.translate.instant('EC Curve'), value: String(values.ec_curve) },
      { label: this.translate.instant('Digest Algorithm'), value: values.digest_algorithm },
      { label: this.translate.instant('Lifetime'), value: String(values.lifetime) },
    ];
  }

  private loadSigningAuthorities(): void {
    this.systemGeneralService.getUnsignedCas()
      .pipe(idNameArrayToOptions(), untilDestroyed(this))
      .subscribe((options) => {
        this.form.patchValue({ signedby: String(options[0].value) });
        this.signingAuthorities = options;
        this.signingAuthorities$ = of(options);
        this.cdr.markForCheck();
      });
  }
}
