import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createRoutingFactory, SpectatorRouting } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DualListboxComponent } from 'app/modules/common/dual-list/dual-list.component';
import { NgxDualListboxModule } from 'app/modules/common/dual-list/dual-list.module';
import { GroupMembersComponent } from 'app/pages/account/groups/group-members/group-members.component';
import { WebSocketService } from 'app/services';

const fakeGroupDataSource = [{
  id: 1,
  gid: 1000,
  group: 'dummy',
  builtin: false,
  smb: true,
  sudo: false,
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
      NgxDualListboxModule,
    ],
    declarations: [DualListboxComponent],
    providers: [
      mockWebsocket([
        mockCall('group.query', fakeGroupDataSource),
        mockCall('user.query', [{ id: 41 }] as User[]),
        mockCall('group.update'),
      ]),
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

  it('shows current group values when form is being edited', () => {
    expect(spectator.query('mat-card-title')).toHaveText('dummy');
    expect(ws.call).toHaveBeenCalledWith('group.query', [[['id', '=', 1]]]);
    expect(ws.call).toHaveBeenCalledWith('user.query', [[['id', 'in', [41]]]]);
  });

  it('redirects to Group List page when Cancel is pressed', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
    await button.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups']);
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('group.update', [1, { users: [41] }]);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups']);
  });
});
