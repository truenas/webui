import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { mockAuditApiDataProvider } from 'app/pages/audit/testing/mock-audit-api-data-provider';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { AuditListComponent } from './audit-list.component';

describe('AuditListComponent', () => {
  let spectator: Spectator<AuditListComponent>;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: AuditListComponent,
    imports: [
      MockComponent(IxTableComponent),
      MockComponent(AuditSearchComponent),
    ],
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
      mockProvider(EmptyService),
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
        isMobileView: false,
        dataProvider: mockAuditApiDataProvider,
      },
    });

    table = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxTableHarness);
  });

  it('checks search component is rendered', () => {
    expect(spectator.query(AuditSearchComponent)).toExist();
  });

  it('loads and shows a table with audit entries', async () => {
    expect(await table.getCellTexts()).toEqual([
      ['Service', 'User', 'Timestamp', 'Event', 'Event Data'],
      ['SMB', 'Administrator', '2024-04-12 07:34:00', 'Authentication', 'Account: Administrator'],
      ['SMB', 'bob', '2024-04-12 07:42:32', 'Create', 'File: test.txt'],
    ]);
  });

  it('checks table pager component is rendered', () => {
    expect(spectator.query(IxTablePagerComponent)).toExist();
  });
});
