import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { certificatesDashElements } from 'app/pages/credentials/certificates-dash/certificates-dash.elements';
import { AcmeDnsAuthenticatorListComponent } from './acme-dns-authenticator-list/acme-dns-authenticator-list.component';
import { CertificateAuthorityListComponent } from './certificate-authority-list/certificate-authority-list.component';
import { CertificateListComponent } from './certificate-list/certificate-list.component';
import { CertificateSigningRequestsListComponent } from './csr-list/csr-list.component';

@UntilDestroy()
@Component({
  selector: 'ix-certificates-dash',
  templateUrl: './certificates-dash.component.html',
  styleUrls: ['./certificates-dash.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    UiSearchDirective,
    CertificateListComponent,
    CertificateSigningRequestsListComponent,
    CertificateAuthorityListComponent,
    AcmeDnsAuthenticatorListComponent,
  ],
})
export class CertificatesDashComponent {
  protected readonly searchableElements = certificatesDashElements;
}
