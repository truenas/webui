import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnIconButtonHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { GroupMembersComponent } from 'app/pages/credentials/groups/group-members/group-members.component';

const fakeGroupDataSource = [{
  id: 1,
  gid: 1000,
  group: 'dummy-group',
  builtin: false,
  local: true,
  smb: true,
  users: [41],
}] as Group[];

describe('GroupMembersComponent', () => {
  let spectator: SpectatorRouting<GroupMembersComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  const createComponent = createRoutingFactory({
    component: GroupMembersComponent,
    imports: [
      ReactiveFormsModule,
      DualListBoxComponent,
    ],
    providers: [
      mockApi([
        mockCall('group.query', fakeGroupDataSource),
        mockCall('user.query', [{ id: 41, username: 'dummy-user' }, { id: 42, username: 'second-user' }] as User[]),
        mockCall('group.update'),
      ]),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockAuth(),
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }),
    ],
    params: {
      pk: '1',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads local users to show in available users', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.query', [[['local', '=', true]]]);
  });

  it('shows current group values when form is being edited', () => {
    spectator.detectChanges();

    expect(spectator.query('[tnCardHeader]')).toHaveText('dummy-group');

    expect(spectator.queryAll('tn-list[aria-label="All Users"] tn-list-item')).toHaveLength(1);
    expect(spectator.queryAll('tn-list[aria-label="Group Members"] tn-list-item')).toHaveLength(1);

    expect(api.call).toHaveBeenCalledWith('group.query', [[['id', '=', 1]]]);
  });

  it('redirects to Group List page when Cancel button is pressed', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
    await button.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups']);
  });

  it('sends an update payload to websocket and closes modal when Save button is pressed', async () => {
    spectator.detectChanges();

    const availableItems = spectator.queryAll('tn-list[aria-label="All Users"] tn-list-item');
    expect(availableItems).toHaveLength(1);
    expect(spectator.queryAll('tn-list[aria-label="Group Members"] tn-list-item')).toHaveLength(1);

    spectator.click(availableItems[0]);

    const addButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'chevron-right' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.queryAll('tn-list[aria-label="All Users"] tn-list-item')).toHaveLength(0);
    expect(spectator.queryAll('tn-list[aria-label="Group Members"] tn-list-item')).toHaveLength(2);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('group.update', [1, { users: [41, 42] }]);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups']);
  });
});

describe('GroupMembersComponent - directory service group', () => {
  const nonLocalGroup = [{ ...fakeGroupDataSource[0], local: false }] as Group[];
  const createNonLocalComponent = createRoutingFactory({
    component: GroupMembersComponent,
    imports: [ReactiveFormsModule, DualListBoxComponent],
    providers: [
      mockApi([
        mockCall('group.query', nonLocalGroup),
        mockCall('user.query', []),
      ]),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockAuth(),
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }),
    ],
    params: { pk: '1' },
  });

  it('redirects to groups list with snackbar message for directory service groups', () => {
    const spectator = createNonLocalComponent();
    expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith(
      'Cannot manage members for directory service groups.',
    );
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/', 'credentials', 'groups']);
  });
});
