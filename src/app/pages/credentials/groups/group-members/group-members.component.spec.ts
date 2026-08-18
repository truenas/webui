import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnIconButtonHarness } from '@truenas/ui-components';
import { firstValueFrom, of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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
      mockProvider(UnsavedChangesService, {
        showConfirmDialog: jest.fn(() => of(true)),
      }),
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

  async function moveFirstAvailableUserToMembers(): Promise<void> {
    spectator.detectChanges();

    spectator.click(spectator.queryAll('tn-list[aria-label="All Users"] tn-list-item')[0]);

    const addButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'chevron-right' }));
    await addButton.click();
    spectator.detectChanges();
  }

  it('leaves the page without a prompt when members were not changed', async () => {
    spectator.detectChanges();

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(true);
    expect(spectator.inject(UnsavedChangesService).showConfirmDialog).not.toHaveBeenCalled();
  });

  it('asks to confirm leaving the page when members were changed', async () => {
    await moveFirstAvailableUserToMembers();

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(true);
    expect(spectator.inject(UnsavedChangesService).showConfirmDialog).toHaveBeenCalled();
  });

  it('stays on the page when the unsaved changes prompt is declined', async () => {
    const unsavedChanges = spectator.inject(UnsavedChangesService);
    unsavedChanges.showConfirmDialog = jest.fn(() => of(false));

    await moveFirstAvailableUserToMembers();

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(false);
  });

  it('stops asking to confirm once the changed members are saved', async () => {
    await moveFirstAvailableUserToMembers();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    await expect(firstValueFrom(spectator.component.canDeactivate())).resolves.toBe(true);
    expect(spectator.inject(UnsavedChangesService).showConfirmDialog).not.toHaveBeenCalled();
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

describe('GroupMembersComponent - initial loading', () => {
  let spectator: SpectatorRouting<GroupMembersComponent>;
  let groupQuery$: Subject<Group[]>;
  let userQuery$: Subject<User[]>;

  const createComponent = createRoutingFactory({
    component: GroupMembersComponent,
    imports: [ReactiveFormsModule, DualListBoxComponent],
    providers: [
      mockApi([]),
      mockProvider(ApiService, {
        call: jest.fn((method: string) => (method === 'group.query' ? groupQuery$ : userQuery$)),
      }),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(UnsavedChangesService),
      mockAuth(),
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }),
    ],
    params: { pk: '1' },
  });

  beforeEach(() => {
    groupQuery$ = new Subject<Group[]>();
    userQuery$ = new Subject<User[]>();
    spectator = createComponent();
    spectator.detectChanges();
  });

  it('shows a spinner in place of the picker while the group is loading', () => {
    expect(spectator.query('tn-spinner')).toExist();
    expect(spectator.query('ix-dual-listbox')).not.toExist();
  });

  it('replaces the spinner with the picker once the group loads', () => {
    groupQuery$.next(fakeGroupDataSource);
    groupQuery$.complete();
    userQuery$.next([{ id: 41, username: 'dummy-user' }] as User[]);
    userQuery$.complete();
    spectator.detectChanges();

    expect(spectator.query('tn-spinner')).not.toExist();
    expect(spectator.query('ix-dual-listbox')).toExist();
  });
});

describe('GroupMembersComponent - built-in users', () => {
  let spectator: SpectatorRouting<GroupMembersComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: GroupMembersComponent,
    imports: [ReactiveFormsModule, DualListBoxComponent],
    providers: [
      mockApi([
        mockCall('group.query', fakeGroupDataSource),
        mockCall('user.query', [
          { id: 41, username: 'dummy-user', builtin: false },
          { id: 42, username: 'zoe', builtin: false },
          { id: 1, username: 'root', builtin: true },
        ] as User[]),
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
    params: { pk: '1' },
  });

  const availableUsernames = (): string[] => spectator
    .queryAll('tn-list[aria-label="All Users"] tn-list-item label')
    .map((element) => element.textContent.trim());

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.detectChanges();
  });

  it('sorts available users alphabetically', () => {
    expect(availableUsernames()).toEqual(['root', 'zoe']);
  });

  it('hides built-in users when the filter is checked', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness);
    expect(await checkbox.getLabelText()).toBe('Hide built-in users (1)');

    await checkbox.check();
    spectator.detectChanges();

    expect(availableUsernames()).toEqual(['zoe']);
  });
});

describe('GroupMembersComponent - built-in users already in the group', () => {
  let spectator: SpectatorRouting<GroupMembersComponent>;
  let loader: HarnessLoader;

  // root is both built-in and already a member; daemon is the only one the checkbox can hide.
  const groupWithBuiltinMember = [{ ...fakeGroupDataSource[0], users: [41, 1] }] as Group[];

  const createComponent = createRoutingFactory({
    component: GroupMembersComponent,
    imports: [ReactiveFormsModule, DualListBoxComponent],
    providers: [
      mockApi([
        mockCall('group.query', groupWithBuiltinMember),
        mockCall('user.query', [
          { id: 41, username: 'dummy-user', builtin: false },
          { id: 1, username: 'root', builtin: true },
          { id: 2, username: 'daemon', builtin: true },
        ] as User[]),
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
    params: { pk: '1' },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.detectChanges();
  });

  it('counts only the built-ins the checkbox can hide, not ones already in the group', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness);

    expect(await checkbox.getLabelText()).toBe('Hide built-in users (1)');
  });

  it('keeps a built-in member on the members side when built-ins are hidden', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.check();
    spectator.detectChanges();

    expect(spectator.queryAll('tn-list[aria-label="All Users"] tn-list-item')).toHaveLength(0);
    expect(spectator.queryAll('tn-list[aria-label="Group Members"] tn-list-item label')
      .map((element) => element.textContent.trim())).toEqual(['dummy-user', 'root']);
  });

  // Without this the member would leave the group list and be filtered out of the available
  // one, disappearing from both sides with no trace of where it went.
  it('shows a built-in member in the available list when it is moved out of the group', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.check();
    spectator.detectChanges();

    const members = spectator.queryAll('tn-list[aria-label="Group Members"] tn-list-item');
    spectator.click(members[1]);

    const removeButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'chevron-left' }));
    await removeButton.click();
    spectator.detectChanges();

    expect(spectator.queryAll('tn-list[aria-label="All Users"] tn-list-item label')
      .map((element) => element.textContent.trim())).toEqual(['root']);
    expect(spectator.queryAll('tn-list[aria-label="Group Members"] tn-list-item label')
      .map((element) => element.textContent.trim())).toEqual(['dummy-user']);
  });
});

describe('GroupMembersComponent - built-in users added during the session', () => {
  let spectator: SpectatorRouting<GroupMembersComponent>;
  let loader: HarnessLoader;

  const groupWithBuiltinMember = [{ ...fakeGroupDataSource[0], users: [41, 1] }] as Group[];

  const createComponent = createRoutingFactory({
    component: GroupMembersComponent,
    imports: [ReactiveFormsModule, DualListBoxComponent],
    providers: [
      mockApi([
        mockCall('group.query', groupWithBuiltinMember),
        mockCall('user.query', [
          { id: 41, username: 'dummy-user', builtin: false },
          { id: 1, username: 'root', builtin: true },
          { id: 2, username: 'daemon', builtin: true },
          // Stays out of the group, so the checkbox has something left to hide.
          { id: 3, username: 'bin', builtin: true },
        ] as User[]),
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
    params: { pk: '1' },
  });

  const usernamesIn = (list: string): string[] => spectator
    .queryAll(`tn-list[aria-label="${list}"] tn-list-item label`)
    .map((element) => element.textContent.trim());

  const move = async (list: string, index: number, icon: string): Promise<void> => {
    spectator.click(spectator.queryAll(`tn-list[aria-label="${list}"] tn-list-item`)[index]);

    await (await loader.getHarness(TnIconButtonHarness.with({ name: icon }))).click();
    spectator.detectChanges();
  };

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.detectChanges();
  });

  // The picker rebuilds its available list out of the source it was given, so a built-in that
  // joined the group before the filter went on has to stay in the source to come back out.
  it('shows a built-in added before the filter was applied when it is moved out again', async () => {
    await move('All Users', 1, 'chevron-right');
    expect(usernamesIn('Group Members')).toEqual(['daemon', 'dummy-user', 'root']);

    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.check();
    spectator.detectChanges();

    expect(usernamesIn('All Users')).toEqual([]);

    await move('Group Members', 0, 'chevron-left');

    expect(usernamesIn('All Users')).toEqual(['daemon']);
    expect(usernamesIn('Group Members')).toEqual(['dummy-user', 'root']);
  });

  // The label has to describe the source the picker is showing, not the live member list:
  // a built-in moved back out is on screen again and must not be counted as hidden.
  it('counts only the built-ins actually off screen while the filter is on', async () => {
    await move('All Users', 1, 'chevron-right');

    const checkbox = await loader.getHarness(TnCheckboxHarness);
    await checkbox.check();
    spectator.detectChanges();

    expect(await checkbox.getLabelText()).toBe('Hide built-in users (1)');

    await move('Group Members', 0, 'chevron-left');

    expect(usernamesIn('All Users')).toEqual(['daemon']);
    expect(await checkbox.getLabelText()).toBe('Hide built-in users (1)');
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
