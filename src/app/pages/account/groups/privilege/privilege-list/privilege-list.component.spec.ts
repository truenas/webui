import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Role } from 'app/enums/role.enum';
import { Privilege } from 'app/interfaces/privilege.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInputModule } from 'app/modules/search-input/search-input.module';
import { PrivilegeFormComponent } from 'app/pages/account/groups/privilege/privilege-form/privilege-form.component';
import { PrivilegeListComponent } from 'app/pages/account/groups/privilege/privilege-list/privilege-list.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const fakePrivilegeDataSource: Privilege[] = [
  {
    id: 1,
    name: 'privilege1',
    web_shell: true,
    local_groups: [{}],
    ds_groups: [{}, {}],
    roles: [Role.SharingAdmin],
  },
  {
    id: 2,
    name: 'privilege2',
    web_shell: false,
    local_groups: [],
    ds_groups: [{}],
    roles: [Role.FullAdmin, Role.ReadonlyAdmin],
  },
] as Privilege[];

describe('PrivilegeListComponent', () => {
  let spectator: Spectator<PrivilegeListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: PrivilegeListComponent,
    imports: [
      IxTable2Module,
      PageHeaderModule,
      SearchInputModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('privilege.query', fakePrivilegeDataSource),
        mockCall('privilege.delete', true),
        mockCall('group.query', []),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Roles', 'Local Groups', 'DS Groups', 'Web Shell Access', ''],
      ['privilege1', 'Sharing Admin', '1', '2', 'Yes', ''],
      ['privilege2', 'Full Admin, Readonly Admin', '0', '1', 'No', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'privilege1');
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(PrivilegeFormComponent, {
      data: fakePrivilegeDataSource[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'delete' }), 'privilege2');
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('privilege.delete', [2]);
  });
});
