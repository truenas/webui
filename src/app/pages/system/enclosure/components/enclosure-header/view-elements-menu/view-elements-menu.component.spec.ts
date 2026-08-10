import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import {
  createRoutingFactory,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { TnButtonHarness, TnMenuHarness } from '@truenas/ui-components';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { ViewElementsMenuComponent } from 'app/pages/system/enclosure/components/enclosure-header/view-elements-menu/view-elements-menu.component';

describe('ViewElementsMenuComponent', () => {
  let spectator: SpectatorRouting<ViewElementsMenuComponent>;
  let loader: HarnessLoader;
  // `tn-menu` renders its panel in an overlay attached to the document body,
  // so the panel harness has to come from the root loader, not the fixture.
  let rootLoader: HarnessLoader;
  const createComponent = createRoutingFactory({
    component: ViewElementsMenuComponent,
  });

  /** Opens the menu and returns a harness for the overlay panel. */
  async function openMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Elements' }));
    await trigger.click();

    return rootLoader.getHarness(TnMenuHarness);
  }

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
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
  });

  it('show a menu with available elements', async () => {
    const menu = await openMenu();

    expect(await menu.getItemLabels()).toEqual(['Disks', 'Cooling', 'Voltage', 'Power Supply']);
  });

  it('takes user to a root of enclosure page when Disks is selected', async () => {
    const router = spectator.inject(Router);
    const menu = await openMenu();

    await menu.clickItem({ label: 'Disks' });

    expect(router.navigate).toHaveBeenCalledWith(['/system/viewenclosure', 'enclosure-id']);
  });

  it('takes user to a corresponding elements view when other items are selected', async () => {
    const router = spectator.inject(Router);
    const menu = await openMenu();

    await menu.clickItem({ label: 'Cooling' });

    expect(router.navigate).toHaveBeenCalledWith(['/system/viewenclosure', 'enclosure-id', 'Cooling']);
  });
});
