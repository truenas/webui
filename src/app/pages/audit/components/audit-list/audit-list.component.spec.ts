import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { OutputEmitterRef } from '@angular/core';
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

interface AuditListInternals {
  onRowClick: (row: AuditEntry | null) => void;
  onSortChange: (event: { column: string; direction: 'asc' | 'desc' | '' }) => void;
  rowSelected: OutputEmitterRef<AuditEntry>;
  toggleShowMobileDetails: OutputEmitterRef<boolean>;
}

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

  describe('onRowClick', () => {
    it('emits rowSelected and toggleShowMobileDetails when a row is clicked', () => {
      const internals = spectator.component as unknown as AuditListInternals;
      const rowSelectedSpy = jest.fn();
      const toggleShowMobileDetailsSpy = jest.fn();
      internals.rowSelected.subscribe(rowSelectedSpy);
      internals.toggleShowMobileDetails.subscribe(toggleShowMobileDetailsSpy);

      internals.onRowClick(auditEntries[0]);

      expect(rowSelectedSpy).toHaveBeenCalledWith(auditEntries[0]);
      expect(toggleShowMobileDetailsSpy).toHaveBeenCalledWith(true);
    });

    it('does nothing when row is falsy', () => {
      const internals = spectator.component as unknown as AuditListInternals;
      const rowSelectedSpy = jest.fn();
      const toggleShowMobileDetailsSpy = jest.fn();
      internals.rowSelected.subscribe(rowSelectedSpy);
      internals.toggleShowMobileDetails.subscribe(toggleShowMobileDetailsSpy);

      internals.onRowClick(null);

      expect(rowSelectedSpy).not.toHaveBeenCalled();
      expect(toggleShowMobileDetailsSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      (mockAuditApiDataProvider.setSorting as jest.Mock).mockClear();
    });

    it('translates "asc" direction with active column index', () => {
      (spectator.component as unknown as AuditListInternals).onSortChange({
        column: 'service',
        direction: 'asc',
      });

      expect(mockAuditApiDataProvider.setSorting).toHaveBeenCalledWith({
        propertyName: 'service',
        direction: SortDirection.Asc,
        active: 0,
      });
    });

    it('translates "desc" direction with active column index', () => {
      (spectator.component as unknown as AuditListInternals).onSortChange({
        column: 'event',
        direction: 'desc',
      });

      expect(mockAuditApiDataProvider.setSorting).toHaveBeenCalledWith({
        propertyName: 'event',
        direction: SortDirection.Desc,
        active: 3,
      });
    });

    it('clears propertyName and active when direction is empty', () => {
      (spectator.component as unknown as AuditListInternals).onSortChange({
        column: 'service',
        direction: '',
      });

      expect(mockAuditApiDataProvider.setSorting).toHaveBeenCalledWith({
        propertyName: null,
        direction: null,
        active: null,
      });
    });
  });
});
