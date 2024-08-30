import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SnapshotIncludeExclude } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('CloudBackupRestoreFromSnapshotFormComponent', () => {
  let loader: HarnessLoader;
  let spectator: Spectator<CloudBackupRestoreFromSnapshotFormComponent>;
  const createComponent = createComponentFactory({
    component: CloudBackupRestoreFromSnapshotFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [],
    providers: [
      mockAuth(),
      mockProvider(DialogService),
      mockWebSocket([
        mockJob('cloud_backup.restore'),
      ]),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(FilesystemService),
      {
        provide: SLIDE_IN_DATA,
        useValue: {
          snapshot: { id: 1 },
          backup: { id: 1, path: '/mnt/backup/path' },
        },
      },
    ],
  });

  describe('handles form', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('submits backup restore from snapshot with `Include Everything`', async () => {
      spectator.component.form.patchValue({
        target: '/mnt/my pool',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/backup/path',
        '/mnt/my pool',
        {},
      ]);
    });

    it('submits backup restore from snapshot with `Select paths to exclude`', async () => {
      spectator.component.form.patchValue({
        target: '/mnt/my pool',
        includeExclude: SnapshotIncludeExclude.ExcludePaths,
      });

      spectator.component.form.patchValue({
        excludedPaths: ['/mnt/another'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/backup/path',
        '/mnt/my pool',
        {
          exclude: [
            '/mnt/another',
          ],
        },
      ]);
    });

    it('submits backup restore from snapshot with `Include from subfolder`', async () => {
      spectator.component.form.patchValue({
        target: '/mnt/my pool',
        includeExclude: SnapshotIncludeExclude.IncludeFromSubFolder,
      });

      spectator.component.form.patchValue({
        subFolder: '/test',
        includedPaths: ['/test/first'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/test',
        '/mnt/my pool',
        {
          include: [
            '/test/first',
          ],
        },
      ]);
    });

    it('submits backup restore from snapshot with `Exclude by pattern`', async () => {
      spectator.component.form.patchValue({
        target: '/mnt/my pool',
        includeExclude: SnapshotIncludeExclude.ExcludeByPattern,
      });

      spectator.component.form.patchValue({
        excludePattern: 'pattern',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/backup/path',
        '/mnt/my pool',
        {
          exclude: [
            'pattern',
          ],
        },
      ]);
    });
  });
});
