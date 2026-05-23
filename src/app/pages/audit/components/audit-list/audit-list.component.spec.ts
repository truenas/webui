import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { LocaleService } from 'app/modules/language/locale.service';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { auditEntries, mockAuditApiDataProvider } from 'app/pages/audit/testing/mock-audit-api-data-provider';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { AuditListComponent } from './audit-list.component';

describe('AuditListComponent', () => {
  let spectator: Spectator<AuditListComponent>;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: AuditListComponent,
    imports: [
      MockComponent(AuditSearchComponent),
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
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

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        dataProvider: mockAuditApiDataProvider,
      },
    });

    table = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, TnTableHarness);
  });

  it('checks search component is rendered', () => {
    expect(spectator.query(AuditSearchComponent)).toExist();
  });

  it('loads and shows a table with audit entries', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Service', 'User', 'Timestamp', 'Event', 'Event Data']);
    expect(await table.getAllRowTexts()).toEqual([
      ['SMB', 'Administrator', '2024-04-12 07:34:00', 'Authentication', 'Account: Administrator'],
      ['SMB', 'bob', '2024-04-12 07:42:32', 'Create', 'File: test.txt'],
    ]);
  });

  it('checks table pager component is rendered', () => {
    expect(spectator.query(IxTablePagerComponent)).toExist();
  });

  describe('row interaction', () => {
    it('emits rowSelected and toggleShowMobileDetails when a row is clicked', async () => {
      const rowSelectedSpy = jest.fn();
      const toggleShowMobileDetailsSpy = jest.fn();
      spectator.output<AuditEntry>('rowSelected').subscribe(rowSelectedSpy);
      spectator.output<boolean>('toggleShowMobileDetails').subscribe(toggleShowMobileDetailsSpy);

      await table.clickRow(0);

      expect(rowSelectedSpy).toHaveBeenCalledWith(auditEntries[0]);
      expect(toggleShowMobileDetailsSpy).toHaveBeenCalledWith(true);
    });

    it('activates a row when Enter is pressed on the focused row', async () => {
      const rowSelectedSpy = jest.fn();
      spectator.output<AuditEntry>('rowSelected').subscribe(rowSelectedSpy);

      await table.pressKeyOnRow(1, 'enter');

      expect(rowSelectedSpy).toHaveBeenCalledWith(auditEntries[1]);
    });

    it('activates a row when Space is pressed on the focused row', async () => {
      const rowSelectedSpy = jest.fn();
      spectator.output<AuditEntry>('rowSelected').subscribe(rowSelectedSpy);

      await table.pressKeyOnRow(1, 'space');

      expect(rowSelectedSpy).toHaveBeenCalledWith(auditEntries[1]);
    });

    it('exposes each row as a single keyboard tab stop', async () => {
      expect(await table.isRowFocusable(0)).toBe(true);
      expect(await table.isRowFocusable(1)).toBe(true);
    });
  });

  describe('sorting', () => {
    beforeEach(() => {
      (mockAuditApiDataProvider.setSorting as jest.Mock).mockClear();
    });

    it('translates ascending sort to provider state with active column index', async () => {
      await table.clickSortHeader('service');

      expect(mockAuditApiDataProvider.setSorting).toHaveBeenCalledWith({
        propertyName: 'service',
        direction: SortDirection.Asc,
        active: 0,
      });
    });

    it('translates descending sort to provider state with active column index', async () => {
      await table.clickSortHeader('event');
      await table.clickSortHeader('event');

      expect(mockAuditApiDataProvider.setSorting).toHaveBeenLastCalledWith({
        propertyName: 'event',
        direction: SortDirection.Desc,
        active: 3,
      });
    });

    it('clears propertyName and active when sort is cycled back to none', async () => {
      await table.clickSortHeader('service');
      await table.clickSortHeader('service');
      await table.clickSortHeader('service');

      expect(mockAuditApiDataProvider.setSorting).toHaveBeenLastCalledWith({
        propertyName: null,
        direction: null,
        active: null,
      });
    });
  });
});
