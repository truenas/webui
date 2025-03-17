import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import {
  DownloadKeyDialogComponent, DownloadKeyDialogParams,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

describe('DownloadKeyDialogComponent', () => {
  let spectator: Spectator<DownloadKeyDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DownloadKeyDialogComponent,
    providers: [
      mockProvider(LoaderService, {
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
            coreDownload: jest.fn(() => of(undefined)),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('downloads an encryption key successfully and enables Done button', async () => {
      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Encryption Key' }));
      await downloadButton.click();

      expect(spectator.inject(DownloadService).coreDownload).toHaveBeenCalledWith({
        arguments: ['my-pool'],
        fileName: 'dataset_my-pool_keys.json',
        method: 'pool.dataset.export_keys',
        mimeType: 'application/json',
      });

      const doneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Done' }));
      expect(await doneButton.isDisabled()).toBe(false);
    });

    it('shows loader when download starts and closes when download completes', async () => {
      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Encryption Key' }));
      await downloadButton.click();

      expect(spectator.inject(LoaderService).open).toHaveBeenCalled();
      expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
    });
  });

  describe('Error Cases', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(DownloadService, {
            coreDownload: jest.fn(() => throwError(() => new Error(''))),
          }),
          mockProvider(ErrorParserService, {
            parseHttpError: jest.fn().mockReturnValue('Parsed HTTP error'),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('displays an error dialog and closes loader on download error and enables Done button', async () => {
      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Encryption Key' }));
      await downloadButton.click();

      expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();

      const doneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Done' }));
      expect(await doneButton.isDisabled()).toBe(false);
    });
  });
});
