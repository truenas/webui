import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import { KubernetesSettingsComponent } from 'app/pages/apps-old/kubernetes-settings/kubernetes-settings.component';
import { SelectPoolDialogComponent } from 'app/pages/apps-old/select-pool-dialog/select-pool-dialog.component';
import { AppsToolbarButtonsComponent } from 'app/pages/apps/components/available-apps/apps-toolbar-buttons/apps-toolbar-buttons.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('AppsToolbarButtonsComponent', () => {
  let spectator: Spectator<AppsToolbarButtonsComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;

  const createComponent = createComponentFactory({
    component: AppsToolbarButtonsComponent,
    providers: [
      mockProvider(MatDialog),
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      mockProvider(ApplicationsService, {
        getKubernetesConfig: jest.fn(() => of({})),
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
    spectator.component.wasPoolSet = true;

    await menu.open();
    await menu.clickItem({ text: 'Unset Pool' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Confirm to unset pool?',
    }));
  });

  it('shows Custom App button which will navigate to ix-chart install page', () => {
    const link = spectator.query('a[href="/apps/available/ix-chart/install"]');
    expect(link).toHaveText('Custom App');
  });
});
