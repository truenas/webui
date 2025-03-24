import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  MAT_DIALOG_DATA, MatDialog, MatDialogRef,
} from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationVolume } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ImportZvolsDialogComponent,
} from 'app/pages/instances/components/common/volumes-dialog/import-zvol-dialog/import-zvols-dialog.component';
import {
  NewVolumeDialogComponent,
} from 'app/pages/instances/components/common/volumes-dialog/new-volume-dialog/new-volume-dialog.component';
import {
  UploadIsoButtonComponent,
} from 'app/pages/instances/components/common/volumes-dialog/upload-iso-button/upload-iso-button.component';
import {
  VolumesDialogComponent,
} from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';

describe('VolumesDialogComponent', () => {
  let spectator: Spectator<VolumesDialogComponent>;
  let loader: HarnessLoader;
  const volumes = [
    {
      id: 'ubuntu.iso',
      name: 'ubuntu.iso',
      content_type: 'ISO',
      created_at: '2025-01-28T15:45:47.527725382-08:00',
      used_by: [],
      config: {
        size: 17,
      },
    },
    {
      id: 'windows.iso',
      name: 'windows.iso',
      content_type: 'ISO',
      created_at: '2025-01-29T15:45:47.527725382-08:00',
      used_by: ['my-instance', 'test'],
      config: {
        size: 1024,
      },
    },
  ] as VirtualizationVolume[];

  const createComponent = createComponentFactory({
    component: VolumesDialogComponent,
    imports: [
      MockComponent(UploadIsoButtonComponent),
    ],
    providers: [
      mockApi([
        mockCall('virt.volume.query', volumes),
        mockCall('virt.volume.delete'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(SnackbarService),
      mockProvider(LocaleService, {
        timezone: 'UTC',
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: undefined,
      },
      mockAuth(),
    ],
  });

  describe('default mode', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows a list of existing volumes', async () => {
      const table = await loader.getHarness(IxTableHarness);

      expect(await table.getCellTexts()).toEqual([
        ['Name', 'Size', 'Created At', 'Used By', ''],
        ['ubuntu.iso', '17 MiB', '2025-01-28 23:45:47', 'N/A', ''],
        ['windows.iso', '1 GiB', '2025-01-29 23:45:47', 'my-instance, test', ''],
      ]);
    });

    it('allows ISO to be uploaded', () => {
      const uploadButton = spectator.query(UploadIsoButtonComponent);

      expect(uploadButton).toBeTruthy();
    });

    it('allows volume to be removed', async () => {
      const table = await loader.getHarness(IxTableHarness);
      const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'ubuntu.iso');
      await deleteButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Delete volume' }),
      );
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.volume.delete', ['ubuntu.iso']);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.volume.query');
    });

    it('opens a dialog to add create new volume when Create Volume is pressed', async () => {
      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Volume' }));
      await createButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(NewVolumeDialogComponent, expect.anything());
    });

    it('opens a dialog to import zvols when Import Zvols is pressed', async () => {
      const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import Zvols' }));
      await importButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ImportZvolsDialogComponent, expect.anything());
    });
  });

  describe('selectionMode = true', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: { selectionMode: true },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show delete icon', async () => {
      const table = await loader.getHarness(IxTableHarness);
      const deleteButtons = await table.getAllHarnessesInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'ubuntu.iso');
      expect(deleteButtons).toHaveLength(0);
    });

    it('allows volume to be selected', async () => {
      const table = await loader.getHarness(IxTableHarness);
      const selectButton = await table.getHarnessInRow(MatButtonHarness.with({ text: 'Select' }), 'ubuntu.iso');
      await selectButton.click();

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(volumes[0]);
    });
  });
});
