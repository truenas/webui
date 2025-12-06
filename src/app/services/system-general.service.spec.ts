import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from './system-general.service';

describe('SystemGeneralService', () => {
  let spectator: SpectatorService<SystemGeneralService>;
  let api: MockApiService;

  const createService = createServiceFactory({
    service: SystemGeneralService,
    providers: [
      mockApi([
        mockCall('system.product_type', ProductType.CommunityEdition),
        mockCall('certificate.query', []),
        mockCall('certificate.country_choices', { US: 'United States' }),
        mockCall('system.general.ui_address_choices', {}),
        mockCall('system.general.ui_v6address_choices', {}),
        mockCall('system.general.kbdmap_choices', { us: 'United States' }),
        mockCall('system.general.timezone_choices', { 'America/New_York': 'Eastern Time' }),
        mockCall('system.general.ui_certificate_choices', {}),
        mockCall('system.general.ui_httpsprotocols_choices', {}),
        mockCall('system.general.ui_restart', null),
        mockJob('directoryservices.cache_refresh', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: unknown) => source$),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(MockApiService);
  });


  describe('getCertificates', () => {
    it('should call certificate.query API', () => {
      spectator.service.getCertificates().subscribe();

      expect(api.call).toHaveBeenCalledWith('certificate.query');
    });
  });

  describe('getCertificateCountryChoices', () => {
    it('should call certificate.country_choices API', () => {
      spectator.service.getCertificateCountryChoices().subscribe();

      expect(api.call).toHaveBeenCalledWith('certificate.country_choices');
    });
  });

  describe('ipChoicesv4', () => {
    it('should call system.general.ui_address_choices API', () => {
      spectator.service.ipChoicesv4().subscribe();

      expect(api.call).toHaveBeenCalledWith('system.general.ui_address_choices');
    });
  });

  describe('ipChoicesv6', () => {
    it('should call system.general.ui_v6address_choices API', () => {
      spectator.service.ipChoicesv6().subscribe();

      expect(api.call).toHaveBeenCalledWith('system.general.ui_v6address_choices');
    });
  });

  describe('kbdMapChoices', () => {
    it('should format keyboard map choices correctly', () => {
      spectator.service.kbdMapChoices().subscribe((options) => {
        expect(options).toEqual([
          { label: 'United States (us)', value: 'us' },
        ]);
      });
    });
  });

  describe('languageOptions', () => {
    it('should return language options', () => {
      spectator.service.languageOptions(true).subscribe((options) => {
        expect(options.length).toBeGreaterThan(0);
        expect(options[0]).toHaveProperty('label');
        expect(options[0]).toHaveProperty('value');
      });
    });
  });

  describe('timezoneChoices', () => {
    it('should format timezone choices correctly', () => {
      spectator.service.timezoneChoices().subscribe((options) => {
        expect(options).toEqual([
          { label: 'Eastern Time', value: 'America/New_York' },
        ]);
      });
    });
  });

  describe('uiCertificateOptions', () => {
    it('should call system.general.ui_certificate_choices API', () => {
      spectator.service.uiCertificateOptions().subscribe();

      expect(api.call).toHaveBeenCalledWith('system.general.ui_certificate_choices');
    });
  });

  describe('uiHttpsProtocolsOptions', () => {
    it('should call system.general.ui_httpsprotocols_choices API', () => {
      spectator.service.uiHttpsProtocolsOptions().subscribe();

      expect(api.call).toHaveBeenCalledWith('system.general.ui_httpsprotocols_choices');
    });
  });

  describe('refreshDirServicesCache', () => {
    it('should call directoryservices.cache_refresh job', () => {
      spectator.service.refreshDirServicesCache().subscribe();

      expect(api.job).toHaveBeenCalledWith('directoryservices.cache_refresh');
    });
  });

  describe('updateDone', () => {
    it('should emit updateIsDone$ subject', () => {
      const emitSpy = jest.spyOn(spectator.service.updateIsDone$, 'next');

      spectator.service.updateDone();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('handleUiServiceRestart', () => {
    it('should show confirmation dialog and restart UI service when user confirms', () => {
      const dialogService = spectator.inject(DialogService);
      const errorHandlerService = spectator.inject(ErrorHandlerService);

      (dialogService.confirm as jest.Mock) = jest.fn(() => of(true));

      spectator.service.handleUiServiceRestart().subscribe();

      expect(dialogService.confirm).toHaveBeenCalledWith({
        title: 'Restart Web Service',
        message: 'The web service must restart for the protocol changes to take effect. The UI will be temporarily unavailable. Restart the service?',
      });
      expect(api.call).toHaveBeenCalledWith('system.general.ui_restart');
      expect(errorHandlerService.withErrorHandler).toHaveBeenCalled();
    });

    it('should show confirmation dialog but not restart UI service when user cancels', () => {
      const dialogService = spectator.inject(DialogService);

      (dialogService.confirm as jest.Mock) = jest.fn(() => of(false));

      let result: boolean;
      spectator.service.handleUiServiceRestart().subscribe((value) => {
        result = value;
      });

      expect(dialogService.confirm).toHaveBeenCalledWith({
        title: 'Restart Web Service',
        message: 'The web service must restart for the protocol changes to take effect. The UI will be temporarily unavailable. Restart the service?',
      });
      expect(api.call).not.toHaveBeenCalledWith('system.general.ui_restart');
      expect(result).toBe(true);
    });

    it('should return Observable<true> regardless of user choice', () => {
      const dialogService = spectator.inject(DialogService);

      // Test when user confirms
      (dialogService.confirm as jest.Mock) = jest.fn(() => of(true));
      let result1: boolean;
      spectator.service.handleUiServiceRestart().subscribe((value) => {
        result1 = value;
      });
      expect(result1).toBe(true);

      // Test when user cancels
      (dialogService.confirm as jest.Mock) = jest.fn(() => of(false));
      let result2: boolean;
      spectator.service.handleUiServiceRestart().subscribe((value) => {
        result2 = value;
      });
      expect(result2).toBe(true);
    });

    it('should handle errors with error handler when API call fails', () => {
      const dialogService = spectator.inject(DialogService);
      const errorHandlerService = spectator.inject(ErrorHandlerService);

      (dialogService.confirm as jest.Mock) = jest.fn(() => of(true));

      spectator.service.handleUiServiceRestart().subscribe();

      expect(errorHandlerService.withErrorHandler).toHaveBeenCalled();
    });

    it('should use correct helptext for dialog title and message', () => {
      const dialogService = spectator.inject(DialogService);

      (dialogService.confirm as jest.Mock) = jest.fn(() => of(false));

      spectator.service.handleUiServiceRestart().subscribe();

      expect(dialogService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Restart Web Service'),
          message: expect.stringContaining('web service must restart'),
        }),
      );
    });
  });
});
