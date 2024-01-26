import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import {
  DeleteGroupDialogComponent,
} from 'app/pages/account/groups/group-details-row/delete-group-dialog/delete-group-dialog.component';
import { GroupDetailsRowComponent } from 'app/pages/account/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
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

  const createComponent = createRoutingFactory({
    component: GroupDetailsRowComponent,
    imports: [
      IxTable2Module,
      MockModule(LayoutModule),
    ],
    declarations: [
      GroupFormComponent,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebSocket([
        mockCall('user.query'),
        mockCall('group.delete'),
        mockCall('group.query', []),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
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
      mockAuth(),
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
  });

  it('checks colspan attribute', () => {
    expect(spectator.query('td').getAttribute('colspan')).toBe('5');
  });

  it('should redirect to group members form', async () => {
    const membersButton = await loader.getHarness(MatButtonHarness.with({ text: 'Members' }));
    await membersButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups', 1, 'members']);
  });

  it('should open edit group form', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: /Edit/ }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(GroupFormComponent, { data: dummyGroup });
  });

  it('should open DeleteUserGroup when Delete button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: /Delete/ }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeleteGroupDialogComponent, {
      data: dummyGroup,
    });
  });
});
