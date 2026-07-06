import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { fakeDate, restoreDate } from 'app/core/testing/utils/mock-clock.utils';
import { JobState } from 'app/enums/job-state.enum';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { Job } from 'app/interfaces/job.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationRestoreDialog } from 'app/pages/data-protection/replication/replication-restore-dialog/replication-restore-dialog.component';
import { ReplicationTaskCardComponent } from 'app/pages/data-protection/replication/replication-task-card/replication-task-card.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DownloadService } from 'app/services/download.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('ReplicationTaskCardComponent', () => {
  let spectator: Spectator<ReplicationTaskCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const rowMenuTrigger = '[data-test="button-replication-task-apps-test2-apps-test3-more-action"]';

  beforeEach(() => fakeDate(new Date('2026-01-20T00:00:00Z')));
  afterEach(() => restoreDate());

  const replicationTasks = [
    {
      id: 1,
      target_dataset: 'APPS/test3',
      enabled: false,
      direction: 'PUSH',
      transport: 'LOCAL',
      source_datasets: [
        'APPS/test2',
      ],
      has_encrypted_dataset_keys: true,
      name: 'APPS/test2 - APPS/test3',
      job: {
        id: 1,
        state: JobState.Success,
      },
      state: {
        state: 'FINISHED',
        last_snapshot: 'APPS/test2@auto-2023-09-19_00-00',
        datetime: {
          $date: new Date('2026-01-19T23:59:10Z').getTime(),
        },
      },
    } as ReplicationTask,
  ];

  const createComponent = createComponentFactory({
    component: ReplicationTaskCardComponent,
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
            selector: selectGeneralConfig,
            value: {
              timezone: 'Europe/Kiev',
            },
          },
          {
            selector: selectPreferences,
            value: {},
          },
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectJobs,
            value: [{ id: 1, state: JobState.Success } as Job],
          },
        ],
      }),
      mockApi([
        mockCall('replication.query', replicationTasks),
        mockCall('core.get_jobs', []),
        mockCall('replication.delete'),
        mockCall('replication.update'),
        mockJob('replication.run', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(DownloadService, {
        coreDownload: jest.fn(() => of(undefined)),
      }),
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
    expect(await table.getHeaderTexts()).toEqual(['Name', 'State', 'Enabled', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['APPS/test2 - APPS/test3', 'Completed', '', ''],
    ]);
  });

  it('repaints the row through the data provider when the backing job changes in the background', () => {
    const emissions: ReplicationTask[][] = [];
    const subscription = spectator.component.dataProvider.currentPage$.subscribe((rows) => emissions.push(rows));
    const emissionsBefore = emissions.length;

    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectJobs, [{ id: 1, state: JobState.Failed } as Job]);
    store$.refreshState();

    // The status pill is presentational now, so a fresh array must be pushed through
    // the provider (an in-place mutation would leave OnPush from repainting).
    expect(emissions.length).toBeGreaterThan(emissionsBefore);
    expect(emissions.at(-1)?.[0].state.state).toBe(JobState.Failed);
    subscription.unsubscribe();
  });

  it('shows form to edit an existing Replication Task when Edit button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: /^Edit$/ });

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      ReplicationFormComponent,
      {
        title: 'Edit Replication Task',
        wide: true,
        inputs: { replicationToEdit: replicationTasks[0] },
      },
    );
  });

  it('shows form to create new Replication Task when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      ReplicationWizardComponent,
      {
        title: 'Replication Task Wizard',
        wide: true,
        footerless: true,
      },
    );
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Run job' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Replicate «APPS/test2 - APPS/test3» now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('replication.run', [1]);
  });

  it('shows dialog when Restore button is pressed', async () => {
    jest.spyOn(spectator.inject(TnDialog), 'open');
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Restore' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ReplicationRestoreDialog, {
      data: 1,
    });
  });

  it('downloads Encryption Keys', async () => {
    jest.spyOn(spectator.inject(TnDialog), 'open');
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Download encryption keys' });

    expect(spectator.inject(DownloadService).coreDownload).toHaveBeenCalledWith({
      arguments: [1],
      fileName: 'APPS/test2 - APPS/test3_encryption_keys.json',
      method: 'pool.dataset.export_keys_for_replication',
      mimeType: 'application/json',
    });
  });

  it('deletes a Replication Task with confirmation when Delete button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Replication Task <b>"APPS/test2 - APPS/test3"</b>?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('replication.delete', [1]);
  });

  it('updates Replication Task Enabled status once toggle is updated', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'replication.update',
      [1, { enabled: true }],
    );
  });
});
