import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import {
  TnDialog, TnIconButtonHarness, TnMenuHarness, TnSpriteLoaderService,
} from '@truenas/ui-components';
import { BehaviorSubject, of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { dummyUser } from 'app/core/testing/utils/mock-auth.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import {
  ChangePasswordDialog,
} from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { UserMenuComponent } from 'app/modules/layout/topbar/user-menu/user-menu.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';

describe('UserMenuComponent', () => {
  let spectator: Spectator<UserMenuComponent>;
  let loader: HarnessLoader;
  let menu: TnMenuHarness;
  const globalTwoFactorConfig$ = new BehaviorSubject({ enabled: true } as GlobalTwoFactorConfig);

  const createComponent = createComponentFactory({
    component: UserMenuComponent,
    providers: [
      mockProvider(TnDialog),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockApi(),
      mockProvider(AuthService, {
        logout: jest.fn(() => of()),
        getGlobalTwoFactorConfig: jest.fn(() => globalTwoFactorConfig$),
        user$: of(dummyUser),
      }),
      mockProvider(Router),
      mockProvider(TnSpriteLoaderService, {
        ensureSpriteLoaded: jest.fn(() => Promise.resolve(true)),
        getIconUrl: jest.fn(),
        getSafeIconUrl: jest.fn(),
        isSpriteLoaded: jest.fn(() => true),
        getSpriteConfig: jest.fn(),
      }),
      {
        provide: WINDOW,
        useValue: {
          open: jest.fn(),
        },
      },
    ],
  });

  async function openMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'account-circle' }));
    await trigger.click();
    return TestbedHarnessEnvironment.documentRootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await openMenu();
  });

  it('should display correct username to the left of user icon in top bar', () => {
    const username = spectator.query('.username');
    expect(username).toBeTruthy();
    expect(username?.textContent).toContain('root');
  });

  describe('opened menu', () => {
    it('has a Change Password menu item if logged in user has { local: true } that opens ChangePasswordDialogComponent when opened', async () => {
      await menu.clickItem({ label: 'Change Password' });

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ChangePasswordDialog);
    });

    it('has a Preferences menu item that opens the preferences form', async () => {
      await menu.clickItem({ label: 'Preferences' });

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PreferencesFormComponent);
    });

    it('has an API Keys menu item that takes user to list of API Keys', async () => {
      await menu.clickItem({ label: 'My API Keys' });

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/credentials/users/api-keys'], {
        queryParams: { userName: 'root' },
      });
    });

    it('has a Guide menu item that opens user guide', async () => {
      await menu.clickItem({ label: 'Guide' });

      expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith('https://www.truenas.com/docs/', '_blank');
    });

    it('has a Log Out menu item that logs user out when pressed', async () => {
      await menu.clickItem({ label: 'Log Out' });

      expect(spectator.inject(AuthService).logout).toHaveBeenCalled();
    });

    describe('two factor authentication', () => {
      beforeEach(() => {
        globalTwoFactorConfig$.next({
          enabled: true,
        } as GlobalTwoFactorConfig);
      });

      it('does not show two factor authentication menu if it is not enabled globally', async () => {
        globalTwoFactorConfig$.next({
          enabled: false,
        } as GlobalTwoFactorConfig);
        spectator.detectChanges();

        const labels = await menu.getItemLabels();
        expect(labels).not.toContain('Two-Factor Authentication');
      });

      it('has an 2fa menu item that redirects user to TwoFactorComponent when clicked', async () => {
        await menu.clickItem({ label: 'Two-Factor Authentication' });

        expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/two-factor-auth']);
      });
    });
  });
});
