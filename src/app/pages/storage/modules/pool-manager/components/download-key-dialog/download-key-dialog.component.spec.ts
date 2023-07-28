import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  DownloadKeyDialogComponent, DownloadKeyDialogParams,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DownloadKeyDialogComponent', () => {
  let spectator: Spectator<DownloadKeyDialogComponent>;
  let loader: HarnessLoader;
  const fakeBlob = {};
  const createComponent = createComponentFactory({
    component: DownloadKeyDialogComponent,
    imports: [
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('core.download', [null, 'http://localhost:8000/key.json']),
      ]),
      mockProvider(StorageService, {
        streamDownloadFile: jest.fn(() => of(fakeBlob)),
        downloadBlob: jest.fn(),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 1,
          name: 'my-pool',
        } as DownloadKeyDialogParams,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('downloads an encryption key when Download Encryption Key button is pressed', async () => {
    const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Encryption Key' }));
    await downloadButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.download', ['pool.dataset.export_keys', ['my-pool'], 'dataset_my-pool_keys.json']);
    expect(spectator.inject(StorageService).streamDownloadFile).toHaveBeenCalledWith('http://localhost:8000/key.json', 'dataset_my-pool_keys.json', 'application/json');
    expect(spectator.inject(StorageService).downloadBlob).toHaveBeenCalledWith(fakeBlob, 'dataset_my-pool_keys.json');
  });

  it('disables Done button until key has been downloaded', async () => {
    const doneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Done' }));
    expect(await doneButton.isDisabled()).toBe(true);

    const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Encryption Key' }));
    await downloadButton.click();

    expect(await doneButton.isDisabled()).toBe(false);
  });
});
