import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ControllerType } from 'app/enums/controller-type.enum';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { AuditListComponent } from 'app/pages/audit/components/audit-list/audit-list.component';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { mockAuditDataProvider, mockAuditEntries } from 'app/pages/audit/utils/mock-audit-data-provider';
import { LocaleService } from 'app/services/locale.service';
import { ApiService } from 'app/services/websocket/api.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

describe('AuditListComponent', () => {
  let spectator: Spectator<AuditListComponent>;
  let api: ApiService;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: AuditListComponent,
    imports: [],
    declarations: [
      MockComponents(
        ExportButtonComponent,
        SearchInputComponent,
        AuditSearchComponent,
      ),
    ],
    providers: [
      mockProvider(LocaleService, { timezone: 'UTC' }),
      mockApi([
        mockCall('user.query'),
        mockCall('audit.query', mockAuditEntries),
      ]),
      provideMockStore({
        selectors: [
          { selector: selectIsHaLicensed, value: true },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        isMobileView: false,
        controllerType: ControllerType.Active,
        dataProvider: mockAuditDataProvider,
      },
    });
    api = spectator.inject(ApiService);
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

  it('should filter entries when search is performed', () => {
    const searchInput = spectator.query(SearchInputComponent);
    searchInput.query.set({
      isBasicQuery: true,
      query: 'admin',
    });
    searchInput.runSearch.emit();

    const expectedFilters = [['OR', [
      ['event', '~', '(?i)admin'],
      ['username', '~', '(?i)admin'],
      ['service', '~', '(?i)admin'],
    ]]];

    expect(api.call).toHaveBeenCalledWith('audit.query', [
      expect.objectContaining({ 'query-filters': expectedFilters }),
    ]);
  });

  it('should show details when row is selected', async () => {
    await table.clickRow(0);

    const detailsPanel = spectator.query(LogDetailsPanelComponent);
    expect(detailsPanel.log).toEqual(mockAuditEntries[0]);
  });

  it('should handle controller type changes', () => {
    // spectator.component.controllerTypeChanged({
    //   value: ControllerType.Standby,
    // } as MatButtonToggleChange);

    expect(api.call).toHaveBeenCalledWith('audit.query', [
      expect.objectContaining({ remote_controller: true }),
    ]);
  });

  it('should format event data correctly', async () => {
    const cells = await table.getCellTexts();
    expect(cells).toContain(['Middleware', 'root', expect.any(String), 'Method Call', 'Method: test.method']);
  });
});
