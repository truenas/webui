import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AuditService, AuditEvent } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { ExportButtonComponent } from 'app/modules/export-button/components/export-button/export-button.component';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SearchInputComponent } from 'app/modules/search-input/components/search-input/search-input.component';
import { SearchInputModule } from 'app/modules/search-input/search-input.module';
import { AuditComponent } from 'app/pages/audit/components/audit/audit.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { WebSocketService } from 'app/services/ws.service';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

describe('AuditComponent', () => {
  let spectator: Spectator<AuditComponent>;
  let websocket: WebSocketService;
  let table: IxTable2Harness;

  const auditEntries = [
    {
      audit_id: '1',
      timestamp: {
        $date: 1702890820000,
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
        $date: 1702894523000,
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
      IxTable2Module,
    ],
    declarations: [
      MockComponents(
        LogDetailsPanelComponent,
        ExportButtonComponent,
        FakeProgressBarComponent,
      ),
    ],
    providers: [
      mockWebsocket([
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
            selector: selectTimezone,
            value: 'UTC',
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    websocket = spectator.inject(WebSocketService);
    // Do it in this weird way because table header is outside the table element.
    table = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxTable2Harness);
  });

  it('loads and shows a table with audit entries', async () => {
    expect(websocket.call).toHaveBeenCalledWith(
      'audit.query',
      [{ 'query-filters': [], 'query-options': { limit: 50, offset: 0 } }],
    );

    await spectator.fixture.whenStable();
    await spectator.fixture.whenRenderingDone();
    expect(await table.getCellTexts()).toEqual([
      ['Service', 'User', 'Timestamp', 'Event', 'Event Data'],
      ['SMB', 'Administrator', '2023-12-18 09:13:40', 'Authentication', 'Account: Administrator'],
      ['SMB', 'bob', '2023-12-18 10:15:23', 'Create', 'File: test.txt'],
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
        'query-options': { limit: 50, offset: 0 },
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
        'query-options': { limit: 50, offset: 0 },
      }],
    );
  });

  it('shows details for the selected audit entry', async () => {
    await table.clickRow(1);

    const details = spectator.query(LogDetailsPanelComponent);
    expect(details.log).toEqual(auditEntries[1]);
  });
});
