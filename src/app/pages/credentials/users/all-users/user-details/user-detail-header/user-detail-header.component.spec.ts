import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { User } from 'app/interfaces/user.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { DeleteUserDialog } from 'app/pages/credentials/users/all-users/user-details/delete-user-dialog/delete-user-dialog.component';
import { UserDetailHeaderComponent } from 'app/pages/credentials/users/all-users/user-details/user-detail-header/user-detail-header.component';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';

const dummyUser = {
  id: 1,
  uid: 0,
  username: 'test-user',
  smbhash: '',
  local: true,
  home: '/test-user',
  shell: '/usr/bin/zsh',
  full_name: 'test-user',
  builtin: false,
  smb: false,
  password_disabled: false,
  locked: false,
  sudo_commands: [] as string[],
  sudo_commands_nopasswd: [] as string[],
  email: 'test-user@test-user.com',
  group: {
    id: 41,
    bsdgrp_gid: 0,
    bsdgrp_group: 'test-user',
  },
  groups: [] as number[],
} as User;

describe('UserDetailHeaderComponent', () => {
  let spectator: Spectator<UserDetailHeaderComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: UserDetailHeaderComponent,
    imports: [
      TnIconComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(FormSidePanelService),
      mockApi([
        mockCall('user.update'),
        mockCall('group.query', []),
        mockCall('user.delete'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { user: dummyUser },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should render user access card', () => {
    expect(spectator.query('span')).toHaveText('Details for test-user');
  });

  it('should open edit user form', async () => {
    const editButton = await loader.getHarness(TnButtonHarness.with({ label: /Edit/ }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      UserFormComponent,
      { title: 'Edit User', inputs: { editUser: dummyUser } },
    );
  });

  it('shows disabled Edit button with tooltip for directory service users', async () => {
    spectator.setInput('user', { ...dummyUser, local: false });

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    expect(await editButton.isDisabled()).toBe(true);

    const tooltips = spectator.queryAll(TnTooltipDirective);
    const tooltip = tooltips.find((tip) => String(tip.message) === 'This user is managed by a directory service and cannot be modified.');
    expect(tooltip).toBeTruthy();
  });

  it('does not show Delete button for an immutable user', async () => {
    spectator.setInput('user', { ...dummyUser, immutable: true });

    const deleteButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: /Delete/ }));
    expect(deleteButton).toBeNull();
  });

  it('does not show Delete button for logged in user', async () => {
    spectator.setInput('user', { ...dummyUser, username: 'root' });

    const deleteButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: /Delete/ }));
    expect(deleteButton).toBeNull();
  });

  it('shows disabled Delete button with tooltip for directory service users', async () => {
    spectator.setInput('user', { ...dummyUser, local: false });

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: /Delete/ }));
    expect(await deleteButton.isDisabled()).toBe(true);

    const tooltips = spectator.queryAll(TnTooltipDirective);
    const tooltip = tooltips.find((tip) => String(tip.message) === 'This user is managed by a directory service and cannot be modified.');
    expect(tooltip).toBeTruthy();
  });

  it('should open DeleteUserDialog when Delete button is pressed', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: /Delete/ }));
    await deleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DeleteUserDialog, {
      data: dummyUser,
    });
  });
});
