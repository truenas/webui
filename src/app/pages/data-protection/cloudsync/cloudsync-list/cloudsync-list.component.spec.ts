import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall, mockJob } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudSyncListComponent } from 'app/pages/data-protection/cloudsync/cloudsync-list/cloudsync-list.component';
import { CloudSyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { SlideInService } from 'app/services/slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CloudSyncListComponent', () => {
  let spectator: Spectator<CloudSyncListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const cloudSyncList = [
    {
      id: 1,
      description: 'custom-cloudlist',
      path: '/mnt/APPS',
      attributes: {
        folder: '',
        fast_list: false,
        acknowledge_abuse: false,
      } as Record<string, string | boolean>,
      pre_script: '',
      post_script: '',
      snapshot: false,
      include: [
        '//**',
        '/Folder1/**',
      ],
      transfers: 4,
      args: '',
      enabled: true,
      job: null,
      direction: 'PULL',
      transfer_mode: 'COPY',
      encryption: false,
      filename_encryption: false,
      encryption_password: '',
      encryption_salt: '',
      create_empty_src_dirs: false,
      follow_symlinks: false,
      credentials: {
        id: 1,
        name: 'Google Drive',
        provider: 'GOOGLE_DRIVE',
        attributes: {},
      },
      schedule: {
        minute: '0',
        hour: '0',
        dom: '*',
        month: '*',
        dow: '*',
      },
      locked: false,
      state: {
        state: 'PENDING',
      },
    } as CloudSyncTaskUi,
  ];

  const createComponent = createComponentFactory({
    component: CloudSyncListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
      IxTableDetailsRowComponent,
      IxTableDetailsRowDirective,
    ],
    providers: [
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of()),
      }),
      mockAuth(),
      mockWebSocket([
        mockCall('cloudsync.query', cloudSyncList),
        mockCall('cloudsync.delete'),
        mockJob('cloudsync.sync', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(SlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextTime: jest.fn(() => new Date(new Date().getTime() + (25 * 60 * 60 * 1000))),
      }),
      mockProvider(SnackbarService),
      provideMockStore({
        selectors: [
          {
            selector: selectJob(1),
            value: fakeSuccessfulJob(),
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Description', 'Frequency', 'State', 'Enabled'],
      ['custom-cloudlist', '', 'PENDING', 'Yes'],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');
    await table.clickToggle(0);

    const runNowButton = await loader.getHarness(MatButtonHarness.with({ text: 'Run Now' }));
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run «custom-cloudlist» Cloud Sync now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloudsync.sync', [1]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.query');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Cloud Sync «custom-cloudlist» has started.');
  });

  it('shows form to edit an existing CloudSync when Edit button is pressed', async () => {
    await table.clickToggle(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      CloudSyncFormComponent,
      true,
      expect.objectContaining(cloudSyncList[0]),
    );

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.query');
  });

  it('deletes a Cloud Sync with confirmation when Delete button is pressed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm');

    await table.clickToggle(0);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Cloud Sync Task <b>"custom-cloudlist"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.delete', [1]);
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.query');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Cloud Sync «custom-cloudlist» has been deleted.');
  });

  it('shows dialog when Restore button is pressed', async () => {
    await table.clickToggle(0);

    jest.spyOn(spectator.inject(MatDialog), 'open');

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Restore' }));
    await editButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CloudSyncRestoreDialogComponent, {
      data: 1,
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.query');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Cloud Sync «custom-cloudlist» has been restored.');
  });

  it('shows confirmation dialog when Dry Run button is pressed', async () => {
    await table.clickToggle(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Dry Run' }));
    await editButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Test Cloud Sync',
      message: 'Start a dry run test of this cloud sync task? The  system will connect to the cloud service provider and simulate  transferring a file. No data will be sent or received.',
      hideCheckbox: true,
    });

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloudsync.sync', [1, { dry_run: true }]);
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.query');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Cloud Sync «custom-cloudlist» has started.');
  });
});
