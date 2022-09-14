import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { AboutDialogComponent } from 'app/modules/common/dialog/about/about-dialog.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/change-password-dialog/change-password-dialog.component';
import { UserMenuComponent } from 'app/modules/layout/components/topbar/user-menu/user-menu.component';

describe('UserMenuComponent', () => {
  let spectator: Spectator<UserMenuComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
  const createComponent = createComponentFactory({
    component: UserMenuComponent,
    providers: [
      mockProvider(MatDialog),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
  });

  it('has a Change Password menu item that opens ChangePasswordDialogComponent when opened', async () => {
    const changePassword = await menu.getItems({ text: /Change Password$/ });
    await changePassword[0].click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ChangePasswordDialogComponent);
  });

  it('has an API Keys menu item that takes user to list of API Keys', async () => {
    const apiKeys = await menu.getItems({ text: /API Keys$/ });
    const apiKeysElement = await apiKeys[0].host();

    expect(await apiKeysElement.getAttribute('href')).toEqual('/apikeys');
  });

  it('has a Guide menu item that opens user guide', async () => {
    const guide = await menu.getItems({ text: /Guide$/ });
    const guideElement = await guide[0].host();

    expect(await guideElement.getAttribute('href')).toEqual('https://www.truenas.com/docs/');
    expect(await guideElement.getAttribute('target')).toEqual('_blank');
  });

  it('has an About menu item that opens AboutDialogComponent when clicked', async () => {
    const about = await menu.getItems({ text: /About$/ });
    await about[0].click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AboutDialogComponent, {
      disableClose: true,
    });
  });
});
