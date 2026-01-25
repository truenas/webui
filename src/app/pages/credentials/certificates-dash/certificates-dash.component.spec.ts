import { signal } from '@angular/core';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { Certificate } from 'app/interfaces/certificate.interface';
import { AcmeDnsAuthenticatorListComponent } from 'app/pages/credentials/certificates-dash/acme-dns-authenticator-list/acme-dns-authenticator-list.component';
import { CertificateListComponent } from 'app/pages/credentials/certificates-dash/certificate-list/certificate-list.component';
import { CertificatesDashComponent } from 'app/pages/credentials/certificates-dash/certificates-dash.component';
import { CertificatesStore } from 'app/pages/credentials/certificates-dash/certificates.store';
import { CertificateSigningRequestsListComponent } from 'app/pages/credentials/certificates-dash/csr-list/csr-list.component';

describe('CertificatesDashComponent', () => {
  let spectator: Spectator<CertificatesDashComponent>;

  const mockCertificates = [{ id: 1, name: 'cert1' }] as Certificate[];
  const mockCsrs = [{ id: 2, name: 'csr1' }] as Certificate[];

  const mockStore = {
    isLoading: signal(false),
    certificates: signal(mockCertificates),
    csrs: signal(mockCsrs),
    loadCertificates: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: CertificatesDashComponent,
    imports: [
      MockComponents(
        CertificateListComponent,
        CertificateSigningRequestsListComponent,
        AcmeDnsAuthenticatorListComponent,
      ),
    ],
    componentProviders: [
      mockProvider(CertificatesStore, mockStore),
    ],
  });

  beforeEach(() => {
    mockStore.loadCertificates.mockClear();
    spectator = createComponent();
  });

  it('calls store.loadCertificates on init', () => {
    expect(mockStore.loadCertificates).toHaveBeenCalled();
  });

  it('passes certificates to ix-certificate-list', () => {
    const certificateList = spectator.query(CertificateListComponent);
    expect(certificateList.certificates).toEqual(mockCertificates);
  });

  it('passes csrs to ix-csr-list', () => {
    const csrList = spectator.query(CertificateSigningRequestsListComponent);
    expect(csrList.csrs).toEqual(mockCsrs);
  });

  it('passes isLoading to child components', () => {
    const certificateList = spectator.query(CertificateListComponent);
    const csrList = spectator.query(CertificateSigningRequestsListComponent);
    expect(certificateList.isLoading).toBe(false);
    expect(csrList.isLoading).toBe(false);
  });

  it('calls store.loadCertificates when certificatesUpdated emits', () => {
    mockStore.loadCertificates.mockClear();

    const certificateList = spectator.query(CertificateListComponent);
    certificateList.certificatesUpdated.emit();

    expect(mockStore.loadCertificates).toHaveBeenCalled();
  });

  it('calls store.loadCertificates when csrsUpdated emits', () => {
    mockStore.loadCertificates.mockClear();

    const csrList = spectator.query(CertificateSigningRequestsListComponent);
    csrList.csrsUpdated.emit();

    expect(mockStore.loadCertificates).toHaveBeenCalled();
  });
});
