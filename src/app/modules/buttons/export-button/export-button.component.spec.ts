import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ControllerType } from 'app/enums/controller-type.enum';
import { ExportFormat } from 'app/enums/export-format.enum';
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
      ]),
      mockProvider(DownloadService, {
        coreDownload: jest.fn(() => of(undefined)),
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
    expect(spectator.inject(DownloadService).coreDownload).toHaveBeenLastCalledWith({
      arguments: [{}],
      fileName: 'data.csv',
      method: 'audit.export',
      mimeType: 'text/csv',
    });
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
    expect(spectator.inject(DownloadService).coreDownload).toHaveBeenLastCalledWith({
      arguments: [{}],
      fileName: 'data.csv',
      method: 'audit.export',
      mimeType: 'text/csv',
    });
  });

  it('should use custom displayFormat when provided', async () => {
    spectator.setInput('displayFormat', 'JSON');
    spectator.setInput('fileType', 'tgz');
    spectator.detectChanges();

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Export As JSON' }));
    expect(await button.getText()).toContain('JSON');
  });

  it('should use fileType in button text when displayFormat is not provided', async () => {
    spectator.setInput('fileType', 'json');
    spectator.detectChanges();

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Export As JSON' }));
    expect(await button.getText()).toContain('JSON');
  });

  it('should use exportFormat input for job params', async () => {
    spectator.setInput('exportFormat', ExportFormat.Json);
    spectator.setInput('displayFormat', 'JSON');
    spectator.setInput('fileType', 'tgz');
    spectator.detectChanges();

    const exportButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export As JSON' }));
    await exportButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(jobMethod, [{
      export_format: 'JSON',
      'query-filters': [],
      'query-options': {},
    }]);
  });

  it('should use YAML export format when specified', async () => {
    spectator.setInput('exportFormat', ExportFormat.Yaml);
    spectator.setInput('displayFormat', 'YAML');
    spectator.setInput('fileType', 'tgz');
    spectator.detectChanges();

    const exportButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export As YAML' }));
    await exportButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(jobMethod, [{
      export_format: 'YAML',
      'query-filters': [],
      'query-options': {},
    }]);
  });

  it('should apply custom aria-label when provided', () => {
    spectator.setInput('ariaLabel', 'Export audit logs as JSON');
    spectator.detectChanges();

    const button = spectator.query('button');
    expect(button.getAttribute('aria-label')).toBe('Export audit logs as JSON');
  });

  it('should use default aria-label when not provided', () => {
    const button = spectator.query('button');
    expect(button.getAttribute('aria-label')).toBe('Export');
  });

  it('should include customExportParams in the job call', async () => {
    spectator.setInput('customExportParams', { services: ['MIDDLEWARE'] });
    spectator.detectChanges();

    const exportButton = await loader.getHarness(MatButtonHarness.with({ text: 'Export As CSV' }));
    await exportButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(jobMethod, [{
      export_format: 'CSV',
      'query-filters': [],
      'query-options': {},
      services: ['MIDDLEWARE'],
    }]);
  });
});
