import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CloudBackup, CloudBackupSnapshot } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudBackupRestoreFromSnapshotFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-restore-form-snapshot-form/cloud-backup-restore-from-snapshot-form.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('CloudBackupRestoreFromSnapshotFormComponent', () => {
  let loader: HarnessLoader;
  let spectator: Spectator<CloudBackupRestoreFromSnapshotFormComponent>;

  const data = {
    backup: { id: 1, path: '/mnt/dozer', absolute_paths: true } as CloudBackup,
    snapshot: { id: 1 } as unknown as CloudBackupSnapshot,
  };

  const slideInRef: SlideInRef<{ backup: CloudBackup; snapshot: CloudBackupSnapshot } | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => data),
  };

  const createComponent = createComponentFactory({
    component: CloudBackupRestoreFromSnapshotFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockApi([
        mockJob('cloud_backup.restore'),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
        components$: of([]),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(FilesystemService),
    ],
  });

  describe('handles form', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('submits backup restore from snapshot with `Include Everything`', async () => {
      spectator.component.form.patchValue({
        target: '/mnt/bulldozer',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/dozer',
        '/mnt/bulldozer',
        {},
      ]);
    });

    it('submits backup restore from snapshot with `Select paths to exclude`', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
        'Include/Exclude': 'Select paths to exclude',
        'Excluded Paths': '/mnt/dozer/another',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/dozer',
        '/mnt/bulldozer',
        {
          exclude: [
            '/another',
          ],
        },
      ]);
    });

    it('submits backup restore from snapshot with `Include from subfolder`', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
        'Include/Exclude': 'Include from subfolder',
        Subfolder: '/mnt/dozer',
        'Included Paths': '/mnt/dozer/a',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/dozer',
        '/mnt/bulldozer',
        {
          include: [
            '/a',
          ],
        },
      ]);
    });

    it('submits backup restore from snapshot with `Include from subfolder` matches paths', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
        'Include/Exclude': 'Include from subfolder',
        Subfolder: '/mnt/dozer/a',
        'Included Paths': '/mnt/dozer/a',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/dozer/a',
        '/mnt/bulldozer',
        {
          include: [
            '/',
          ],
        },
      ]);
    });

    it('submits backup restore from snapshot with `Exclude by pattern`', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
        'Include/Exclude': 'Exclude by pattern',
        Pattern: 'pattern',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/dozer',
        '/mnt/bulldozer',
        {
          exclude: [
            'pattern',
          ],
        },
      ]);
    });
  });
});
