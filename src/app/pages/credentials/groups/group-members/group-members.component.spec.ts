import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListHarness } from '@angular/material/list/testing';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { suppressJsDomCssErrors } from 'app/core/testing/utils/suppress-jsdom-css-errors.utils';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { GroupMembersComponent } from 'app/pages/credentials/groups/group-members/group-members.component';
import { WebSocketService } from 'app/services/ws.service';

const fakeGroupDataSource = [{
  id: 1,
  gid: 1000,
  group: 'dummy-group',
  builtin: false,
  smb: true,
  users: [41],
}] as Group[];

describe('GroupMembersComponent', () => {
  let spectator: SpectatorRouting<GroupMembersComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createRoutingFactory({
    component: GroupMembersComponent,
    imports: [
      ReactiveFormsModule,
      DualListBoxComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('group.query', fakeGroupDataSource),
        mockCall('user.query', [{ id: 41, username: 'dummy-user' }, { id: 42, username: 'second-user' }] as User[]),
        mockCall('group.update'),
      ]),
      mockProvider(DialogService),
      mockAuth(),
    ],
    params: {
      pk: '1',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows current group values when form is being edited', async () => {
    const userList = await loader.getHarness(MatListHarness.with({ selector: '[aria-label="All Users"]' }));
    const memberList = await loader.getHarness(MatListHarness.with({ selector: '[aria-label="Group Members"]' }));

    expect(spectator.query('mat-card-title')).toHaveText('dummy-group');

    expect(await userList.getItems()).toHaveLength(1);
    expect(await memberList.getItems()).toHaveLength(1);

    expect(ws.call).toHaveBeenCalledWith('user.query');
    expect(ws.call).toHaveBeenCalledWith('group.query', [[['id', '=', 1]]]);
  });

  it('redirects to Group List page when Cancel button is pressed', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
    await button.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups']);
  });

  it('sends an update payload to websocket and closes modal when Save button is pressed', async () => {
    suppressJsDomCssErrors();

    const userList = await loader.getHarness(MatListHarness.with({ selector: '[aria-label="All Users"]' }));
    const memberList = await loader.getHarness(MatListHarness.with({ selector: '[aria-label="Group Members"]' }));
    const users = await userList.getItems();

    expect(users).toHaveLength(1);
    expect(await memberList.getItems()).toHaveLength(1);

    await (await users[0].host()).click();

    const addButton = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="move-selected-right"]' }));
    await addButton.click();

    expect(await userList.getItems()).toHaveLength(0);
    expect(await memberList.getItems()).toHaveLength(2);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('group.update', [1, { users: [41, 42] }]);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups']);
  });
});
