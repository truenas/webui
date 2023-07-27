import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { ExportAllKeysDialogComponent } from 'app/pages/datasets/modules/encryption/components/export-all-keys-dialog/export-all-keys-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ExportAllKeysDialogComponent', () => {
  let spectator: Spectator<ExportAllKeysDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ExportAllKeysDialogComponent,
    imports: [
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('core.download', [1, 'http://localhost/download']),
        mockJob('pool.dataset.export_key', fakeSuccessfulJob('12345678')),
      ]),
      mockProvider(StorageService, {
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

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.download', [
      'pool.dataset.export_keys',
      ['my-dataset'],
      'dataset_my-dataset_keys.json',
    ]);
    expect(spectator.inject(StorageService).downloadUrl).toHaveBeenCalledWith(
      'http://localhost/download',
      'dataset_my-dataset_keys.json',
      'application/json',
    );
  });
});
