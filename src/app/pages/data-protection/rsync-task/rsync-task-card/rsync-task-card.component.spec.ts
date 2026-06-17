import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { fakeDate, restoreDate } from 'app/core/testing/utils/mock-clock.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { RsyncMode } from 'app/enums/rsync-mode.enum';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { RsyncTaskCardComponent } from 'app/pages/data-protection/rsync-task/rsync-task-card/rsync-task-card.component';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('RsyncTaskCardComponent', () => {
  let spectator: Spectator<RsyncTaskCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const rowMenuTrigger = '[data-test="button-card-rsync-task-mnt-apps-asd-more-action"]';

  beforeEach(() => fakeDate(new Date('2026-01-20T00:00:00Z')));
  afterEach(() => restoreDate());

  const rsyncTasks = [
    {
      id: 1,
      path: '/mnt/APPS',
      remotehost: 'asd',
      remoteport: null,
      remotemodule: 'asdad',
      desc: 'asd',
      user: 'test',
      enabled: false,
      mode: RsyncMode.Module,
      remotepath: '',
      direction: Direction.Push,
      delayupdates: true,
      job: {
        id: 1,
        state: JobState.Failed,
        time_finished: {
          $date: new Date('2026-01-19T23:59:10Z').getTime(),
        },
      },
      ssh_credentials: null,
      schedule: {
        minute: '0',
        hour: '*',
        dom: '*',
        month: '*',
        dow: '*',
      },
      locked: false,
      state: {
        state: 'FAILED',
      },
    } as unknown as RsyncTaskUi,
  ];

  const createComponent = createComponentFactory({
    component: RsyncTaskCardComponent,
    imports: [],
    providers: [
      mockAuth(),
      provideMockStore({
        initialState: {
          alerts: {
            ids: [], entities: {}, isLoading: false, isPanelOpen: false, error: null,
          },
        },
        selectors: [
          {
            selector: selectJobs,
            value: rsyncTasks.map((task) => task.job),
          },
          {
            selector: selectSystemConfigState,
            value: {},
          },
        ],
      }),
      mockApi([
        mockCall('rsynctask.query', rsyncTasks),
        mockCall('rsynctask.delete'),
        mockCall('rsynctask.update'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(LocaleService),
    ],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    spectator.click(rowMenuTrigger);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Path', 'State', 'Enabled', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['/mnt/APPS', 'Failed', '', ''],
    ]);
  });

  it('repaints the row through the data provider when the backing job changes in the background', () => {
    const emissions: RsyncTaskUi[][] = [];
    const subscription = spectator.component.dataProvider.currentPage$.subscribe((rows) => emissions.push(rows));
    const emissionsBefore = emissions.length;

    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectJobs, [{ id: 1, state: JobState.Success } as Job]);
    store$.refreshState();

    // The status pill is presentational now, so a fresh array must be pushed through
    // the provider (an in-place mutation would leave OnPush from repainting).
    expect(emissions.length).toBeGreaterThan(emissionsBefore);
    expect(emissions.at(-1)?.[0].state).toEqual({ state: JobState.Success });
    subscription.unsubscribe();
  });

  it('shows form to edit an existing Rsync Task when Edit button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: /^Edit$/ });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      RsyncTaskFormComponent,
      {
        wide: true,
        data: rsyncTasks[0],
      },
    );
  });

  it('shows form to create new Rsync Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      RsyncTaskFormComponent,
      { wide: true },
    );
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');

    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Run job' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run «asd - asdad» Rsync now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('rsynctask.run', [1]);
  });

  it('deletes a Rsync Task with confirmation when Delete button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Rsync Task <b>"asd - asdad"</b>?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('rsynctask.delete', [1]);
  });

  it('updates Rsync Task Enabled status once toggle is updated', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'rsynctask.update',
      [1, { enabled: true }],
    );
  });
});
