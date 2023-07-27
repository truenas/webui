import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import {
  ManageConfigurationMenuComponent,
} from 'app/pages/system/general-settings/manage-configuration-menu/manage-configuration-menu.component';
import {
  SaveConfigDialogComponent,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import {
  UploadConfigDialogComponent,
} from 'app/pages/system/general-settings/upload-config-dialog/upload-config-dialog.component';
import { DialogService } from 'app/services/dialog.service';

describe('ManageConfigurationMenuComponent', () => {
  let spectator: Spectator<ManageConfigurationMenuComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
  const createComponent = createComponentFactory({
    component: ManageConfigurationMenuComponent,
    providers: [
      mockProvider(Router),
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

  it('redirects to reset config page with confirmation when Reset to Defaults is pressed', async () => {
    await menu.open();
    await menu.clickItem({ text: 'Reset to Defaults' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/others/config-reset'], { skipLocationChange: true });
  });
});
