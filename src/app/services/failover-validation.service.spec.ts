import { fakeAsync, tick } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import {
  FailoverErrorType,
  FailoverValidationResult,
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
    it('returns success when failover is not licensed', () => {
      api.mockCall('failover.licensed', false);

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(api.call).toHaveBeenCalledWith('failover.licensed');
        expect(api.call).not.toHaveBeenCalledWith('failover.status');
      });
    });

    it('returns success when failover is licensed and status is MASTER with no ongoing failover', () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.NoPong]);

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(api.call).toHaveBeenCalledWith('failover.licensed');
        expect(api.call).toHaveBeenCalledWith('failover.status');
        expect(api.call).toHaveBeenCalledWith('failover.disabled.reasons');
      });
    });

    it('returns success when status is SINGLE', () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Single);

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(api.call).toHaveBeenCalledWith('failover.licensed');
        expect(api.call).toHaveBeenCalledWith('failover.status');
        expect(api.call).not.toHaveBeenCalledWith('failover.disabled.reasons');
      });
    });

    it('returns error when status is not MASTER', () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Backup);

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({
          success: false,
          error: 'TrueNAS High Availability is in an inconsistent state. Please try again in a few minutes and contact the system administrator if the problem persists.',
          errorType: FailoverErrorType.FailoverFailed,
        });
      });
    });

    it('handles API errors during license check', () => {
      jest.spyOn(api, 'call').mockReturnValue(throwError(() => new Error('API Error')));

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({
          success: false,
          error: 'Unable to check failover status. Please try again later or contact the system administrator.',
          errorType: FailoverErrorType.ApiError,
        });
      });
    });
  });

  describe('validateFailover integration scenarios', () => {
    it('handles full flow with status check and disabled reasons', () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);

      // Mock the job subscription
      const mockJobEvent: ApiEventTyped<'core.get_jobs'> = {
        id: 1,
        msg: CollectionChangeType.Changed,
        collection: 'core.get_jobs',
        fields: {
          ...fakeSuccessfulJob(),
          id: 1,
          method: 'failover.events.vrrp_master',
          state: JobState.Success,
        } as Job,
      };
      jest.spyOn(api, 'subscribe').mockReturnValue(of(mockJobEvent));

      spectator.service.validateFailover().subscribe((result) => {
        expect(result).toEqual({ success: true });
        expect(spectator.inject(LoaderService).open).toHaveBeenCalledWith(
          'Waiting for failover operation to complete...',
        );
        expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
      });
    });

    it('handles failover job failure in complete flow', () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);

      const mockFailedJobEvent: ApiEventTyped<'core.get_jobs'> = {
        id: 1,
        msg: CollectionChangeType.Changed,
        collection: 'core.get_jobs',
        fields: {
          ...fakeSuccessfulJob(),
          id: 1,
          method: 'failover.events.vrrp_master',
          state: JobState.Failed,
          error: 'Network issue',
        } as Job,
      };
      jest.spyOn(api, 'subscribe').mockReturnValue(of(mockFailedJobEvent));

      spectator.service.validateFailover().subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failover operation failed');
        expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
      });
    });

    it('handles timeout during failover wait', fakeAsync(() => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);

      // Mock a subscription that never emits
      jest.spyOn(api, 'subscribe').mockReturnValue(new Observable(() => {}));

      let result: FailoverValidationResult;
      spectator.service.validateFailover().subscribe((response) => {
        result = response;
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
