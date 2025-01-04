import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  ManageConfigurationMenuComponent,
} from 'app/pages/system/general-settings/manage-configuration-menu/manage-configuration-menu.component';
import {
  SaveConfigDialogComponent,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import {
  UploadConfigDialogComponent,
} from 'app/pages/system/general-settings/upload-config-dialog/upload-config-dialog.component';

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
    const matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();

    await menu.open();
    await menu.clickItem({ text: 'Download File' });

    expect(matDialog.open).toHaveBeenCalledWith(SaveConfigDialogComponent);
  });

  it('opens UploadConfigDialogComponent when Upload File is pressed', async () => {
    const matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();

    await menu.open();
    await menu.clickItem({ text: 'Upload File' });

    expect(matDialog.open).toHaveBeenCalledWith(UploadConfigDialogComponent);
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
