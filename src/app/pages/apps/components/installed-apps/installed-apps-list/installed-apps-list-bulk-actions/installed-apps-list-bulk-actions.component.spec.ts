import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { App } from 'app/interfaces/app.interface';
import { InstalledAppsListBulkActionsComponent } from './installed-apps-list-bulk-actions.component';

describe('InstalledAppsListBulkActionsComponent', () => {
  let spectator: Spectator<InstalledAppsListBulkActionsComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;

  const checkedAppsMock = [
    { id: 'ix-app-1', state: AppState.Running, upgrade_available: true },
    { id: 'ix-app-2', state: AppState.Stopped },
  ] as App[];

  const createComponent = createComponentFactory({
    component: InstalledAppsListBulkActionsComponent,
    imports: [MatMenuModule],
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        checkedApps: checkedAppsMock,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
  });

  it('displays the correct count of selected instances', () => {
    const selectedCount = spectator.query('.bulk-selected span:first-child');
    expect(selectedCount).toHaveText(String(checkedAppsMock.length));
  });

  it('emits bulkStart after actions', async () => {
    const startSpy = jest.spyOn(spectator.component.bulkStart, 'emit');

    await menu.open();
    await menu.clickItem({ text: 'Start All Selected' });

    expect(startSpy).toHaveBeenCalled();
  });

  it('emits bulkStop after actions', async () => {
    const stopSpy = jest.spyOn(spectator.component.bulkStop, 'emit');

    await menu.open();
    await menu.clickItem({ text: 'Stop All Selected' });

    expect(stopSpy).toHaveBeenCalled();
  });

  it('emits bulkUpgrade after actions', async () => {
    const upgradeSpy = jest.spyOn(spectator.component.bulkUpgrade, 'emit');

    await menu.open();
    await menu.clickItem({ text: 'Upgrade All Selected' });

    expect(upgradeSpy).toHaveBeenCalled();
  });

  it('emits bulkDelete after actions', async () => {
    const deleteSpy = jest.spyOn(spectator.component.bulkDelete, 'emit');

    await menu.open();
    await menu.clickItem({ text: 'Delete All Selected' });

    expect(deleteSpy).toHaveBeenCalled();
  });
});
