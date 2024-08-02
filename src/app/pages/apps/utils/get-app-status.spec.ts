import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ChartScaleResult, AppStartQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';
import { getAppStatus } from 'app/pages/apps/utils/get-app-status';

describe('getAppStatus', () => {
  const app = {
    id: 'ix-test-app',
    name: 'test-app',
    metadata: {
      name: 'rude-cardinal',
    },
    catalog: 'test-catalog',
    catalog_train: 'test-catalog-train',
    status: ChartReleaseStatus.Active,
  } as App;
  const job = {
    arguments: ['fake-name', { replica_count: 1 }] as AppStartQueryParams,
    state: JobState.Success,
  } as Job<ChartScaleResult, AppStartQueryParams>;

  it('should return Started', () => {
    const result = getAppStatus(app, job);

    expect(result).toEqual(AppStatus.Started);
  });

  it('should return Starting', () => {
    const result = getAppStatus(app, { ...job, state: JobState.Running });

    expect(result).toEqual(AppStatus.Starting);
  });

  it('should return Deploying', () => {
    const result = getAppStatus({
      ...app,
      status: ChartReleaseStatus.Deploying,
    });

    expect(result).toEqual(AppStatus.Deploying);
  });

  it('should return Stopping', () => {
    const result = getAppStatus(app, {
      ...job,
      state: JobState.Running,
      arguments: ['fake-name', { replica_count: 0 }],
    });

    expect(result).toEqual(AppStatus.Stopping);
  });

  it('should return Stopped', () => {
    const result = getAppStatus({
      ...app,
      status: ChartReleaseStatus.Stopped,
    }, {
      ...job,
      state: JobState.Success,
      arguments: ['fake-name', { replica_count: 0 }],
    });

    expect(result).toEqual(AppStatus.Stopped);
  });
});
