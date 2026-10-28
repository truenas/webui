import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import {
  firstValueFrom, Observable, of, throwError,
} from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import {
  FailoverErrorType,
  FailoverValidationResult,
  FailoverValidationService,
} from 'app/services/failover-validation.service';

function vrrpMasterEvent(state: JobState): ApiEvent {
  return {
    id: 1,
    msg: CollectionChangeType.Changed,
    collection: 'core.get_jobs',
    fields: {
      ...fakeSuccessfulJob(),
      id: 1,
      method: 'failover.events.vrrp_master',
      state,
    } as Job,
  };
}

describe('FailoverValidationService', () => {
  let spectator: SpectatorService<FailoverValidationService>;
  let api: MockTypedApiService;

  const createService = createServiceFactory({
    service: FailoverValidationService,
    providers: [
      mockTypedApi([
        mockTypedCall('failover.licensed', true),
        mockTypedCall('failover.status', FailoverStatus.Master),
        mockTypedCall('failover.disabled.reasons', []),
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
    api = spectator.inject(MockTypedApiService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('validateFailover', () => {
    it('returns success when failover is not licensed', async () => {
      api.mockCall('failover.licensed', false);

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result).toEqual({ success: true, isHaLicensed: false });
      expect(api.call).toHaveBeenCalledWith('failover.licensed');
      expect(api.call).not.toHaveBeenCalledWith('failover.status');
    });

    it('returns success when failover is licensed and status is MASTER with no ongoing failover', async () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.NoPong]);

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result).toEqual({ success: true, isHaLicensed: true });
      expect(api.call).toHaveBeenCalledWith('failover.licensed');
      expect(api.call).toHaveBeenCalledWith('failover.status');
      expect(api.call).toHaveBeenCalledWith('failover.disabled.reasons');
    });

    it('returns success when status is SINGLE', async () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Single);

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result).toEqual({ success: true, isHaLicensed: true });
      expect(api.call).toHaveBeenCalledWith('failover.licensed');
      expect(api.call).toHaveBeenCalledWith('failover.status');
      expect(api.call).not.toHaveBeenCalledWith('failover.disabled.reasons');
    });

    it('returns error when status is not MASTER and this node is not taking over', async () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Backup);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.NoPong]);

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result).toEqual({
        success: false,
        error: 'TrueNAS High Availability is in an inconsistent state. Please try again in a few minutes and contact the system administrator if the problem persists.',
        errorType: FailoverErrorType.FailoverFailed,
        isHaLicensed: true,
      });
    });

    it('handles API errors during license check', async () => {
      jest.spyOn(api, 'call').mockReturnValue(throwError(() => new Error('API Error')));

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result).toEqual({
        success: false,
        error: 'Unable to check failover status. Please try again later or contact the system administrator.',
        errorType: FailoverErrorType.ApiError,
        isHaLicensed: false,
      });
    });
  });

  describe('validateFailover integration scenarios', () => {
    it('handles full flow with status check and disabled reasons', async () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);

      // Mock the job subscription
      const mockJobEvent: ApiEvent = {
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

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result).toEqual({ success: true, isHaLicensed: true });
      expect(spectator.inject(LoaderService).open).toHaveBeenCalledWith(
        'Waiting for failover operation to complete...',
      );
      expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
    });

    it('handles failover job failure in complete flow', async () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);

      const mockFailedJobEvent: ApiEvent = {
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

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failover operation failed');
      expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
    });

    it('waits for the takeover when the node signed in to still reports BACKUP, then lets the sign-in through', async () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Backup);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);
      jest.spyOn(api, 'subscribe').mockImplementation(() => {
        // The status is refreshed once the takeover has imported the pools.
        api.mockCall('failover.status', FailoverStatus.Master);
        return of(vrrpMasterEvent(JobState.Success));
      });

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result).toEqual({ success: true, isHaLicensed: true });
      expect(spectator.inject(LoaderService).open).toHaveBeenCalledWith(
        'Waiting for failover operation to complete...',
      );
      expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
    });

    it('refuses the sign-in when the node is still not MASTER after its takeover', async () => {
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Electing);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);
      jest.spyOn(api, 'subscribe').mockReturnValue(of(vrrpMasterEvent(JobState.Success)));

      const result = await firstValueFrom(spectator.service.validateFailover());

      expect(result).toMatchObject({ success: false, errorType: FailoverErrorType.FailoverFailed });
    });

    it('lets the sign-in through once the node stops reporting a takeover, when the job event is missed', async () => {
      jest.useFakeTimers();
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);
      jest.spyOn(api, 'subscribe').mockReturnValue(new Observable(() => {}));

      let result: FailoverValidationResult | undefined;
      spectator.service.validateFailover().subscribe((response) => {
        result = response;
      });

      await jest.advanceTimersByTimeAsync(5000);
      expect(result).toBeUndefined();

      api.mockCall('failover.disabled.reasons', []);
      await jest.advanceTimersByTimeAsync(5000);

      expect(result).toEqual({ success: true, isHaLicensed: true });
      expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
    });

    it('handles timeout during failover wait', async () => {
      jest.useFakeTimers();
      api.mockCall('failover.licensed', true);
      api.mockCall('failover.status', FailoverStatus.Master);
      api.mockCall('failover.disabled.reasons', [FailoverDisabledReason.LocFailoverOngoing]);

      // Mock a subscription that never emits
      jest.spyOn(api, 'subscribe').mockReturnValue(new Observable(() => {}));

      let result: FailoverValidationResult;
      spectator.service.validateFailover().subscribe((response) => {
        result = response;
      });

      await jest.advanceTimersByTimeAsync(300001); // 5 minutes + 1ms

      expect(result).toEqual({
        success: false,
        error: 'Failover operation timed out. This may indicate a problem with the failover process. Please contact the system administrator.',
        errorType: FailoverErrorType.Timeout,
        isHaLicensed: true,
      });
      expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
    });
  });
});
