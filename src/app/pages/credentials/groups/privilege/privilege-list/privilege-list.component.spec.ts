import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { Privilege } from 'app/interfaces/privilege.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { PrivilegeFormComponent } from 'app/pages/credentials/groups/privilege/privilege-form/privilege-form.component';
import { PrivilegeListComponent } from 'app/pages/credentials/groups/privilege/privilege-list/privilege-list.component';

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
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: PrivilegeListComponent,
    imports: [
      PageHeaderComponent,
    ],
    providers: [
      mockApi([
        mockCall('privilege.query', fakePrivilegeDataSource),
        mockCall('privilege.delete', true),
        mockCall('group.query', []),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
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

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PrivilegeFormComponent, {
      data: fakePrivilegeDataSource[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'privilege2');
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('privilege.delete', [2]);
  });
});
