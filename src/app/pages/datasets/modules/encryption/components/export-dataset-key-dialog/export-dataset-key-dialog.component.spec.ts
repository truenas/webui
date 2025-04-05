import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ExportDatasetKeyDialog } from './export-dataset-key-dialog.component';

describe('ExportDatasetKeyDialogComponent', () => {
  let spectator: Spectator<ExportDatasetKeyDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ExportDatasetKeyDialog,
    providers: [
      mockApi([
        mockJob('pool.dataset.export_key', fakeSuccessfulJob('12345678')),
      ]),
      mockProvider(DownloadService, {
        coreDownload: jest.fn(() => of(undefined)),
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

    expect(spectator.inject(DownloadService).coreDownload).toHaveBeenCalledWith({
      arguments: ['pool/my-dataset', true],
      fileName: 'dataset_my-dataset_key.json',
      method: 'pool.dataset.export_key',
      mimeType: 'application/json',
    });
  });

  it('auto closes dialog if there was an error loading the key', () => {
    const mockedApi = spectator.inject(MockApiService);
    jest.spyOn(mockedApi, 'job').mockReturnValue(throwError(() => new Error('Failed to load key')));

    spectator.component.ngOnInit();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
