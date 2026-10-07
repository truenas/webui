import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { DownloadService } from 'app/services/download.service';
import { ExportDatasetKeyDialog } from './export-dataset-key-dialog.component';

describe('ExportDatasetKeyDialogComponent', () => {
  let spectator: Spectator<ExportDatasetKeyDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ExportDatasetKeyDialog,
    providers: [
      mockTypedApi([
        mockTypedJob('pool.dataset.export_key', { state: JobState.Success, result: '12345678' }),
      ]),
      mockProvider(DownloadService, {
        coreDownload: jest.fn(() => of(undefined)),
      }),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
        useValue: {
          id: 'pool/my-dataset',
          name: 'my-dataset',
        } as Dataset,
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  });

  it('loads and shows dataset encryption key', () => {
    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('pool.dataset.export_key', ['pool/my-dataset']);
    const key = spectator.query('.key');
    expect(key).toHaveText('12345678');
  });

  it('downloads key as json file when Download Key button is pressed', async () => {
    const downloadButton = await loader.getHarness(TnButtonHarness.with({ label: 'Download Key' }));
    await downloadButton.click();

    expect(spectator.inject(DownloadService).coreDownload).toHaveBeenCalledWith({
      arguments: ['pool/my-dataset', true],
      fileName: 'dataset_my-dataset_key.json',
      method: 'pool.dataset.export_key',
      mimeType: 'application/json',
    });
  });

  it('auto closes dialog if there was an error loading the key', () => {
    const mockedApi = spectator.inject(MockTypedApiService);
    jest.spyOn(mockedApi, 'job').mockReturnValue(throwError(() => new Error('Failed to load key')));

    spectator.component.ngOnInit();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });
});
