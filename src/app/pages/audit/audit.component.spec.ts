import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { CallParams, CallResponse } from '@truenas/api-client';
import {
  TnButtonComponent,
  TnButtonToggleComponent,
  TnButtonToggleGroupComponent,
  TnButtonToggleHarness,
  TnSelectHarness,
  TnTableHarness,
} from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
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
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { AuditComponent } from 'app/pages/audit/audit.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { auditEntries } from 'app/pages/audit/testing/mock-audit-api-data-provider';
import { UrlOptionsService } from 'app/services/url-options.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

type AuditQueryParams = NonNullable<CallParams<WebUiApiDirectory, 'audit.query'>[0]>;

// The UI reads entries as `AuditEntry`, discriminated on service and event; middleware's entry is open.
const auditEntryRows = auditEntries as unknown as CallResponse<WebUiApiDirectory, 'audit.query'>;

describe('AuditComponent', () => {
  let spectator: Spectator<AuditComponent>;
  let loader: HarnessLoader;
  let api: MockTypedApiService;

  function getAuditQueryParams(): AuditQueryParams[] {
    return api.call.mock.calls
      .filter(([method]) => method === 'audit.query')
      .map(([, params]) => (params as [AuditQueryParams])[0]);
  }

  const createComponent = createComponentFactory({
    component: AuditComponent,
    imports: [
      ReactiveFormsModule,
      // Force the real tn-button family so ng-mocks doesn't transitively try to
      // mock TnButtonComponent (its signal-based viewChilds crash inside the
      // generated mock during view-query binding).
      TnButtonComponent,
      TnButtonToggleComponent,
      TnButtonToggleGroupComponent,
    ],
    declarations: [
      MockComponents(
        LogDetailsPanelComponent,
        ExportButtonComponent,
        FakeProgressBarComponent,
        PageHeaderComponent,
        MockMasterDetailViewComponent,
        SearchInputComponent,
      ),
    ],
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
      mockTypedApi([
        mockTypedQuery('user.query', []),
        mockTypedCall('audit.query', ([params]) => (params?.['query-options']?.count ? 2 : auditEntryRows)),
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

  beforeEach(async () => {
    spectator = createComponent();
    api = spectator.inject(MockTypedApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    // The typed double answers on a microtask. Detect changes automatically, so the fake progress
    // bar sees the load finish and stops its timer; otherwise the fixture never settles.
    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();
  });

  it('checks used components on page', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
    expect(spectator.query(ExportButtonComponent)).toExist();
    expect(spectator.query(FakeProgressBarComponent)).toExist();
  });

  it('makes only 2 API calls during initialization (count + data)', () => {
    const auditQueryCalls = getAuditQueryParams();

    // Should have exactly 2 calls (1 for count, 1 for data) - not duplicated
    expect(auditQueryCalls).toHaveLength(2);

    const countCall = auditQueryCalls.find((params) => params['query-options']?.count);
    const dataCall = auditQueryCalls.find((params) => !params['query-options']?.count);

    expect(countCall).toBeDefined();
    expect(dataCall).toBeDefined();
  });

  it('prevents duplicate API calls when controller type changes', async () => {
    jest.clearAllMocks();

    const standbyToggle = await loader.getHarness(TnButtonToggleHarness.with({ label: 'Standby' }));
    await standbyToggle.check();

    const auditQueryCalls = getAuditQueryParams();

    // Should have exactly 2 calls (1 for count, 1 for data) - not duplicated
    expect(auditQueryCalls).toHaveLength(2);

    const dataCall = auditQueryCalls.find((params) => !params['query-options']?.count);
    expect(dataCall).toHaveProperty('remote_controller', true);
  });

  // Detailed basic/advanced query-shaping behavior is covered in
  // audit-search.component.spec.ts. The cases below are smoke tests of the
  // wiring: search input → audit page → API call, plus the controller toggle
  // and service select also reaching the API.
  describe('integration', () => {
    it('sends empty filters when basic search has no query', async () => {
      const search = spectator.query(SearchInputComponent)!;
      search.query.set({
        isBasicQuery: true,
        query: '',
      });

      search.runSearch.emit();
      await spectator.fixture.whenStable();

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

    it('applies basic search filters to the API query', async () => {
      const search = spectator.query(SearchInputComponent)!;
      search.query.set({
        isBasicQuery: true,
        query: 'search',
      });

      search.runSearch.emit();
      await spectator.fixture.whenStable();

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

    it('applies advanced search filters to the API query', async () => {
      const search = spectator.query<SearchInputComponent<AuditEntry>>(SearchInputComponent)!;
      search.query.set({
        isBasicQuery: false,
        filters: [
          ['event', '=', 'Authentication'],
          ['username', '~', 'bob'],
        ],
      });

      search.runSearch.emit();
      await spectator.fixture.whenStable();

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

    it('filters by selected service', async () => {
      jest.clearAllMocks();

      const serviceSelect = await loader.getHarness(TnSelectHarness);
      await serviceSelect.selectOption('SMB');

      spectator.detectChanges();

      const auditQueryCalls = api.call.mock.calls.filter(
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
  });

  describe('details panel', () => {
    it('checks card title', () => {
      spectator.detectChanges();
      const title = spectator.query('h3');
      expect(title).toHaveText('Log Details');
    });

    it('shows details for the selected audit entry', async () => {
      const table = await loader.getHarness(TnTableHarness);
      const rowCount = await table.getRowCount();
      // Sanity check that the mock data rendered two rows.
      expect(rowCount).toBe(2);

      await table.clickRow(1);
      spectator.detectChanges();

      const details = spectator.query(LogDetailsPanelComponent)!;
      expect(details.log).toEqual(auditEntries[1]);
    });
  });
});
