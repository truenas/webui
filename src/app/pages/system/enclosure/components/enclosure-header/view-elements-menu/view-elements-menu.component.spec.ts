import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import {
  createRoutingFactory,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { ViewElementsMenuComponent } from 'app/pages/system/enclosure/components/enclosure-header/view-elements-menu/view-elements-menu.component';

describe('ViewElementsMenuComponent', () => {
  let spectator: SpectatorRouting<ViewElementsMenuComponent>;
  let loader: HarnessLoader;
  const createComponent = createRoutingFactory({
    component: ViewElementsMenuComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        enclosure: {
          id: 'enclosure-id',
          elements: {
            [EnclosureElementType.ArrayDeviceSlot]: {},
            [EnclosureElementType.Cooling]: {},
            [EnclosureElementType.VoltageSensor]: {},
            [EnclosureElementType.PowerSupply]: {},
          },
        } as DashboardEnclosure,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('show a menu with available elements', async () => {
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();

    expect(menu).toExist();

    const items = await menu.getItems();
    expect(items).toHaveLength(4);
    expect(await items[0].getText()).toBe('Disks');
    expect(await items[1].getText()).toBe('Cooling');
    expect(await items[2].getText()).toBe('Voltage');
    expect(await items[3].getText()).toBe('Power Supply');
  });

  it('takes user to a root of enclosure page when Disks is selected', async () => {
    const router = spectator.inject(Router);
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();

    const items = await menu.getItems();
    await items[0].click();

    expect(router.navigate).toHaveBeenCalledWith(['/system/viewenclosure', 'enclosure-id']);
  });

  it('takes user to a corresponding elements view when other items are selected', async () => {
    const router = spectator.inject(Router);
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();

    const items = await menu.getItems();
    await items[1].click();

    expect(router.navigate).toHaveBeenCalledWith(['/system/viewenclosure', 'enclosure-id', 'Cooling']);
  });
});
