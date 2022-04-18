import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { GroupDetailsRowComponent } from 'app/pages/account/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const dummyGroup = {
  id: 1,
  gid: 1000,
  group: 'dummy',
  builtin: false,
  smb: true,
  users: [],
} as Group;

describe('GroupDetailsRowComponent', () => {
  let spectator: SpectatorRouting<GroupDetailsRowComponent>;
  let loader: HarnessLoader;
  let dialogServiceMock: DialogService;

  const createComponent = createRoutingFactory({
    component: GroupDetailsRowComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    declarations: [
      GroupFormComponent,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('user.query'),
        mockCall('group.delete'),
        mockCall('group.query', []),
      ]),
      mockProvider(DialogService, {
        dialogForm: jest.fn(() => of()),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {
              hideBuiltinUsers: false,
            } as Preferences,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        group: dummyGroup,
        colspan: 5,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    dialogServiceMock = spectator.inject(DialogService);
  });

  it('checks colspan attribute', () => {
    expect(spectator.query('td').getAttribute('colspan')).toBe('5');
  });

  it('should redirect to group members form', async () => {
    const membersButton = await loader.getHarness(MatButtonHarness.with({ text: 'peopleMembers' }));
    await membersButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups', 1, 'members']);
  });

  it('should open edit group form', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'editEdit' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(GroupFormComponent);
  });

  it('should make websocket call to delete group', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'deleteDelete' }));
    await deleteButton.click();

    expect(dialogServiceMock.dialogForm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete Group',
      }),
    );
  });
});
