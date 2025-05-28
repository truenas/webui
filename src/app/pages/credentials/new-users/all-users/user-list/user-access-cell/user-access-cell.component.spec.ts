import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { User } from '@sentry/angular';
import { Role } from 'app/enums/role.enum';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { mockUsers } from 'app/pages/credentials/new-users/all-users/testing/mock-user-api-data-provider';
import { UserAccessCellComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-access-cell/user-access-cell.component';

describe('UserAccessCellComponent', () => {
  let spectator: Spectator<UserAccessCellComponent>;
  let loader: HarnessLoader;

  const mockUser = mockUsers[0];

  const createComponent = createComponentFactory({
    component: UserAccessCellComponent,
  });

  function setupTest(user: User): void {
    spectator = createComponent({
      props: { user },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('shows "Full Admin" when user has full admin role', async () => {
    setupTest({
      roles: [Role.FullAdmin],
    });
    expect(await loader.getHarness(IxIconHarness.with({ name: 'ix-truenas-logo-mark' }))).toBeTruthy();
    expect(spectator.query('span')!.textContent).toBe('Full Admin');
  });

  it('checks SMB icon', async () => {
    setupTest({ ...mockUser, smb: true });

    expect(await loader.getHarness(IxIconHarness.with({ name: 'ix-smb-share' }))).toBeTruthy();
  });

  it('checks 2FA icon when user has configured', async () => {
    setupTest({ ...mockUser, twofactor_auth_configured: true });

    expect(await loader.getHarness(IxIconHarness.with({ name: 'mdi-cellphone-lock' }))).toBeTruthy();
  });

  it('checks ssh icon', async () => {
    setupTest({ ...mockUser, ssh_password_enabled: true });

    expect(await loader.getHarness(IxIconHarness.with({ name: 'mdi-ssh' }))).toBeTruthy();
  });

  it('checks when everything is enabled', () => {
    setupTest({
      ...mockUser,
      smb: true,
      ssh_password_enabled: true,
      twofactor_auth_configured: true,
      roles: [Role.FullAdmin],
    });

    expect(spectator.queryAll('ix-icon')).toHaveLength(4);
    expect(spectator.query('span')!.textContent).toBe('Full Admin');
  });
});
