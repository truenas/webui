import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router, ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnButtonToggleHarness, TnEmptyHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { jobsInitialState, JobsState } from 'app/modules/jobs/store/job.reducer';
import { selectJobs, selectJobState } from 'app/modules/jobs/store/job.selectors';
import { LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { JobsListComponent } from 'app/pages/jobs/jobs-list.component';
import { DownloadService } from 'app/services/download.service';

const fakeJobDataSource: Job[] = [{
  abortable: true,
  arguments: [1],
  id: 446,
  logs_excerpt: "<3>ERROR : webdav root '': error reading source root directory: couldn't list files",
  logs_path: '/var/log/jobs/446.log',
  method: 'cloudsync.sync',
  progress: {
    description: 'Starting',
    percent: 0,
  },
  state: JobState.Failed,
  time_finished: { $date: 1653721201697 },
  time_started: { $date: 1653721201446 },
}, {
  abortable: true,
  arguments: [2],
  id: 445,
  logs_path: '/var/log/jobs/445.log',
  method: 'cloudsync.sync',
  progress: {
    description: 'Starting',
    percent: 100,
  },
  state: JobState.Success,
  time_finished: { $date: 1653721201899 },
  time_started: { $date: 1653721201440 },
}] as Job[];

describe('JobsListComponent', () => {
  let spectator: Spectator<JobsListComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<JobsState>;

  const createComponent = createComponentFactory({
    component: JobsListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'Europe/Kiev',
      }),
      mockProvider(DialogService),
      mockProvider(ActivatedRoute, {
        queryParams: of({}),
      }),
      mockApi([
        mockCall('core.job_download_logs', 'http://localhost/download/log'),
      ]),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(() => of(undefined)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectJobState,
            value: jobsInitialState,
          },
          {
            selector: selectJobs,
            value: [],
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
  });

  it('should show table rows', async () => {
    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();

    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getHeaderTexts()).toEqual(['Name', 'State', 'Started', 'Finished']);
    expect(await table.getRowTexts(0)).toEqual(
      ['cloudsync.sync', 'Failed', '2022-05-28 10:00:01', '2022-05-28 10:00:01'],
    );
    expect(await table.getRowTexts(1)).toEqual(
      ['cloudsync.sync', 'Completed', '2022-05-28 10:00:01', '2022-05-28 10:00:01'],
    );
  });

  it('filters jobs down to failed ones when the Failed tab is selected', async () => {
    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();

    const failedTab = await loader.getHarness(TnButtonToggleHarness.with({ label: 'Failed' }));
    await failedTab.check();
    spectator.detectChanges();

    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getRowCount()).toBe(1);
    expect(await table.getRowTexts(0)).toEqual(
      ['cloudsync.sync', 'Failed', '2022-05-28 10:00:01', '2022-05-28 10:00:01'],
    );
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    store$.overrideSelector(selectJobs, []);
    store$.refreshState();

    spectator.detectChanges();
    const empty = await loader.getHarness(TnEmptyHarness);
    expect(await empty.getTitle()).toBe('No records have been added yet');
  });

  it('should expand only one row on click', async () => {
    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();

    const table = await loader.getHarness(TnTableHarness);
    await table.toggleRowExpansion(0);
    await table.toggleRowExpansion(1);

    expect(spectator.queryAll('.tn-table__row--expanded')).toHaveLength(1);
  });

  it('should auto-expand row when jobId query parameter is provided', async () => {
    const mockActivatedRoute = spectator.inject(ActivatedRoute);
    mockActivatedRoute.queryParams = of({ jobId: '446' });

    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();
    spectator.component.ngOnInit();
    spectator.detectChanges();
    // The expanded row is reconciled from an effect, so it lands on the next change detection.
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(spectator.queryAll('.tn-table__row--expanded')).toHaveLength(1);
    expect(spectator.query('.tn-table__row--expanded')).toContainText('cloudsync.sync');
  });

  it('should not expand any row when jobId query parameter does not match any job', () => {
    const mockActivatedRoute = spectator.inject(ActivatedRoute);
    mockActivatedRoute.queryParams = of({ jobId: '999' });

    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();
    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.queryAll('.tn-table__row--expanded')).toHaveLength(0);
  });

  it('should not expand any row when no jobId query parameter is provided', () => {
    const mockActivatedRoute = spectator.inject(ActivatedRoute);
    mockActivatedRoute.queryParams = of({});

    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();
    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.queryAll('.tn-table__row--expanded')).toHaveLength(0);
  });

  it('keeps the detail row open when the store pushes a fresh copy of the job', async () => {
    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();

    const table = await loader.getHarness(TnTableHarness);
    await table.toggleRowExpansion(0);
    expect(await table.getExpandedRowCount()).toBe(1);

    // A running job updates constantly, and every update replaces the row object.
    store$.overrideSelector(selectJobs, fakeJobDataSource.map((job) => ({ ...job })));
    store$.refreshState();
    spectator.detectChanges();

    expect(await table.getExpandedRowCount()).toBe(1);
  });

  it('sets URL parameters when a row is expanded', async () => {
    const route = spectator.inject(ActivatedRoute);

    const router = spectator.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');
    store$.overrideSelector(selectJobs, fakeJobDataSource);
    store$.refreshState();

    const table = await loader.getHarness(TnTableHarness);
    await table.toggleRowExpansion(0);

    expect(navigateSpy).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { jobId: fakeJobDataSource[0].id },
      queryParamsHandling: 'merge',
    });
  });
});
