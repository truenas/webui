import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationVolume } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  UploadIsoButtonComponent,
} from 'app/pages/virtualization/components/common/volumes-dialog/upload-iso-button/upload-iso-button.component';
import {
  VolumesDialogComponent,
} from 'app/pages/virtualization/components/common/volumes-dialog/volumes-dialog.component';

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
    },
    {
      id: 'windows.iso',
      name: 'windows.iso',
      content_type: 'ISO',
      created_at: '2025-01-29T15:45:47.527725382-08:00',
      used_by: ['my-instance', 'test'],
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
    ],
  });

  describe('normal operations', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows a list of existing volumes', async () => {
      const table = await loader.getHarness(IxTableHarness);

      expect(await table.getCellTexts()).toEqual([
        ['Name', 'Created At', 'Used By', ''],
        ['ubuntu.iso', '2025-01-28 23:45:47', 'N/A', ''],
        ['windows.iso', '2025-01-29 23:45:47', 'my-instance, test', ''],
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
  });

  describe('allowSelection = true', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: { allowSelection: true },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('allows volume to be selected when `allowSelection` option is true', async () => {
      const table = await loader.getHarness(IxTableHarness);
      const selectButton = await table.getHarnessInRow(MatButtonHarness.with({ text: 'Select' }), 'ubuntu.iso');
      await selectButton.click();

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(volumes[0]);
    });
  });
});
