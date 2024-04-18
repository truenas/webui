import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { Job } from 'app/interfaces/job.interface';
import { ExportButtonComponent } from 'app/modules/export-button/components/export-button/export-button.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { DownloadService } from 'app/services/download.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ExportButtonComponent', () => {
  const jobMethod: ApiJobMethod = 'audit.export';
  type EntryType = AuditEntry;

  let spectator: Spectator<ExportButtonComponent<EntryType, typeof jobMethod>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExportButtonComponent<EntryType, typeof jobMethod>,
    providers: [
      mockWebSocket([
        mockJob(jobMethod, { result: '/path/data.csv', state: JobState.Success } as Job<string>),
        mockCall('core.download', [33456, '/_download/33456?auth_token=1234567890']),
      ]),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        jobMethod,
        defaultFilters: [['event', '~', '(?i)search query']],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('downloads a file when Export As CSV button is pressed without options', async () => {
    const exportButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export As CSV' }));
    await exportButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(jobMethod, [{
      export_format: 'CSV',
      'query-filters': [],
      'query-options': {},
    }]);
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.download', [jobMethod, [{}], '/path/data.csv']);
    expect(spectator.inject(DownloadService).downloadUrl).toHaveBeenLastCalledWith(
      '/_download/33456?auth_token=1234567890',
      'data.csv',
      'text/csv',
    );
  });

  it('downloads a file when Export As CSV button is pressed with options', async () => {
    spectator.setInput('sorting', {
      active: 0,
      propertyName: 'service',
      direction: SortDirection.Desc,
    });
    spectator.setInput('searchQuery', {
      isBasicQuery: true,
      query: 'search query',
    });
    spectator.detectChanges();

    const exportButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export As CSV' }));
    await exportButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(jobMethod, [{
      export_format: 'CSV',
      'query-filters': [['event', '~', '(?i)search query']],
      'query-options': { order_by: ['-service'] },
    }]);
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.download', [jobMethod, [{}], '/path/data.csv']);
    expect(spectator.inject(DownloadService).downloadUrl).toHaveBeenLastCalledWith(
      '/_download/33456?auth_token=1234567890',
      'data.csv',
      'text/csv',
    );
  });
});
