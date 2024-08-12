import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchInputModule } from 'app/modules/forms/search-input/search-input.module';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AuditComponent } from 'app/pages/audit/components/audit/audit.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('AuditComponent', () => {
  let spectator: Spectator<AuditComponent>;
  let websocket: WebSocketService;
  let table: IxTableHarness;

  const auditEntries = [
    {
      audit_id: '1',
      timestamp: {
        $date: 1723453417000,
      },
      address: '10.220.2.21',
      username: 'Administrator',
      service: AuditService.Smb,
      event: AuditEvent.Authentication,
      event_data: {
        clientAccount: 'Administrator',
      },
    },
    {
      audit_id: '2',
      timestamp: {
        $date: 1712932952481,
      },
      address: '10.220.2.21',
      username: 'bob',
      service: AuditService.Smb,
      event: AuditEvent.Create,
      event_data: {
        file_type: 'FILE',
        file: {
          path: 'test.txt',
        },
      },
    },
  ] as AuditEntry[];

  const createComponent = createComponentFactory({
    component: AuditComponent,
    imports: [
      SearchInputModule,
      IxTableModule,
    ],
    declarations: [
      MockComponents(
        LogDetailsPanelComponent,
        ExportButtonComponent,
        FakeProgressBarComponent,
        PageHeaderComponent,
      ),
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
      mockWebSocket([
        mockCall('audit.query', (params) => {
          if (params[0]['query-options'].count) {
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
    websocket = spectator.inject(WebSocketService);
    // Do it in this weird way because table header is outside the table element.
    table = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxTableHarness);
  });

  it('loads and shows a table with audit entries', async () => {
    expect(websocket.call).toHaveBeenCalledWith(
      'audit.query',
      [{ 'query-filters': [], 'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] } }],
    );

    await spectator.fixture.whenStable();
    await spectator.fixture.whenRenderingDone();
    expect(await table.getCellTexts()).toEqual([
      ['Service', 'User', 'Timestamp', 'Event', 'Event Data'],
      ['SMB', 'Administrator', '2024-08-12 02:03:37', 'Authentication', 'Account: Administrator'],
      ['SMB', 'bob', '2024-04-12 07:42:32', 'Create', 'File: test.txt'],
    ]);
  });

  it('searches by event, username and service when basic search is used', () => {
    const search = spectator.query(SearchInputComponent);
    search.query = {
      isBasicQuery: true,
      query: 'search',
    };

    search.runSearch.emit();

    expect(websocket.call).toHaveBeenLastCalledWith(
      'audit.query',
      [{
        'query-filters': [['OR', [['event', '~', '(?i)search'], ['username', '~', '(?i)search'], ['service', '~', '(?i)search']]]],
        'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
      }],
    );
  });

  it('applies filters to API query when advanced search is used', () => {
    const search = spectator.query<SearchInputComponent<AuditEntry>>(SearchInputComponent);
    search.query = {
      isBasicQuery: false,
      filters: [
        ['event', '=', 'Authentication'],
        ['username', '~', 'bob'],
      ],
    };
    search.runSearch.emit();

    expect(websocket.call).toHaveBeenLastCalledWith(
      'audit.query',
      [{
        'query-filters': [['event', '=', 'Authentication'], ['username', '~', 'bob']],
        'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
      }],
    );
  });

  it('shows details for the selected audit entry', async () => {
    await table.clickRow(1);

    const details = spectator.query(LogDetailsPanelComponent);
    expect(details.log).toEqual(auditEntries[1]);
  });
});
