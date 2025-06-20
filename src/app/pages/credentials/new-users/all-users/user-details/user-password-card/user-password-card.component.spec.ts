import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserPasswordCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-password-card/user-password-card.component';
import { OneTimePasswordCreatedDialog } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';

const user = {
  uid: 2937,
  username: 'test-user',
  password_age: 1,
  password_history: [],
  password_change_required: false,
  last_password_change: {
    $date: 1697030400000,
  },
} as User;

describe('UserPasswordCardComponent', () => {
  let spectator: Spectator<UserPasswordCardComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: UserPasswordCardComponent,
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('auth.generate_onetime_password', 'test-password'),
        mockCall('system.security.config', {
          enable_gpos_stig: false,
        } as SystemSecurityConfig),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockAuth(),
    ],
  });

  function getRows(): Record<string, string> {
    return spectator.queryAll('.row').reduce((acc, item: HTMLElement) => {
      const labelElement = item.querySelector('.label');
      const valueElement = item.querySelector('.value');

      if (!labelElement) return acc;

      const key = labelElement.textContent || '';
      const value = valueElement?.textContent?.trim() || '';

      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  beforeEach(() => {
    spectator = createComponent({
      props: { user },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Password');
  });

  it('shows password details when no change is required', () => {
    const rows = getRows();
    expect(rows).toEqual({
      'Age:': '1 day',
      'Last Change:': '2023-10-11 16:20:00',
    });
  });

  it('shows password details when change password is required', () => {
    spectator.setInput({
      user: {
        ...user,
        password_change_required: true,
        password_age: 4,
        password_history: [1, 2, 3, 4],
        last_password_change: {
          $date: 1697030400000,
        },
      },
    });

    const rows = getRows();
    expect(rows).toEqual({
      'Password change is required:': '',
      'History:': '4 entries',
      'Age:': '4 days',
      'Last Change:': '2023-10-11 16:20:00',
    });
  });

  it('generates Generate One-Time Password when Generate One-Time Password button is pressed', async () => {
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

    expect(spectator.inject(MatDialog).open).toHaveBeenLastCalledWith(OneTimePasswordCreatedDialog, {
      data: 'test-password',
    });
  });
});
