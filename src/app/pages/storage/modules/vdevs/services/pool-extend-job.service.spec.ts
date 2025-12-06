import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { PoolAttachParams } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { PoolExtendJobService } from './pool-extend-job.service';

describe('PoolExtendJobService', () => {
  let spectator: SpectatorService<PoolExtendJobService>;

  const createService = createServiceFactory({
    service: PoolExtendJobService,
    providers: [
      mockProvider(ApiService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('checkForExistingExtendJob', () => {
    it('returns true when there is a running pool.attach job for the pool', () => {
      const poolId = 123;
      const jobs = [{
        arguments: [poolId, {} as PoolAttachParams],
        state: JobState.Running,
      }] as Job<unknown, [number, PoolAttachParams]>[];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of(jobs));

      spectator.service.checkForExistingExtendJob(poolId).subscribe((hasJob) => {
        expect(hasJob).toBe(true);
      });
    });

    it('returns true when there is a waiting pool.attach job for the pool', () => {
      const poolId = 456;
      const jobs = [{
        arguments: [poolId, {} as PoolAttachParams],
        state: JobState.Waiting,
      }] as Job<unknown, [number, PoolAttachParams]>[];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of(jobs));

      spectator.service.checkForExistingExtendJob(poolId).subscribe((hasJob) => {
        expect(hasJob).toBe(true);
      });
    });

    it('returns false when there are no pool.attach jobs for the pool', () => {
      const poolId = 789;
      const jobs = [{
        arguments: [999, {} as PoolAttachParams], // Different pool ID
        state: JobState.Running,
      }] as Job<unknown, [number, PoolAttachParams]>[];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of(jobs));

      spectator.service.checkForExistingExtendJob(poolId).subscribe((hasJob) => {
        expect(hasJob).toBe(false);
      });
    });

    it('returns false when there are no jobs at all', () => {
      const poolId = 111;
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of([]));

      spectator.service.checkForExistingExtendJob(poolId).subscribe((hasJob) => {
        expect(hasJob).toBe(false);
      });
    });

    it('returns false when API call fails (fail-open)', () => {
      const poolId = 222;
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => new Error('API error')),
      );

      spectator.service.checkForExistingExtendJob(poolId).subscribe((hasJob) => {
        expect(hasJob).toBe(false);
      });
    });

    it('calls core.get_jobs with correct filters', () => {
      const poolId = 333;
      const apiSpy = jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of([]));

      spectator.service.checkForExistingExtendJob(poolId).subscribe();

      expect(apiSpy).toHaveBeenCalledWith('core.get_jobs', [[
        ['method', '=', 'pool.attach'],
        ['state', 'in', [JobState.Running, JobState.Waiting]],
      ]]);
    });
  });
});
