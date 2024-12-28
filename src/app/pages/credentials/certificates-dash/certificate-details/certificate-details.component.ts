import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { isObject } from 'lodash-es';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';

@Component({
  selector: 'ix-certificate-details',
  templateUrl: './certificate-details.component.html',
  styleUrls: ['./certificate-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class CertificateDetailsComponent {
  readonly certificate = input.required<Certificate | CertificateAuthority>();

  /**
   * Shows Signed By instead of Signed Certificates count.
   */
  showSignedBy = input(false);

  issuer = computed<string>(() => {
    const certificate = this.certificate();
    return isObject(certificate.issuer) ? certificate.issuer.name : certificate.issuer;
  });

  signedCertificates = computed<number>(() => {
    return (this.certificate() as CertificateAuthority).signed_certificates;
  });
}
