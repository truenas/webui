import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ShowLogsDialogComponent } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { WebSocketService } from 'app/services/api.service';
import { DownloadService } from 'app/services/download.service';

describe('ShowLogsDialogComponent', () => {
  let spectator: Spectator<ShowLogsDialogComponent>;
  const createComponent = createComponentFactory({
    component: ShowLogsDialogComponent,
    declarations: [
      MockComponent(CopyButtonComponent),
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: { id: 123456, logs_excerpt: 'completed' } as Job,
      },
      mockProvider(MatDialogRef),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(),
      }),
      mockWebSocket([
        mockCall('core.job_download_logs', 'http://localhost/download/log'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows logs excerpt', () => {
    expect(spectator.query('.logs')).toHaveText('completed');
  });

  it('downloads logs when Download Logs is pressed', async () => {
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Download Logs' }));
    await button.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.job_download_logs', [123456, '123456.log']);
    expect(spectator.inject(DownloadService).downloadUrl).toHaveBeenLastCalledWith(
      'http://localhost/download/log',
      '123456.log',
      'text/plain',
    );
  });
});
