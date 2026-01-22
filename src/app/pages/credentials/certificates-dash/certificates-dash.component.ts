import {
  ChangeDetectionStrategy, Component, OnInit, inject,
} from '@angular/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { certificatesDashElements } from 'app/pages/credentials/certificates-dash/certificates-dash.elements';
import { CertificatesStore } from 'app/pages/credentials/certificates-dash/certificates.store';
import { AcmeDnsAuthenticatorListComponent } from './acme-dns-authenticator-list/acme-dns-authenticator-list.component';
import { CertificateListComponent } from './certificate-list/certificate-list.component';
import { CertificateSigningRequestsListComponent } from './csr-list/csr-list.component';

@Component({
  selector: 'ix-certificates-dash',
  templateUrl: './certificates-dash.component.html',
  styleUrls: ['./certificates-dash.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CertificatesStore],
  imports: [
    UiSearchDirective,
    CertificateListComponent,
    CertificateSigningRequestsListComponent,
    AcmeDnsAuthenticatorListComponent,
  ],
})
export class CertificatesDashComponent implements OnInit {
  private store = inject(CertificatesStore);

  protected readonly searchableElements = certificatesDashElements;
  protected readonly isLoading = this.store.isLoading;
  protected readonly certificates = this.store.certificates;
  protected readonly csrs = this.store.csrs;

  ngOnInit(): void {
    this.store.loadCertificates();
  }

  protected onRefresh(): void {
    this.store.loadCertificates();
  }
}
