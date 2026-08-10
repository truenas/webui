import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import {
  EnclosureSideSwitchComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side-switch/enclosure-side-switch.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

describe('EnclosureSideSwitchComponent', () => {
  let spectator: Spectator<EnclosureSideSwitchComponent>;
  let loader: HarnessLoader;
  let hasMoreThanOneSide: boolean;

  const createComponent = createComponentFactory({
    component: EnclosureSideSwitchComponent,
    providers: [
      mockProvider(EnclosureStore, {
        selectSide: jest.fn(),
        hasMoreThanOneSide: () => hasMoreThanOneSide,
      }),
    ],
  });

  /**
   * `hasMoreThanOneSide` is read once at render time, so it has to be set before the
   * component is created rather than flipped between tests.
   */
  function setup(enclosure: Partial<DashboardEnclosure>, moreThanOneSide = true): void {
    hasMoreThanOneSide = moreThanOneSide;
    spectator = createComponent({ props: { enclosure: enclosure as DashboardEnclosure } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('does not show side buttons if there is only one side in enclosure', async () => {
    setup({ front_loaded: true }, false);

    expect(await loader.getAllHarnesses(TnButtonHarness)).toHaveLength(0);
  });

  it('shows button for Front when there is a front side and another one', async () => {
    setup({ front_loaded: true, rear_slots: 2 });

    const buttons = await loader.getAllHarnesses(TnButtonHarness);
    expect(buttons).toHaveLength(2);
    expect(await buttons[0].getLabel()).toBe('Front');

    await buttons[0].click();

    expect(spectator.inject(EnclosureStore).selectSide).toHaveBeenCalledWith(EnclosureSide.Front);
  });

  it('shows button for Top when there is a top side and another one', async () => {
    setup({ top_loaded: true, rear_slots: 2 });

    const buttons = await loader.getAllHarnesses(TnButtonHarness);
    expect(buttons).toHaveLength(2);
    expect(await buttons[0].getLabel()).toBe('Top');

    await buttons[0].click();

    expect(spectator.inject(EnclosureStore).selectSide).toHaveBeenCalledWith(EnclosureSide.Top);
  });

  it('shows button for Rear when there is a rear side and another one', async () => {
    setup({ rear_slots: 1, internal_slots: 2 });

    const buttons = await loader.getAllHarnesses(TnButtonHarness);
    expect(buttons).toHaveLength(2);
    expect(await buttons[0].getLabel()).toBe('Rear');

    await buttons[0].click();

    expect(spectator.inject(EnclosureStore).selectSide).toHaveBeenCalledWith(EnclosureSide.Rear);
  });

  it('shows button for Internal when there is an internal side and another one', async () => {
    setup({ internal_slots: 1, rear_slots: 2 });

    const buttons = await loader.getAllHarnesses(TnButtonHarness);
    expect(buttons).toHaveLength(2);
    expect(await buttons[1].getLabel()).toBe('Internal');

    await buttons[1].click();

    expect(spectator.inject(EnclosureStore).selectSide).toHaveBeenCalledWith(EnclosureSide.Internal);
  });
});
