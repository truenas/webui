import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { CertificatesStore } from 'app/pages/credentials/certificates-dash/certificates.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('CertificatesStore', () => {
  let spectator: SpectatorService<CertificatesStore>;

  const certificates = [
    {
      id: 1, name: 'cert1', certificate: '---CERT---', CSR: null,
    },
    {
      id: 2, name: 'cert2', certificate: '---CERT---', CSR: null,
    },
  ] as Certificate[];

  const csrs = [
    {
      id: 3, name: 'csr1', certificate: null, CSR: '---CSR---',
    },
  ] as Certificate[];

  const allCertificates = [...certificates, ...csrs];

  const createService = createServiceFactory({
    service: CertificatesStore,
    providers: [
      mockApi([
        mockCall('certificate.query', allCertificates),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      certificates: [],
      csrs: [],
    });
  });

  it('should call certificate.query when loadCertificates is called', () => {
    spectator.service.loadCertificates();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('certificate.query');
  });

  it('should filter certificates where certificate !== null', () => {
    spectator.service.loadCertificates();

    expect(spectator.service.certificates()).toEqual(certificates);
  });

  it('should filter CSRs where CSR !== null', () => {
    spectator.service.loadCertificates();

    expect(spectator.service.csrs()).toEqual(csrs);
  });

  describe('loading state', () => {
    it('should set isLoading to true while fetching', () => {
      const delayedResponse$ = new Subject<Certificate[]>();
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(delayedResponse$);

      spectator.service.loadCertificates();

      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.next(allCertificates);
      delayedResponse$.complete();

      expect(spectator.service.isLoading()).toBe(false);
    });

    it('should set isLoading to false after fetch completes', () => {
      spectator.service.loadCertificates();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.certificates()).toEqual(certificates);
    });
  });

  describe('error handling', () => {
    it('should show error modal when API fails', () => {
      const error = new Error('Failed to load certificates');
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => error),
      );
      const errorHandler = spectator.inject(ErrorHandlerService);
      jest.spyOn(errorHandler, 'showErrorModal');

      spectator.service.loadCertificates();

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
      expect(spectator.service.isLoading()).toBe(false);
    });
  });
});
