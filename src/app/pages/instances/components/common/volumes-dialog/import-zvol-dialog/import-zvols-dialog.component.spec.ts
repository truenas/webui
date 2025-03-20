import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ImportZvolsDialogComponent,
} from 'app/pages/instances/components/common/volumes-dialog/import-zvol-dialog/import-zvols-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('ImportZvolsDialogComponent', () => {
  let spectator: Spectator<ImportZvolsDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ImportZvolsDialogComponent,
    providers: [
      mockApi([
        mockJob('virt.volume.import_zvol', fakeSuccessfulJob()),
      ]),
      mockProvider(SnackbarService),
      mockProvider(MatDialogRef),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => {
          return of([]);
        }),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('imports selected zvols when they are selected in the dialog', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Select Zvols': ['/dev/zvol/tank/zvol1', '/dev/zvol/tank/zvol1'],
    });

    const moveOrClone = await loader.getHarness(IxRadioGroupHarness);
    await moveOrClone.setValue('Clone');

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.volume.import_zvol', [{
      to_import: [
        {
          virt_volume_name: 'zvol1',
          zvol_path: '/dev/zvol/tank/zvol1',
        },
        {
          virt_volume_name: 'zvol1',
          zvol_path: '/dev/zvol/tank/zvol1',
        },
      ],
      clone: true,
    }]);

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
  });
});
