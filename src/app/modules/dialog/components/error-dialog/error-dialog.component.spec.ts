import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { ErrorDialog } from 'app/modules/dialog/components/error-dialog/error-dialog.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('ErrorDialog', () => {
  let spectator: Spectator<ErrorDialog>;
  let loader: HarnessLoader;

  const error = {
    title: 'Fatal Error',
    message: 'An error occurred',
    stackTrace: 'main() at line 1',
    logs: {
      id: 1,
    },
  } as ErrorReport;

  const createComponent = createComponentFactory({
    component: ErrorDialog,
    providers: [
      mockApi([
        mockCall('core.job_download_logs', '/logs/logs.log'),
      ]),
      mockProvider(DownloadService, {
        streamDownloadFile: jest.fn(() => of(new Blob())),
        downloadBlob: jest.fn(),
      }),
      mockProvider(MatDialogRef),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              version: 'MASTER-25.10',
            } as SystemInfo,
          },
        ],
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: error,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows error title', () => {
    const title = spectator.query('.err-title');
    expect(title).toHaveText(error.title);
  });

  it('shows error message', () => {
    const message = spectator.query('.err-message-wrapper');
    expect(message).toHaveText(error.message);
  });

  describe('stacktrace', () => {
    it('shows stacktrace when View Stack Trace is clicked', () => {
      const viewLink = spectator.query(byText('View Stack Trace'));
      spectator.click(viewLink);

      const stackTracePanel = spectator.query('.stack-trace-panel');
      expect(stackTracePanel).toHaveClass('open');
      expect(stackTracePanel).toHaveText('Error: main() at line 1');
    });

    it('does not show stacktrace button on non-nightly systems', () => {
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectSystemInfo, {
        version: '25.12',
      } as SystemInfo);
      store$.refreshState();
      spectator.detectChanges();

      const viewLink = spectator.query(byText('View Stack Trace'));
      expect(viewLink).not.toExist();
    });
  });

  describe('logs', () => {
    it('shows button to download logs when logs is available in the error report', async () => {
      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Logs' }));
      await downloadButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.job_download_logs', [1, '1.log']);
      expect(spectator.inject(DownloadService).streamDownloadFile).toHaveBeenCalledWith('/logs/logs.log', '1.log', 'text/plain');
      expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(expect.any(Blob), '1.log');
    });
  });
});
