import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ShowLogsDialog } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';

describe('ShowLogsDialogComponent', () => {
  let spectator: Spectator<ShowLogsDialog>;
  const createComponent = createComponentFactory({
    component: ShowLogsDialog,
    declarations: [
      MockComponent(CopyButtonComponent),
    ],
    providers: [
      {
        provide: DIALOG_DATA,
        useValue: { id: 123456, logs_excerpt: 'completed' } as Job,
      },
      mockProvider(DialogRef),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(),
      }),
      mockApi([
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
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Download Logs' }));
    await button.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.job_download_logs', [123456, '123456.log']);
    expect(spectator.inject(DownloadService).downloadUrl).toHaveBeenLastCalledWith(
      'http://localhost/download/log',
      '123456.log',
      'text/plain',
    );
  });
});
