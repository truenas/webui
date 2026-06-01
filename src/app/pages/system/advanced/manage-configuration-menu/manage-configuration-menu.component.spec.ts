import { HarnessLoader } from '@angular/cdk/testing';
import { TnDialog } from '@truenas/ui-components';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
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
  let menu: MatMenuHarness;
  const isSysAdmin$ = new BehaviorSubject(true);
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

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
  });

  it('opens SaveConfigDialogComponent when Download File is pressed', async () => {
    const tnDialog = spectator.inject(TnDialog);
    jest.spyOn(tnDialog, 'open').mockImplementation();

    await menu.open();
    await menu.clickItem({ text: 'Download File' });

    expect(tnDialog.open).toHaveBeenCalledWith(SaveConfigDialog);
  });

  it('opens UploadConfigDialogComponent when Upload File is pressed', async () => {
    const tnDialog = spectator.inject(TnDialog);
    jest.spyOn(tnDialog, 'open').mockImplementation();

    await menu.open();
    await menu.clickItem({ text: 'Upload File' });

    expect(tnDialog.open).toHaveBeenCalledWith(UploadConfigDialog);
  });

  describe('if logged user is a system administrator', () => {
    it('redirects to reset config page with confirmation when Reset to Defaults is pressed', async () => {
      await menu.open();
      await menu.clickItem({ text: 'Reset to Defaults' });

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/config-reset'], { skipLocationChange: true });
    });
  });

  it('does not show Reset to Defaults menu item if logged in user is not a system administrator', async () => {
    isSysAdmin$.next(false);

    await menu.open();
    const resetToDefaults = await menu.getItems({ text: 'Reset to Defaults' });

    expect(resetToDefaults).toHaveLength(0);
  });
});
