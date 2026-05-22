import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonToggleHarness,
  TnSelectHarness,
} from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { AuditService } from 'app/enums/audit.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditComponent } from 'app/pages/audit/audit.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { auditEntries } from 'app/pages/audit/testing/mock-audit-api-data-provider';
import { UrlOptionsService } from 'app/services/url-options.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('AuditComponent', () => {
  let spectator: Spectator<AuditComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: AuditComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponents(
        LogDetailsPanelComponent,
        ExportButtonComponent,
        FakeProgressBarComponent,
        PageHeaderComponent,
        MockMasterDetailViewComponent,
      ),
    ],
    componentMocks: [SearchInputComponent],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
      mockProvider(ActivatedRoute, {
        params: of({ options: '' }),
      }),
      mockProvider(UrlOptionsService, {
        parseUrlOptions: () => ({}),
        setUrlOptions: jest.fn(),
      }),
      mockApi([
        mockCall('audit.query', (params) => {
          if (params[0]['query-options']!.count) {
            // TODO: Not correct. Figure out how to solve this for query endpoints.
            return 2 as unknown as AuditEntry[];
          }

          return auditEntries;
        }),
        mockCall('user.query', []),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            selector: selectAdvancedConfig,
            value: {
              consolemenu: true,
              serialconsole: true,
              serialport: 'ttyS0',
              serialspeed: '9600',
              motd: 'Welcome back, commander',
            } as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks used components on page', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
    expect(spectator.query(ExportButtonComponent)).toExist();
    expect(spectator.query(FakeProgressBarComponent)).toExist();
  });

  it('makes only 2 API calls during initialization (count + data)', () => {
    const auditQueryCalls = (api.call as jest.Mock).mock.calls.filter(
      (call) => call[0] === 'audit.query',
    );

    // Should have exactly 2 calls (1 for count, 1 for data) - not duplicated
    expect(auditQueryCalls).toHaveLength(2);

    const countCall = auditQueryCalls.find((call) => call[1][0]['query-options']?.count);
    const dataCall = auditQueryCalls.find((call) => !call[1][0]['query-options']?.count);

    expect(countCall).toBeDefined();
    expect(dataCall).toBeDefined();
  });

  it('prevents duplicate API calls when controller type changes', async () => {
    jest.clearAllMocks();

    const standbyToggle = await loader.getHarness(TnButtonToggleHarness.with({ label: 'Standby' }));
    await standbyToggle.check();

    const auditQueryCalls = (api.call as jest.Mock).mock.calls.filter(
      (call) => call[0] === 'audit.query',
    );

    // Should have exactly 2 calls (1 for count, 1 for data) - not duplicated
    expect(auditQueryCalls).toHaveLength(2);

    const dataCall = auditQueryCalls.find((call) => !call[1][0]['query-options']?.count);
    expect(dataCall?.[1][0]).toHaveProperty('remote_controller', true);
  });

  describe('search', () => {
    it('sends empty filters when basic search has no query', () => {
      const search = spectator.query(SearchInputComponent)!;
      search.query.set({
        isBasicQuery: true,
        query: '',
      });

      search.runSearch.emit();

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          services: ['MIDDLEWARE'],
          remote_controller: false,
        }],
      );
    });

    it('searches by username when basic search term does not match any event', () => {
      const search = spectator.query(SearchInputComponent)!;
      search.query.set({
        isBasicQuery: true,
        query: 'search',
      });

      search.runSearch.emit();

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [['username', '~', 'search']],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          services: ['MIDDLEWARE'],
          remote_controller: false,
        }],
      );
    });

    it('runs search when controller type is changed', async () => {
      const standbyToggle = await loader.getHarness(TnButtonToggleHarness.with({ label: 'Standby' }));
      await standbyToggle.check();

      spectator.detectChanges();

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          services: ['MIDDLEWARE'],
          remote_controller: true,
        }],
      );
    });

    it('applies filters to API query when advanced search is used', () => {
      const search = spectator.query<SearchInputComponent<AuditEntry>>(SearchInputComponent)!;
      search.query.set({
        isBasicQuery: false,
        filters: [
          ['event', '=', 'Authentication'],
          ['username', '~', 'bob'],
        ],
      });
      search.runSearch.emit();

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [['event', '=', 'Authentication'], ['username', '~', 'bob']],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          services: ['MIDDLEWARE'],
          remote_controller: false,
        }],
      );
    });

    it('filters by selected service', async () => {
      jest.clearAllMocks();

      const serviceSelect = await loader.getHarness(TnSelectHarness);
      await serviceSelect.selectOption('SMB');

      spectator.detectChanges();

      const auditQueryCalls = (api.call as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'audit.query',
      );

      // Should have exactly 2 calls (1 for count, 1 for data) - not duplicated
      expect(auditQueryCalls).toHaveLength(2);

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          services: ['SMB'],
          remote_controller: false,
        }],
      );
    });

    it('persists service selection in URL when changed', async () => {
      const urlOptionsService = spectator.inject(UrlOptionsService);
      const setUrlOptionsSpy = jest.spyOn(urlOptionsService, 'setUrlOptions');

      jest.clearAllMocks();

      const serviceSelect = await loader.getHarness(TnSelectHarness);
      await serviceSelect.selectOption('SMB');

      spectator.detectChanges();

      expect(setUrlOptionsSpy).toHaveBeenCalledWith(
        '/system/audit',
        expect.objectContaining({
          service: AuditService.Smb,
        }),
      );
    });

    it('escapes special characters in basic search', () => {
      const search = spectator.query(SearchInputComponent)!;
      search.query.set({
        isBasicQuery: true,
        query: 'test-query',
      });

      search.runSearch.emit();

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [['username', '~', 'test\\-query']],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          services: ['MIDDLEWARE'],
          remote_controller: false,
        }],
      );
    });

    it('searches by event only when basic search term matches an event', () => {
      const search = spectator.query(SearchInputComponent)!;
      search.query.set({
        isBasicQuery: true,
        query: 'method',
      });

      search.runSearch.emit();

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [['event', '~', 'METHOD_CALL']],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          services: ['MIDDLEWARE'],
          remote_controller: false,
        }],
      );
    });
  });

  describe('details panel', () => {
    it('checks card title', () => {
      spectator.detectChanges();
      const title = spectator.query('h3');
      expect(title).toHaveText('Log Details');
    });

    it('shows details for the selected audit entry', () => {
      spectator.detectChanges();
      const cells = spectator.queryAll<HTMLElement>('.clickable-cell');
      // 5 columns × 2 rows = 10 cells; second row starts at index 5.
      cells[5].click();
      spectator.detectChanges();

      const details = spectator.query(LogDetailsPanelComponent)!;
      expect(details.log).toEqual(auditEntries[1]);
    });
  });
});
