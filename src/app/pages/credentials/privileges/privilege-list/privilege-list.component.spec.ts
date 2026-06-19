import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnTableHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { Privilege } from 'app/interfaces/privilege.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { PrivilegeFormComponent } from 'app/pages/credentials/privileges/privilege-form/privilege-form.component';
import { PrivilegeListComponent } from 'app/pages/credentials/privileges/privilege-list/privilege-list.component';

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
  let table: TnTableHarness;

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
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(
      ['Name', 'Roles', 'Local Groups', 'DS Groups', 'Web Shell Access', ''],
    );
    expect(await table.getAllRowTexts()).toEqual([
      ['privilege1', 'Sharing Admin', '1', '2', 'Yes', ''],
      ['privilege2', 'Full Admin, Readonly Admin', '0', '1', 'No', ''],
    ]);
  });

  it('opens form when "Edit" button is pressed', () => {
    const editButton = spectator.query('[data-test="button-privilege-privilege1-mdi-pencil-row-action"]');
    spectator.click(editButton);

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PrivilegeFormComponent, {
      data: fakePrivilegeDataSource[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', () => {
    const deleteButton = spectator.query('[data-test="button-privilege-privilege2-mdi-delete-row-action"]');
    spectator.click(deleteButton);

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete Privilege',
      message: 'Are you sure you want to delete the <b>privilege2</b>?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('privilege.delete', [2]);
  });
});
