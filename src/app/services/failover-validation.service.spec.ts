import { fakeAsync, tick } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  FailoverErrorType,
  FailoverValidationService,
} from 'app/services/failover-validation.service';

describe('FailoverValidationService', () => {
  let spectator: SpectatorService<FailoverValidationService>;
  let api: MockApiService;

  const createService = createServiceFactory({
    service: FailoverValidationService,
    providers: [
      mockApi([
        mockCall('failover.licensed', true),
        mockCall('failover.status', FailoverStatus.Master),
        mockCall('failover.disabled.reasons', []),
      ]),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(LoaderService, {
        open: jest.fn(),
        close: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    api = spectator.inject(MockApiService);
  });

  describe('validateFailover', () => {
    it('returns success when failover is not licensed', (done) => {
      api.mockCall('failover.licensed', false);

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(api.call).toHaveBeenCalledWith('failover.licensed');
        expect(api.call).not.toHaveBeenCalledWith('failover.status');
        done();
      });
    });

    it('returns success when failover is licensed and status is MASTER with no ongoing failover', (done) => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.NoPong]);

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(api.call).toHaveBeenCalledWith('failover.licensed');
        expect(api.call).toHaveBeenCalledWith('failover.status');
        expect(api.call).toHaveBeenCalledWith('failover.disabled.reasons');
        done();
      });
    });

    it('returns error when status is not MASTER', (done) => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Backup);

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({
          success: false,
          error: 'TrueNAS High Availability is in an inconsistent state. Please try again in a few minutes and contact the system administrator if the problem persists.',
          errorType: FailoverErrorType.FailoverFailed,
        });
        done();
      });
    });

    it('handles API errors during license check', (done) => {
      jest.spyOn(api, 'call').mockReturnValue(throwError(() => new Error('API Error')));

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({
          success: false,
          error: 'Unable to check failover status. Please try again later or contact the system administrator.',
          errorType: FailoverErrorType.ApiError,
        });
        done();
      });
    });
  });

  describe('validateFailover integration scenarios', () => {
    it('handles full flow with status check and disabled reasons', (done) => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);
      
      // Mock the job subscription
      jest.spyOn(api, 'subscribe').mockReturnValue(of({
        id: '1',
        msg: 'changed' as const,
        collection: 'core.get_jobs' as const,
        fields: {
          method: 'failover.events.vrrp_master' as any,
          state: JobState.Success,
        } as Job,
      } as any));

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(spectator.inject(LoaderService).open).toHaveBeenCalledWith(
          'Waiting for failover operation to complete...',
        );
        expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
        done();
      });
    });

    it('handles failover job failure in complete flow', (done) => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);
      
      jest.spyOn(api, 'subscribe').mockReturnValue(of({
        id: '1',
        msg: 'changed' as const,
        collection: 'core.get_jobs' as const,
        fields: {
          method: 'failover.events.vrrp_master' as any,
          state: JobState.Failed,
          error: 'Network issue',
        } as Job,
      } as any));

      spectator.service.validateFailover().subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failover operation failed');
        expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
        done();
      });
    });

    it('handles timeout during failover wait', fakeAsync(() => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);
      
      // Mock a subscription that never emits
      jest.spyOn(api, 'subscribe').mockReturnValue(new Observable(() => {}));

      let result: any;
      spectator.service.validateFailover().subscribe((res) => { 
        result = res; 
      });

      tick(300001); // 5 minutes + 1ms

      expect(result).toEqual({
        success: false,
        error: 'Failover operation timed out. This may indicate a problem with the failover process. Please contact the system administrator.',
        errorType: FailoverErrorType.Timeout,
      });
      expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
    }));
  });
});