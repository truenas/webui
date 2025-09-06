import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { User } from 'app/interfaces/user.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
      IxIconComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
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
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: /Edit/ }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      UserFormComponent,
      { data: dummyUser },
    );
  });

  it('does not show Edit button for local users', async () => {
    spectator.setInput('user', { ...dummyUser, local: false });

    const editButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Edit' }));
    expect(editButton).toBeNull();
  });

  it('does not show Delete button for an immutable user', async () => {
    spectator.setInput('user', { ...dummyUser, immutable: true });

    const deleteButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: /Delete/ }));
    expect(deleteButton).toBeNull();
  });

  it('does not show Delete button for logged in user', async () => {
    spectator.setInput('user', { ...dummyUser, username: 'root' });

    const deleteButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: /Delete/ }));
    expect(deleteButton).toBeNull();
  });

  it('should open DeleteUserDialog when Delete button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: /Delete/ }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeleteUserDialog, {
      data: dummyUser,
    });
  });
});
