import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ExportAllKeysDialogComponent } from 'app/pages/datasets/modules/encryption/components/export-all-keys-dialog/export-all-keys-dialog.component';
import { DownloadService } from 'app/services/download.service';

describe('ExportAllKeysDialogComponent', () => {
  let spectator: Spectator<ExportAllKeysDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ExportAllKeysDialogComponent,
    imports: [
    ],
    providers: [
      mockApi([
        mockCall('core.download', [1, 'http://localhost/download']),
        mockJob('pool.dataset.export_key', fakeSuccessfulJob('12345678')),
      ]),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(() => of(undefined)),
      }),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 'pool/my-dataset',
          name: 'my-dataset',
        } as Dataset,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('downloads keys as json file when Download Keys button is pressed', async () => {
    const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Keys' }));
    await downloadButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.download', [
      'pool.dataset.export_keys',
      ['my-dataset'],
      'dataset_my-dataset_keys.json',
    ]);
    expect(spectator.inject(DownloadService).downloadUrl).toHaveBeenCalledWith(
      'http://localhost/download',
      'dataset_my-dataset_keys.json',
      'application/json',
    );
  });
});
