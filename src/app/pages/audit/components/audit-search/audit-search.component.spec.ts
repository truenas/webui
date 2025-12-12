import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { AuditService } from 'app/enums/audit.enum';
import { ExportFormat } from 'app/enums/export-format.enum';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { mockAuditApiDataProvider } from 'app/pages/audit/testing/mock-audit-api-data-provider';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { UrlOptionsService } from 'app/services/url-options.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

describe('AuditSearchComponent', () => {
  let spectator: Spectator<AuditSearchComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AuditSearchComponent,
    declarations: [
      MockComponents(
        FakeProgressBarComponent,
      ),
    ],
    providers: [
      mockApi([
        mockCall('user.query', []),
      ]),
      mockProvider(UrlOptionsService, {
        setUrlOptions: jest.fn(),
        parseUrlOptions: jest.fn(() => ({})),
      }),
      mockProvider(ActivatedRoute, {
        params: of({}),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: false,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataProvider: {
          ...mockAuditApiDataProvider,
          totalRows: 2,
          isLoading$: of(false),
          sortingOrPaginationUpdate: of(true),
        } as unknown as AuditApiDataProvider,
        isMobileView: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('component initialization', () => {
    it('should initialize with CSV as default export format', () => {
      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.displayFormat()).toBe('CSV');
    });

    it('should display export controls when data is available', () => {
      expect(spectator.query('.export-container')).toExist();
      expect(spectator.query(ExportButtonComponent)).toExist();
    });

    it('should not display export controls when no data is available', () => {
      spectator.setInput('dataProvider', {
        ...mockAuditApiDataProvider,
        totalRows: 0,
        isLoading$: of(false),
        sortingOrPaginationUpdate: of(true),
      } as unknown as AuditApiDataProvider);
      spectator.setInput('isMobileView', false);
      spectator.detectChanges();

      expect(spectator.query('.export-container')).not.toExist();
      expect(spectator.query(ExportButtonComponent)).not.toExist();
    });

    it('should call user.query on init', () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.query');
    });
  });

  describe('format selector', () => {
    it('should display current format in export button', () => {
      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.displayFormat()).toBe('CSV');
    });

    it('should change format in export button when format is changed', () => {
      spectator.component.onFormatChange(ExportFormat.Json);
      spectator.detectChanges();

      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.displayFormat()).toBe('JSON');
    });

    it('should open format menu when dropdown button is clicked', async () => {
      const menuTrigger = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="export-format-selector"]' }));
      await menuTrigger.click();

      const menu = await loader.getHarness(MatMenuHarness);
      expect(await menu.isOpen()).toBe(true);
    });

    it('should have all three format options in menu', async () => {
      const menuTrigger = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="export-format-selector"]' }));
      await menuTrigger.click();

      const menu = await loader.getHarness(MatMenuHarness);
      const items = await menu.getItems();

      expect(items).toHaveLength(3);
      expect(await items[0].getText()).toBe('CSV');
      expect(await items[1].getText()).toBe('JSON');
      expect(await items[2].getText()).toBe('YAML');
    });

    it('should change format to JSON when JSON menu item is clicked', async () => {
      const menuTrigger = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="export-format-selector"]' }));
      await menuTrigger.click();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.clickItem({ text: 'JSON' });

      spectator.detectChanges();
      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.displayFormat()).toBe('JSON');
    });

    it('should change format to YAML when YAML menu item is clicked', async () => {
      const menuTrigger = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="export-format-selector"]' }));
      await menuTrigger.click();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.clickItem({ text: 'YAML' });

      spectator.detectChanges();
      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.displayFormat()).toBe('YAML');
    });

    it('should mark CSV as selected by default', async () => {
      const menuTrigger = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="export-format-selector"]' }));
      await menuTrigger.click();

      spectator.detectChanges();
      const selectedItems = spectator.queryAll('.mat-mdc-menu-item.selected');
      expect(selectedItems).toHaveLength(1);
      expect(selectedItems[0]).toHaveText('CSV');
    });

    it('should update selected class when format changes', async () => {
      spectator.component.onFormatChange(ExportFormat.Json);
      spectator.detectChanges();

      const menuTrigger = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="export-format-selector"]' }));
      await menuTrigger.click();

      spectator.detectChanges();
      const selectedItems = spectator.queryAll('.mat-mdc-menu-item.selected');
      expect(selectedItems).toHaveLength(1);
      expect(selectedItems[0]).toHaveText('JSON');
    });
  });

  describe('computed properties', () => {
    it('should compute exportFilename based on selected format', () => {
      let exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.filename()).toBe('audit_report.csv');

      spectator.component.onFormatChange(ExportFormat.Json);
      spectator.detectChanges();
      exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.filename()).toBe('audit_report.json');

      spectator.component.onFormatChange(ExportFormat.Yaml);
      spectator.detectChanges();
      exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.filename()).toBe('audit_report.yaml');
    });

    it('should always return tgz for exportFileType', () => {
      let exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.fileType()).toBe('tgz');

      spectator.component.onFormatChange(ExportFormat.Json);
      spectator.detectChanges();
      exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.fileType()).toBe('tgz');
    });

    it('should compute exportFormatDisplayLabel as uppercase format', () => {
      let exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.displayFormat()).toBe('CSV');

      spectator.component.onFormatChange(ExportFormat.Json);
      spectator.detectChanges();
      exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.displayFormat()).toBe('JSON');

      spectator.component.onFormatChange(ExportFormat.Yaml);
      spectator.detectChanges();
      exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.displayFormat()).toBe('YAML');
    });

    it('should have correct exportMimeType', () => {
      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.fileMimeType()).toBe('application/gzip');
    });
  });

  describe('export button integration', () => {
    it('should pass correct inputs to ExportButtonComponent', () => {
      const exportButton = spectator.query(ExportButtonComponent);

      expect(exportButton.jobMethod()).toBe('audit.export');
      expect(exportButton.downloadMethod()).toBe('audit.download_report');
      expect(exportButton.addReportNameArgument()).toBe(true);
      expect(exportButton.exportFormat()).toBe(ExportFormat.Csv);
      expect(exportButton.filename()).toBe('audit_report.csv');
      expect(exportButton.fileType()).toBe('tgz');
      expect(exportButton.fileMimeType()).toBe('application/gzip');
    });

    it('should update ExportButtonComponent inputs when format changes', () => {
      spectator.component.onFormatChange(ExportFormat.Json);
      spectator.detectChanges();

      const exportButton = spectator.query(ExportButtonComponent);

      expect(exportButton.exportFormat()).toBe(ExportFormat.Json);
      expect(exportButton.filename()).toBe('audit_report.json');
      expect(exportButton.ariaLabel()).toContain('JSON');
    });

    it('should pass searchQuery to ExportButtonComponent', () => {
      const searchInput = spectator.query(SearchInputComponent);
      searchInput.query.set({
        query: 'test search',
        isBasicQuery: true,
      });
      searchInput.runSearch.emit();
      spectator.detectChanges();

      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.searchQuery()).toEqual({
        query: 'test search',
        isBasicQuery: true,
      });
    });

    it('should pass sorting from dataProvider to ExportButtonComponent', () => {
      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.sorting()).toEqual(mockAuditApiDataProvider.sorting);
    });

    it('should pass basicQueryFilters to ExportButtonComponent', () => {
      const searchInput = spectator.query(SearchInputComponent);
      searchInput.query.set({
        query: 'authentication',
        isBasicQuery: true,
      });
      searchInput.runSearch.emit();
      spectator.detectChanges();

      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.defaultFilters()).toEqual([
        ['OR', [['event', '~', '(?i)authentication'], ['username', '~', '(?i)authentication']]],
      ]);
    });

    it('should pass selected service to ExportButtonComponent via customExportParams', () => {
      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.customExportParams()).toEqual({ services: [AuditService.Middleware] });
    });

    it('should update customExportParams when service selection changes', async () => {
      const serviceSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Service' }));
      await serviceSelect.setValue('SMB');

      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.customExportParams()).toEqual({ services: [AuditService.Smb] });
    });
  });

  describe('search functionality', () => {
    it('should update basicQueryFilters based on search query', () => {
      const searchInput = spectator.query(SearchInputComponent);
      searchInput.query.set({
        query: 'test',
        isBasicQuery: true,
      });
      searchInput.runSearch.emit();
      spectator.detectChanges();

      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.defaultFilters()).toEqual([
        ['OR', [['event', '~', '(?i)test'], ['username', '~', '(?i)test']]],
      ]);
    });

    it('should handle empty search query', () => {
      const searchInput = spectator.query(SearchInputComponent);
      searchInput.query.set({
        query: '',
        isBasicQuery: true,
      });
      searchInput.runSearch.emit();
      spectator.detectChanges();

      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.defaultFilters()).toEqual([]);
    });

    it('should call dataProvider load on search', () => {
      const searchInput = spectator.query(SearchInputComponent);
      searchInput.query.set({
        query: 'test',
        isBasicQuery: true,
      });

      searchInput.runSearch.emit();

      expect(mockAuditApiDataProvider.load).toHaveBeenCalled();
    });

    it('should update URL options on search', () => {
      const urlOptionsService = spectator.inject(UrlOptionsService);
      const searchInput = spectator.query(SearchInputComponent);

      searchInput.query.set({
        query: 'test',
        isBasicQuery: true,
      });
      searchInput.runSearch.emit();

      spectator.component.updateUrlOptions();

      expect(urlOptionsService.setUrlOptions).toHaveBeenCalledWith(
        '/system/audit',
        expect.objectContaining({
          sorting: mockAuditApiDataProvider.sorting,
          pagination: mockAuditApiDataProvider.pagination,
        }),
      );
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on format selector button', () => {
      const button = spectator.query('[ixTest="export-format-selector"]');
      expect(button.getAttribute('aria-label')).toBe('Select Export Format');
    });

    it('should pass dynamic aria-label to ExportButtonComponent', () => {
      const exportButton = spectator.query(ExportButtonComponent);
      expect(exportButton.ariaLabel()).toContain('CSV');

      spectator.component.onFormatChange(ExportFormat.Json);
      spectator.detectChanges();

      expect(exportButton.ariaLabel()).toContain('JSON');
    });
  });
});
