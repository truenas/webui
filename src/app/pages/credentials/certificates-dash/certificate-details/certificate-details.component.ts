import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as _ from 'lodash';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';

@Component({
  selector: 'ix-certificate-details',
  templateUrl: './certificate-details.component.html',
  styleUrls: ['./certificate-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateDetailsComponent {
  @Input() certificate: Certificate | CertificateAuthority;

  /**
   * Shows Signed By instead of Signed Certificates count.
   */
  @Input() showSignedBy = false;

  get issuer(): string {
    return _.isObject(this.certificate.issuer)
      ? this.certificate.issuer.name
      : this.certificate.issuer;
  }

  get signedCertificates(): number {
    return (this.certificate as CertificateAuthority).signed_certificates;
  }
}
