import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnMenuHarness } from '@truenas/ui-components';
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
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
  });

  it('opens SaveConfigDialogComponent when Download File is pressed', async () => {
    const tnDialog = spectator.inject(TnDialog);
    jest.spyOn(tnDialog, 'open').mockImplementation();

    const menu = await openMenu();
    await menu.clickItem({ label: 'Download File' });

    expect(tnDialog.open).toHaveBeenCalledWith(SaveConfigDialog);
  });

  it('opens UploadConfigDialogComponent when Upload File is pressed', async () => {
    const tnDialog = spectator.inject(TnDialog);
    jest.spyOn(tnDialog, 'open').mockImplementation();

    const menu = await openMenu();
    await menu.clickItem({ label: 'Upload File' });

    expect(tnDialog.open).toHaveBeenCalledWith(UploadConfigDialog);
  });

  describe('if logged user is a system administrator', () => {
    it('redirects to reset config page with confirmation when Reset to Defaults is pressed', async () => {
      const menu = await openMenu();
      await menu.clickItem({ label: 'Reset to Defaults' });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/config-reset'], { skipLocationChange: true });
    });
  });

  it('does not show Reset to Defaults menu item if logged in user is not a system administrator', async () => {
    isSysAdmin$.next(false);

    const menu = await openMenu();

    expect(await menu.getItemLabels()).not.toContain('Reset to Defaults');
  });
});
