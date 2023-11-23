import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { AuditEntry } from 'app/interfaces/audit.interface';
import { Job } from 'app/interfaces/job.interface';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { ExportButtonComponent } from 'app/pages/audit/components/export-button/export-button.component';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';


describe('ExportButtonComponent', () => {
  const method: ApiJobMethod = 'audit.export';
  type EntryType = AuditEntry;

  let spectator: Spectator<ExportButtonComponent<EntryType, typeof method>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExportButtonComponent<EntryType, typeof method>,
    providers: [
      mockWebsocket([
        mockJob(method, { result: '/path/data.csv', state: JobState.Success } as Job<string>),
      ]),
      mockProvider(StorageService, {
        downloadUrl: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { method },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('downloads a file when Export As CSV button is pressed without options', async () => {
    const exportButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export As CSV' }));
    await exportButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(method, [{
      export_format: 'CSV',
      'query-filters': [],
      'query-options': {},
    }]);
    expect(spectator.inject(StorageService).downloadUrl).toHaveBeenLastCalledWith(
      '/path/data.csv',
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

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(method, [{
      export_format: 'CSV',
      'query-filters': [['event', '~', 'search query']],
      'query-options': { order_by: ['-service'] },
    }]);
    expect(spectator.inject(StorageService).downloadUrl).toHaveBeenLastCalledWith(
      '/path/data.csv',
      'data.csv',
      'text/csv',
    );
  });
});
