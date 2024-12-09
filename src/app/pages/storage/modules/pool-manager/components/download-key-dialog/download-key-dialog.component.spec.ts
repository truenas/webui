import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  DownloadKeyDialogComponent, DownloadKeyDialogParams,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('DownloadKeyDialogComponent', () => {
  let spectator: Spectator<DownloadKeyDialogComponent>;
  let loader: HarnessLoader;
  const fakeBlob = {};

  const createComponent = createComponentFactory({
    component: DownloadKeyDialogComponent,
    imports: [
    ],
    providers: [
      mockApi([
        mockCall('core.download', [null, 'http://localhost:8000/key.json']),
      ]),
      mockProvider(AppLoaderService, {
        open: jest.fn(),
        close: jest.fn(),
      }),
      mockProvider(DialogService, {
        error: jest.fn(),
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

  describe('Success Cases', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(DownloadService, {
            streamDownloadFile: jest.fn(() => of(fakeBlob)),
            downloadBlob: jest.fn(),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('downloads an encryption key successfully and enables Done button', async () => {
      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Encryption Key' }));
      await downloadButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.download', ['pool.dataset.export_keys', ['my-pool'], 'dataset_my-pool_keys.json']);
      expect(spectator.inject(DownloadService).streamDownloadFile).toHaveBeenCalledWith('http://localhost:8000/key.json', 'dataset_my-pool_keys.json', 'application/json');
      expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(fakeBlob, 'dataset_my-pool_keys.json');

      const doneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Done' }));
      expect(await doneButton.isDisabled()).toBe(false);
    });

    it('shows loader when download starts and closes when download completes', async () => {
      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Encryption Key' }));
      await downloadButton.click();

      expect(spectator.inject(AppLoaderService).open).toHaveBeenCalled();
      expect(spectator.inject(AppLoaderService).close).toHaveBeenCalled();
    });
  });

  describe('Error Cases', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(DownloadService, {
            streamDownloadFile: jest.fn(() => throwError(() => new Error(''))),
            downloadBlob: jest.fn(),
          }),
          mockProvider(ErrorHandlerService, {
            parseHttpError: jest.fn().mockReturnValue('Parsed HTTP error'),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('displays an error dialog and closes loader on download error and enables Done button', async () => {
      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Encryption Key' }));
      await downloadButton.click();

      expect(spectator.inject(AppLoaderService).close).toHaveBeenCalled();
      expect(spectator.inject(ErrorHandlerService).parseError).toHaveBeenCalled();

      const doneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Done' }));
      expect(await doneButton.isDisabled()).toBe(false);
    });
  });
});
