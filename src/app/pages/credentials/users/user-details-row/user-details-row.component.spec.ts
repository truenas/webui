import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxTableExpandableRowComponent,
} from 'app/modules/ix-table/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { OneTimePasswordCreatedDialogComponent } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';
import {
  DeleteUserDialogComponent,
} from 'app/pages/credentials/users/user-details-row/delete-user-dialog/delete-user-dialog.component';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { UserDetailsRowComponent } from './user-details-row.component';

const dummyUser = {
  id: 1,
  uid: 0,
  username: 'test-user',
  smbhash: '',
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

describe('UserDetailsRowComponent', () => {
  let spectator: Spectator<UserDetailsRowComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: UserDetailsRowComponent,
    imports: [
      IxTableExpandableRowComponent,
      UserFormComponent,
    ],
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('auth.generate_onetime_password', 'test-password'),
        mockCall('user.delete'),
        mockCall('system.security.config', {
          enable_gpos_stig: false,
        } as SystemSecurityConfig),
        mockCall('group.query', []),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockAuth(),
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
        user: dummyUser,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('should open edit user form', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: /Edit/ }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      UserFormComponent,
      { wide: true, data: dummyUser },
    );
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

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeleteUserDialogComponent, {
      data: dummyUser,
    });
  });

  it('navigates to audit logs page when Audit Logs button is pressed', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));

    const auditButton = await loader.getHarness(MatButtonHarness.with({ text: /Audit Logs/ }));
    await auditButton.click();

    expect(router.navigateByUrl).toHaveBeenCalledWith(
      '/system/audit/{"searchQuery":{"isBasicQuery":false,"filters":[["username","=","test-user"]]}}',
    );
  });

  it('generates Generate One-Time Password when Generate One-Time Password button is pressed', async () => {
    spectator.component.isStigMode.set(true);

    const button = await loader.getHarness(MatButtonHarness.with({ text: /Generate One-Time Password/ }));
    await button.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Generate One-Time Password',
        message: 'Are you sure you want to generate a one-time password for "test-user" user?',
        hideCheckbox: true,
      }),
    );

    expect(api.call).toHaveBeenCalledWith('auth.generate_onetime_password', [{ username: 'test-user' }]);

    expect(spectator.inject(MatDialog).open).toHaveBeenLastCalledWith(OneTimePasswordCreatedDialogComponent, {
      data: 'test-password',
    });
  });
});
