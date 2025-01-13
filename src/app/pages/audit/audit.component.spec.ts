import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { IxButtonGroupComponent } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { IxButtonGroupHarness } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.harness';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { LocaleService } from 'app/modules/language/locale.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditComponent } from 'app/pages/audit/audit.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { auditEntries } from 'app/pages/audit/testing/mock-audit-api-data-provider';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('AuditComponent', () => {
  let spectator: Spectator<AuditComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: AuditComponent,
    imports: [
      IxTableCellDirective,
      IxButtonGroupComponent,
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
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
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

  beforeEach(async () => {
    spectator = createComponent();
    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    // Do it in this weird way because table header is outside the table element.
    table = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxTableHarness);
  });

  it('checks used components on page', () => {
    expect(spectator.query(PageHeaderComponent)).toExist();
    expect(spectator.query(MasterDetailViewComponent)).toExist();
    expect(spectator.query(ExportButtonComponent)).toExist();
    expect(spectator.query(FakeProgressBarComponent)).toExist();
  });

  describe('search', () => {
    it('searches by event, username and service when basic search is used', () => {
      const search = spectator.query(SearchInputComponent);
      search.query.set({
        isBasicQuery: true,
        query: 'search',
      });

      search.runSearch.emit();

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [['OR', [['event', '~', '(?i)search'], ['username', '~', '(?i)search'], ['service', '~', '(?i)search']]]],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          remote_controller: false,
        }],
      );
    });

    it('runs search when controller type is changed', async () => {
      const buttonGroup = await loader.getHarness(IxButtonGroupHarness);
      await buttonGroup.setValue('Standby');

      spectator.detectChanges();

      expect(api.call).toHaveBeenLastCalledWith(
        'audit.query',
        [{
          'query-filters': [['OR', [['event', '~', '(?i)'], ['username', '~', '(?i)'], ['service', '~', '(?i)']]]],
          'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
          remote_controller: true,
        }],
      );
    });

    it('applies filters to API query when advanced search is used', () => {
      const search = spectator.query<SearchInputComponent<AuditEntry>>(SearchInputComponent);
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
          remote_controller: false,
        }],
      );
    });
  });

  describe('details panel', () => {
    it('checks card title', () => {
      const title = spectator.query('h3');
      expect(title).toHaveText('Log Details');
    });

    it('shows details for the selected audit entry', async () => {
      await table.clickRow(1);

      const details = spectator.query(LogDetailsPanelComponent);
      expect(details.log).toEqual(auditEntries[1]);
    });
  });
});
