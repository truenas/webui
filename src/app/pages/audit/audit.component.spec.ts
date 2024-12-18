import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { ControllerType } from 'app/enums/controller-type.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AuditComponent } from 'app/pages/audit/audit.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { LocaleService } from 'app/services/locale.service';
import { ApiService } from 'app/services/websocket/api.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('AuditComponent', () => {
  let spectator: Spectator<AuditComponent>;
  let api: ApiService;
  let table: IxTableHarness;

  const auditEntries = [
    {
      audit_id: '1',
      timestamp: {
        $date: 1712932440770,
      },
      message_timestamp: 1712932440,
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
      message_timestamp: 1712932952,
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
      IxTableCellDirective,
      MatButtonToggleModule,
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
      mockApi([
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
    // Do it in this weird way because table header is outside the table element.
    table = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxTableHarness);
  });

  it('loads and shows a table with audit entries', async () => {
    expect(api.call).toHaveBeenCalledWith(
      'audit.query',
      [{ 'query-filters': [], 'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] }, remote_controller: false }],
    );

    await spectator.fixture.whenStable();
    await spectator.fixture.whenRenderingDone();
    expect(await table.getCellTexts()).toEqual([
      ['Service', 'User', 'Timestamp', 'Event', 'Event Data'],
      ['SMB', 'Administrator', '2024-04-12 07:34:00', 'Authentication', 'Account: Administrator'],
      ['SMB', 'bob', '2024-04-12 07:42:32', 'Create', 'File: test.txt'],
    ]);
  });

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

  it('runs search when controller type is changed', () => {
    spectator.component.controllerTypeChanged({ value: ControllerType.Standby } as MatButtonToggleChange);
    spectator.detectChanges();

    expect(api.call).toHaveBeenLastCalledWith(
      'audit.query',
      [{
        'query-filters': [],
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

  it('shows details for the selected audit entry', async () => {
    await table.clickRow(1);

    const details = spectator.query(LogDetailsPanelComponent);
    expect(details.log).toEqual(auditEntries[1]);
  });
});
