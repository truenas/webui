import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  CertificateDigestAlgorithm,
  certificateDigestAlgorithmLabels,
  certificateKeyLengths
} from 'app/enums/certificate-digest-algorithm.enum';
import { CertificateKeyType, certificateKeyTypeLabels } from 'app/enums/certificate-key-type.enum';
import { EcCurve } from 'app/enums/ec-curve.enum';
import { choicesToOptions, idNameArrayToOptions, mapToOptions } from 'app/helpers/options.helper';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { of } from 'rxjs';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-options',
  templateUrl: './certificate-options.component.html',
  styleUrls: ['./certificate-options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateOptionsComponent {
  form = this.formBuilder.group({
    signedby: ['', Validators.required],
    key_type: [CertificateKeyType.Rsa],
    key_length: [2048],
    ec_curve: [EcCurve.BrainpoolP384R1],
    digest_algorithm: [CertificateDigestAlgorithm.Sha256],
    lifetime: [3650, [Validators.required, Validators.min(0)]],
  });

  readonly helptext = helptextSystemCertificates;

  get isRsa(): boolean {
    return this.form.value.key_type === CertificateKeyType.Rsa;
  }

  readonly keyTypes$ = of(mapToOptions(certificateKeyTypeLabels, this.translate));
  readonly signingAuthorities$ = this.systemGeneralService.getUnsignedCas().pipe(idNameArrayToOptions());
  readonly digestAlgorithms$ = of(mapToOptions(certificateDigestAlgorithmLabels, this.translate));
  readonly keyLengths$ = of(certificateKeyLengths);
  readonly ecCurves$ = this.ws.call('certificate.ec_curve_choices').pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private systemGeneralService: SystemGeneralService,
  ) { }
}
