import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { mockTypedApi, mockTypedQuery, settleTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
      mockTypedApi([
        mockTypedQuery('certificate.query', allCertificates as unknown as WebUiQueryEntity<'certificate.query'>[]),
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

    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('certificate.query');
  });

  it('should filter certificates where certificate !== null', async () => {
    spectator.service.loadCertificates();
    await settleTypedApi();

    expect(spectator.service.certificates()).toEqual(certificates);
  });

  it('should filter CSRs where CSR !== null', async () => {
    spectator.service.loadCertificates();
    await settleTypedApi();

    expect(spectator.service.csrs()).toEqual(csrs);
  });

  describe('loading state', () => {
    it('should set isLoading to true while fetching', () => {
      const delayedResponse$ = new Subject<WebUiQueryEntity<'certificate.query'>[]>();
      jest.spyOn(spectator.inject(TypedApiService), 'query').mockReturnValue(delayedResponse$);

      spectator.service.loadCertificates();

      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.next(allCertificates as unknown as WebUiQueryEntity<'certificate.query'>[]);
      delayedResponse$.complete();

      expect(spectator.service.isLoading()).toBe(false);
    });

    it('should set isLoading to false after fetch completes', async () => {
      spectator.service.loadCertificates();
      await settleTypedApi();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.certificates()).toEqual(certificates);
    });
  });

  describe('error handling', () => {
    it('should show error modal when API fails', () => {
      const error = new Error('Failed to load certificates');
      jest.spyOn(spectator.inject(TypedApiService), 'query').mockReturnValue(
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
