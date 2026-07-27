import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnRadioHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { firstValueFrom, of } from 'rxjs';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import {
  CloudBackup,
  CloudBackupSnapshot,
  CloudBackupSnapshotDirectoryFileType,
  CloudBackupSnapshotDirectoryListing,
} from 'app/interfaces/cloud-backup.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
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
      MockComponent(ExplorerCreateDatasetComponent),
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
        mockCall('cloud_backup.list_snapshot_directory', [
          { name: 'sub', path: '/sub', type: CloudBackupSnapshotDirectoryFileType.Dir },
          { name: 'file.txt', path: '/file.txt', type: CloudBackupSnapshotDirectoryFileType.File },
        ] as CloudBackupSnapshotDirectoryListing[]),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(FilesystemService),
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
    ],
  });

  describe('handles form', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('submits backup restore from snapshot with `Include Everything`', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
      });

      spectator.component.submit();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/dozer',
        '/mnt/bulldozer',
        {},
      ]);
    });

    it('submits backup restore from snapshot with `Select paths to exclude`', async () => {
      const includeExclude = await loader.getHarness(TnRadioHarness.with({ label: 'Select paths to exclude' }));
      await includeExclude.check();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
        'Excluded Paths': '/mnt/dozer/another',
      });

      spectator.component.submit();

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
      const includeExclude = await loader.getHarness(TnRadioHarness.with({ label: 'Include from subfolder' }));
      await includeExclude.check();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
        Subfolder: '/mnt/dozer',
        'Included Paths': '/mnt/dozer/a',
      });

      spectator.component.submit();

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

    it('forwards a selected file path as-is through include params', async () => {
      const includeExclude = await loader.getHarness(TnRadioHarness.with({ label: 'Include from subfolder' }));
      await includeExclude.check();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
        Subfolder: '/mnt/dozer',
        'Included Paths': '/mnt/dozer/file.txt',
      });

      spectator.component.submit();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/dozer',
        '/mnt/bulldozer',
        {
          include: [
            '/file.txt',
          ],
        },
      ]);
    });

    it('submits backup restore from snapshot with `Include from subfolder` matches paths', async () => {
      const includeExclude = await loader.getHarness(TnRadioHarness.with({ label: 'Include from subfolder' }));
      await includeExclude.check();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
        Subfolder: '/mnt/dozer/a',
        'Included Paths': '/mnt/dozer/a',
      });

      spectator.component.submit();

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
      const includeExclude = await loader.getHarness(TnRadioHarness.with({ label: 'Exclude by pattern' }));
      await includeExclude.check();

      const pattern = await loader.getHarness(TnInputHarness.with({ name: 'excludePattern' }));
      await pattern.setValue('pattern');

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
      });

      spectator.component.submit();

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

  describe('snapshot node provider', () => {
    beforeEach(() => {
      spectator = createComponent();
    });

    it('lists both directories and files from a snapshot directory', async () => {
      const node = { data: { path: '/' } } as TreeNode<ExplorerNodeData>;
      const nodes = await firstValueFrom(spectator.component.snapshotNodeProvider(node));

      expect(nodes).toEqual([
        expect.objectContaining({ path: '/sub', type: ExplorerNodeType.Directory, hasChildren: true }),
        expect.objectContaining({ path: '/file.txt', type: ExplorerNodeType.File, hasChildren: false }),
      ]);
    });

    it('lists only directories for the subfolder selector', async () => {
      const node = { data: { path: '/' } } as TreeNode<ExplorerNodeData>;
      const nodes = await firstValueFrom(spectator.component.subFolderNodeProvider(node));

      expect(nodes).toEqual([
        expect.objectContaining({ path: '/sub', type: ExplorerNodeType.Directory, hasChildren: true }),
      ]);
    });
  });

  describe('includedPathsRootNodes signal', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('initializes includedPathsRootNodes with backup path', () => {
      const component = spectator.component as unknown as { includedPathsRootNodes: () => unknown[] };
      const rootNodes = component.includedPathsRootNodes();
      expect(rootNodes).toHaveLength(1);
      expect(rootNodes[0]).toMatchObject({
        path: '/mnt/dozer',
        name: '/mnt/dozer',
      });
    });

    it('updates includedPathsRootNodes when subfolder changes', async () => {
      const includeExclude = await loader.getHarness(TnRadioHarness.with({ label: 'Include from subfolder' }));
      await includeExclude.check();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Subfolder: '/mnt/dozer/subfolder',
      });

      const component = spectator.component as unknown as { includedPathsRootNodes: () => unknown[] };
      const rootNodes = component.includedPathsRootNodes();
      expect(rootNodes).toHaveLength(1);
      expect(rootNodes[0]).toMatchObject({
        path: '/mnt/dozer/subfolder',
        name: '/mnt/dozer/subfolder',
      });
    });

    it('resets includedPaths when subfolder changes', async () => {
      spectator.component.form.patchValue({
        includedPaths: ['/mnt/dozer/path1', '/mnt/dozer/path2'],
      });

      const includeExclude = await loader.getHarness(TnRadioHarness.with({ label: 'Include from subfolder' }));
      await includeExclude.check();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Subfolder: '/mnt/dozer/new-subfolder',
      });

      expect(spectator.component.form.controls.includedPaths.value).toEqual([]);
    });
  });

  describe('side panel host (no SlideInRef)', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SlideInRef, useValue: null },
        ],
        props: {
          restoreData: data,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('resolves data from the restoreData input and emits closed on save', async () => {
      const closedSpy = jest.spyOn(spectator.component.closed, 'emit');

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Target: '/mnt/bulldozer',
      });
      spectator.component.submit();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('cloud_backup.restore', [
        1,
        1,
        '/mnt/dozer',
        '/mnt/bulldozer',
        {},
      ]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
