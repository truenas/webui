import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { AcmeDnsAuthenticatorListComponent } from 'app/pages/credentials/certificates-dash/acme-dns-authenticator-list/acme-dns-authenticator-list.component';
import { CertificateAuthorityListComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-list/certificate-authority-list.component';
import { CertificateListComponent } from 'app/pages/credentials/certificates-dash/certificate-list/certificate-list.component';
import { CertificatesDashComponent } from 'app/pages/credentials/certificates-dash/certificates-dash.component';
import { CertificateSigningRequestsListComponent } from 'app/pages/credentials/certificates-dash/csr-list/csr-list.component';

describe('CertificatesDashComponent', () => {
  let spectator: Spectator<CertificatesDashComponent>;
  const createComponent = createComponentFactory({
    component: CertificatesDashComponent,
    declarations: [
      MockComponents(
        CertificateListComponent,
        CertificateAuthorityListComponent,
        CertificateSigningRequestsListComponent,
        AcmeDnsAuthenticatorListComponent,
      ),
    ],
    providers: [],
    imports: [],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders ix-certificate-list', () => {
    const certificateListElement = spectator.query('ix-certificate-list');
    expect(certificateListElement).toBeTruthy();
  });

  it('renders ix-csr-list', () => {
    const csrListElement = spectator.query('ix-csr-list');
    expect(csrListElement).toBeTruthy();
  });

  it('renders ix-certificate-authority-list', () => {
    const certificateAuthorityListElement = spectator.query('ix-certificate-authority-list');
    expect(certificateAuthorityListElement).toBeTruthy();
  });

  it('renders ix-acme-dns-authenticator-list', () => {
    const acmeDnsAuthenticatorListElement = spectator.query('ix-acme-dns-authenticator-list');
    expect(acmeDnsAuthenticatorListElement).toBeTruthy();
  });
});
