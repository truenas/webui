import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTriggerDirective,
} from '@truenas/ui-components';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  ManageConfigurationMenuComponent,
} from 'app/pages/system/advanced/manage-configuration-menu/manage-configuration-menu.component';
import {
  SaveConfigDialog,
} from 'app/pages/system/advanced/manage-configuration-menu/save-config-dialog/save-config-dialog.component';
import {
  UploadConfigDialog,
} from 'app/pages/system/advanced/manage-configuration-menu/upload-config-dialog/upload-config-dialog.component';

describe('ManageConfigurationMenuComponent', () => {
  let spectator: Spectator<ManageConfigurationMenuComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let isFullAdmin: boolean;
  const isSysAdmin$ = new BehaviorSubject(true);

  async function openMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Manage Configuration' }));
    await trigger.click();
    return rootLoader.getHarness(TnMenuHarness);
  }
  const createComponent = createComponentFactory({
    component: ManageConfigurationMenuComponent,
    providers: [
      mockProvider(Router),
      mockProvider(AuthService, {
        isSysAdmin$,
        hasRole: jest.fn(() => of(isFullAdmin)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  function setup(fullAdmin = true): void {
    isFullAdmin = fullAdmin;
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
  }

  beforeEach(() => isSysAdmin$.next(true));

  it('opens SaveConfigDialogComponent when Download File is pressed', async () => {
    setup();
    const tnDialog = spectator.inject(TnDialog);
    jest.spyOn(tnDialog, 'open').mockImplementation();

    const menu = await openMenu();
    await menu.clickItem({ label: 'Download File' });

    expect(tnDialog.open).toHaveBeenCalledWith(SaveConfigDialog);
  });

  it('opens UploadConfigDialogComponent when Upload File is pressed', async () => {
    setup();
    const tnDialog = spectator.inject(TnDialog);
    jest.spyOn(tnDialog, 'open').mockImplementation();

    const menu = await openMenu();
    await menu.clickItem({ label: 'Upload File' });

    expect(tnDialog.open).toHaveBeenCalledWith(UploadConfigDialog);
  });

  describe('if logged user is a system administrator', () => {
    it('redirects to reset config page with confirmation when Reset to Defaults is pressed', async () => {
      setup();
      const menu = await openMenu();
      await menu.clickItem({ label: 'Reset to Defaults' });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/config-reset'], { skipLocationChange: true });
    });
  });

  it('does not show Reset to Defaults menu item if logged in user is not a system administrator', async () => {
    setup();
    isSysAdmin$.next(false);

    const menu = await openMenu();

    expect(await menu.getItemLabels()).not.toContain('Reset to Defaults');
  });

  it('enables the menu items for a user with the Full Admin role', async () => {
    setup();
    const menu = await openMenu();

    expect(await menu.isItemDisabled({ label: 'Download File' })).toBe(false);
    expect(await menu.isItemDisabled({ label: 'Upload File' })).toBe(false);
    expect(await menu.isItemDisabled({ label: 'Reset to Defaults' })).toBe(false);
  });

  it('disables the menu items for a user without the Full Admin role', async () => {
    setup(false);
    // The trigger is role-locked too, so a click cannot open the menu; open it directly.
    spectator.query(TnMenuTriggerDirective)!.openMenu();
    const menu = await rootLoader.getHarness(TnMenuHarness);

    expect(await menu.isItemDisabled({ label: 'Download File' })).toBe(true);
    expect(await menu.isItemDisabled({ label: 'Upload File' })).toBe(true);
    expect(await menu.isItemDisabled({ label: 'Reset to Defaults' })).toBe(true);
  });
});
