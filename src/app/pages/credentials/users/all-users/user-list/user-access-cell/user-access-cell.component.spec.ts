import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { mockUsers } from 'app/pages/credentials/users/all-users/testing/mock-user-api-data-provider';
import { UserAccessCellComponent } from 'app/pages/credentials/users/all-users/user-list/user-access-cell/user-access-cell.component';

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
    setupTest(mockUser);
    expect(await loader.getHarness(TnIconHarness.with({ name: 'tn-truenas-logo-mark' }))).toBeTruthy();
    expect(spectator.query('span')!.textContent).toBe('Full Admin');
  });

  it('checks SMB icon', async () => {
    setupTest({ ...mockUser, smb: true });

    expect(await loader.getHarness(TnIconHarness.with({ name: 'tn-smb-share' }))).toBeTruthy();
  });

  it('checks WebShare icon', async () => {
    setupTest({ ...mockUser, webshare: true });

    expect(await loader.getHarness(TnIconHarness.with({ name: 'share-variant' }))).toBeTruthy();
  });

  it('checks ssh icon', async () => {
    setupTest({ ...mockUser, ssh_password_enabled: true });

    expect(await loader.getHarness(TnIconHarness.with({ name: 'ssh' }))).toBeTruthy();
  });

  it('shows API keys icon', async () => {
    setupTest({ ...mockUser, api_keys: [1] });

    expect(await loader.getHarness(TnIconHarness.with({ name: 'power-plug' }))).toBeTruthy();
  });

  it('checks when everything is enabled', () => {
    setupTest({
      ...mockUser,
      smb: true,
      webshare: true,
      ssh_password_enabled: true,
      api_keys: [1, 2],
      roles: [Role.FullAdmin],
    });

    expect(spectator.queryAll('tn-icon')).toHaveLength(5);
    expect(spectator.query('.user-roles > span')!.textContent).toBe('Full Admin');
  });
});
