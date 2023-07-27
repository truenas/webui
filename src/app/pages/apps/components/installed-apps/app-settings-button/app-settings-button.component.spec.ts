import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { KubernetesSettingsComponent } from 'app/pages/apps/components/installed-apps/kubernetes-settings/kubernetes-settings.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('AppSettingsButtonComponent', () => {
  let spectator: Spectator<AppSettingsButtonComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;

  const createComponent = createComponentFactory({
    component: AppSettingsButtonComponent,
    providers: [
      mockProvider(MatDialog),
      mockProvider(IxSlideInService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(ApplicationsService, {
        getKubernetesConfig: jest.fn(() => of({})),
      }),
      mockProvider(KubernetesStore, {
        selectedPool$: of('pool'),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
  });

  it('shows Choose Pool modal once Settings button -> Choose Pool clicked', async () => {
    const matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();

    await menu.open();
    await menu.clickItem({ text: 'Choose Pool' });

    expect(matDialog.open).toHaveBeenCalledWith(SelectPoolDialogComponent);
  });

  it('shows Advanced Settings slide once Settings button -> Advanced Settings clicked', async () => {
    await menu.open();
    await menu.clickItem({ text: 'Advanced Settings' });

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(KubernetesSettingsComponent);
  });

  it('shows Unset Pool modal once Settings button -> Unset Pool clicked', async () => {
    await menu.open();
    await menu.clickItem({ text: 'Unset Pool' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Confirm to unset pool?',
    }));
  });
});
