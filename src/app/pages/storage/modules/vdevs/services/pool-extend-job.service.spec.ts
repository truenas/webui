import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, throwError } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { PoolExtendJobService } from './pool-extend-job.service';

describe('PoolExtendJobService', () => {
  let spectator: SpectatorService<PoolExtendJobService>;

  const createService = createServiceFactory({
    service: PoolExtendJobService,
    providers: [
      mockTypedApi(),
    ],
  });

  function mockJobs(jobs: Partial<WebUiQueryEntity<'core.get_jobs'>>[]): void {
    spectator.inject(MockTypedApiService).mockQuery('core.get_jobs', jobs as WebUiQueryEntity<'core.get_jobs'>[]);
  }

  beforeEach(() => {
    spectator = createService();
  });

  describe('checkForExistingExtendJob', () => {
    it('returns true when there is a running pool.attach job for the pool', async () => {
      mockJobs([{ arguments: [123, {}], state: JobState.Running }]);

      expect(await firstValueFrom(spectator.service.checkForExistingExtendJob(123))).toBe(true);
    });

    it('returns true when there is a waiting pool.attach job for the pool', async () => {
      mockJobs([{ arguments: [456, {}], state: JobState.Waiting }]);

      expect(await firstValueFrom(spectator.service.checkForExistingExtendJob(456))).toBe(true);
    });

    it('returns false when there are no pool.attach jobs for the pool', async () => {
      mockJobs([{ arguments: [999, {}], state: JobState.Running }]);

      expect(await firstValueFrom(spectator.service.checkForExistingExtendJob(789))).toBe(false);
    });

    it('returns false when there are no jobs at all', async () => {
      mockJobs([]);

      expect(await firstValueFrom(spectator.service.checkForExistingExtendJob(111))).toBe(false);
    });

    it('returns false when API call fails (fail-open)', async () => {
      spectator.inject(MockTypedApiService).query.mockReturnValue(throwError(() => new Error('API error')));

      expect(await firstValueFrom(spectator.service.checkForExistingExtendJob(222))).toBe(false);
    });

    it('queries core.get_jobs with correct filters', async () => {
      mockJobs([]);

      await firstValueFrom(spectator.service.checkForExistingExtendJob(333));

      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('core.get_jobs', [
        ['method', '=', 'pool.attach'],
        ['state', 'in', [JobState.Running, JobState.Waiting]],
      ]);
    });
  });
});
