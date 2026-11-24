import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnMenuHarness, TnMenuTesting, TnMenuTriggerDirective,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { App } from 'app/interfaces/app.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { InstalledAppsListBulkActionsComponent } from './installed-apps-list-bulk-actions.component';

describe('InstalledAppsListBulkActionsComponent', () => {
  let spectator: Spectator<InstalledAppsListBulkActionsComponent>;
  let loader: HarnessLoader;

  const checkedAppsMock = [
    { id: 'ix-app-1', state: AppState.Running, upgrade_available: true },
    { id: 'ix-app-2', state: AppState.Stopped },
  ] as App[];

  const createComponent = createComponentFactory({
    component: InstalledAppsListBulkActionsComponent,
    providers: [
      mockAuth(),
    ],
  });

  async function openMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Select action' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(() => {
    spectator = createComponent({
      props: {
        checkedApps: checkedAppsMock,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('displays the correct count of selected instances', () => {
    const selectedCount = spectator.query('.bulk-selected span:first-child');
    expect(selectedCount).toHaveText(String(checkedAppsMock.length));
  });

  it('emits bulkStart after actions', async () => {
    const startSpy = jest.spyOn(spectator.component.bulkStart, 'emit');

    const menu = await openMenu();
    await menu.clickItem({ label: 'Start All Selected' });

    expect(startSpy).toHaveBeenCalled();
  });

  it('emits bulkStop after actions', async () => {
    const stopSpy = jest.spyOn(spectator.component.bulkStop, 'emit');

    const menu = await openMenu();
    await menu.clickItem({ label: 'Stop All Selected' });

    expect(stopSpy).toHaveBeenCalled();
  });

  it('emits bulkUpdate after actions', async () => {
    const updateSpy = jest.spyOn(spectator.component.bulkUpdate, 'emit');

    const menu = await openMenu();
    await menu.clickItem({ label: 'Update All Selected' });

    expect(updateSpy).toHaveBeenCalled();
  });

  it('emits bulkDelete after actions', async () => {
    const deleteSpy = jest.spyOn(spectator.component.bulkDelete, 'emit');

    const menu = await openMenu();
    await menu.clickItem({ label: 'Delete All Selected' });

    expect(deleteSpy).toHaveBeenCalled();
  });

  it('disables the menu items for a user without the Apps Write role', async () => {
    spectator = createComponent({
      props: { checkedApps: checkedAppsMock },
      detectChanges: false,
    });
    jest.spyOn(spectator.inject(AuthService), 'hasRole').mockReturnValue(of(false));
    spectator.detectChanges();

    // The trigger is role-locked too, so a click cannot open the menu; open it directly.
    spectator.query(TnMenuTriggerDirective)!.openMenu();
    const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);

    expect(await menu.isItemDisabled({ label: 'Start All Selected' })).toBe(true);
    expect(await menu.isItemDisabled({ label: 'Stop All Selected' })).toBe(true);
    expect(await menu.isItemDisabled({ label: 'Update All Selected' })).toBe(true);
    expect(await menu.isItemDisabled({ label: 'Delete All Selected' })).toBe(true);
  });
});
