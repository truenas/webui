import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncListComponent } from 'app/pages/data-protection/cloudsync/cloudsync-list/cloudsync-list.component';
import { CloudsyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CloudsyncListComponent', () => {
  let spectator: Spectator<CloudsyncListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const cloudSyncList = [
    {
      id: 1,
      description: 'custom-cloudlist',
      path: '/mnt/APPS',
      attributes: {
        folder: '',
        fast_list: false,
        acknowledge_abuse: false,
      },
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
    } as unknown as CloudSyncTaskUi,
  ];

  const createComponent = createComponentFactory({
    component: CloudsyncListComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('cloudsync.query', cloudSyncList),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(LocaleService),
      mockProvider(TaskService, {
        getTaskNextRun: jest.fn(() => 'in about 10 hours'),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
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
  });

  it('shows form to edit an existing interface when Edit button is pressed', async () => {
    await table.clickToggle(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CloudsyncFormComponent, {
      data: expect.objectContaining(cloudSyncList[0]),
      wide: true,
    });
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
  });

  it('shows dialog when Restore button is pressed', async () => {
    await table.clickToggle(0);

    jest.spyOn(spectator.inject(MatDialog), 'open');

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Restore' }));
    await editButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(CloudsyncRestoreDialogComponent, {
      data: 1,
    });
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
  });
});
