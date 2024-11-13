import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/services/api.service';
import { DownloadService } from 'app/services/download.service';
import { ExportDatasetKeyDialogComponent } from './export-dataset-key-dialog.component';

describe('ExportDatasetKeyDialogComponent', () => {
  let spectator: Spectator<ExportDatasetKeyDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ExportDatasetKeyDialogComponent,
    imports: [
    ],
    providers: [
      mockWebSocket([
        mockCall('core.download', [1, 'http://localhost/download']),
        mockJob('pool.dataset.export_key', fakeSuccessfulJob('12345678')),
      ]),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(() => of(undefined)),
      }),
      mockProvider(MatDialogRef),
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

  it('loads and shows dataset encryption key', () => {
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.dataset.export_key', ['pool/my-dataset']);
    const key = spectator.query('.key');
    expect(key).toHaveText('12345678');
  });

  it('downloads key as json file when Download Key button is pressed', async () => {
    const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Key' }));
    await downloadButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.download', [
      'pool.dataset.export_key',
      ['pool/my-dataset', true],
      'dataset_my-dataset_key.json',
    ]);
    expect(spectator.inject(DownloadService).downloadUrl).toHaveBeenCalledWith(
      'http://localhost/download',
      'dataset_my-dataset_key.json',
      'application/json',
    );
  });
});
