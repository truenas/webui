import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ControllerType } from 'app/enums/controller-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { Job } from 'app/interfaces/job.interface';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

describe('ExportButtonComponent', () => {
  const jobMethod: ApiJobMethod = 'audit.export';
  type EntryType = AuditEntry;

  let spectator: Spectator<ExportButtonComponent<EntryType, typeof jobMethod>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExportButtonComponent<EntryType, typeof jobMethod>,
    providers: [
      mockApi([
        mockJob(jobMethod, { result: '/path/data.csv', state: JobState.Success } as Job<string>),
        mockCall('core.download', [33456, '/_download/33456?auth_token=1234567890']),
      ]),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
        ],
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

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(jobMethod, [{
      export_format: 'CSV',
      'query-filters': [],
      'query-options': {},
    }]);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.download', [jobMethod, [{}], '/path/data.csv']);
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
    spectator.setInput('controllerType', ControllerType.Standby);
    spectator.detectChanges();

    const exportButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export As CSV' }));
    await exportButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(jobMethod, [{
      export_format: 'CSV',
      'query-filters': [['event', '~', '(?i)search query']],
      'query-options': { order_by: ['-service'] },
      remote_controller: true,
    }]);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.download', [jobMethod, [{}], '/path/data.csv']);
    expect(spectator.inject(DownloadService).downloadUrl).toHaveBeenLastCalledWith(
      '/_download/33456?auth_token=1234567890',
      'data.csv',
      'text/csv',
    );
  });
});
