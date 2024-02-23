import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AboutDialogComponent } from 'app/modules/layout/components/topbar/about-dialog/about-dialog.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/topbar/change-password-dialog/change-password-dialog.component';
import { UserMenuComponent } from 'app/modules/layout/components/topbar/user-menu/user-menu.component';

describe('UserMenuComponent', () => {
  let spectator: Spectator<UserMenuComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
  const createComponent = createComponentFactory({
    component: UserMenuComponent,
    declarations: [
      MockComponent(IxIconComponent),
    ],
    providers: [
      mockProvider(MatDialog),
      mockAuth(),
      mockWebSocket(),
    ],
  });

  describe('closed menu', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
    });

    it('should display correct username to the left of user icon in top bar', () => {
      const button = spectator.query('button');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('root');
    });
  });

  describe('opened menu', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
    });

    it('has a Change Password menu item if logged in user has { local: true } that opens ChangePasswordDialogComponent when opened', async () => {
      const changePassword = await menu.getItems({ text: /Change Password$/ });
      await changePassword[0].click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ChangePasswordDialogComponent);
    });

    it('has an API Keys menu item that takes user to list of API Keys', async () => {
      const apiKeys = await menu.getItems({ text: /API Keys$/ });
      const apiKeysElement = await apiKeys[0].host();

      expect(await apiKeysElement.getAttribute('href')).toBe('/apikeys');
    });

    it('has a Guide menu item that opens user guide', async () => {
      const guide = await menu.getItems({ text: /Guide$/ });
      const guideElement = await guide[0].host();

      expect(await guideElement.getAttribute('href')).toBe('https://www.truenas.com/docs/');
      expect(await guideElement.getAttribute('target')).toBe('_blank');
    });

    it('has an About menu item that opens AboutDialogComponent when clicked', async () => {
      const about = await menu.getItems({ text: /About$/ });
      await about[0].click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AboutDialogComponent, {
        disableClose: true,
      });
    });

    it('has an 2fa menu item that redirects user to TwoFactorComponent when clicked', async () => {
      const twofa = await menu.getItems({ text: 'Two-Factor Authentication' });
      const router = spectator.inject(Router);
      jest.spyOn(router, 'navigate');
      await twofa[0].click();
      expect(router.navigate).toHaveBeenCalledWith(['/two-factor-auth']);
    });
  });
});
