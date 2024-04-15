import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CloudBackupSnapshot, SnapshotIncludeExclude } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
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
        mockCall('cloud_backup.restore'),
      ]),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(FilesystemService),
      { provide: SLIDE_IN_DATA, useValue: { id: 1 } as unknown as CloudBackupSnapshot },
    ],
  });

  describe('handles form', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('submits backup restore from snapshot without exclude options', async () => {
      spectator.component.form.patchValue({
        target: '/mnt/my pool',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloud_backup.restore', [{
        exclude: null,
        snapshot_id: 1,
        target: '/mnt/my pool',
      }]);
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloud_backup.restore', [{
        exclude: ['/mnt/another'],
        snapshot_id: 1,
        target: '/mnt/my pool',
      }]);
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloud_backup.restore', [{
        exclude: 'pattern',
        snapshot_id: 1,
        target: '/mnt/my pool',
      }]);
    });
  });
});
