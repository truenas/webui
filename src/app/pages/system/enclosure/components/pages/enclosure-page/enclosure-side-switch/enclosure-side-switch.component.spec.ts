import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import {
  EnclosureSideSwitchComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side-switch/enclosure-side-switch.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

describe('EnclosureSideSwitchComponent', () => {
  let spectator: Spectator<EnclosureSideSwitchComponent>;
  let hasMoreThanOneSide = false;

  const createComponent = createComponentFactory({
    component: EnclosureSideSwitchComponent,
    providers: [
      mockProvider(EnclosureStore, {
        selectSide: jest.fn(),
        hasMoreThanOneSide: () => hasMoreThanOneSide,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        enclosure: {
          front_loaded: true,
        } as DashboardEnclosure,
      },
    });
  });

  it('does not show side buttons if there is only one side in enclosure', () => {
    expect(spectator.query('button')).toBeNull();
    hasMoreThanOneSide = true;
  });

  it('shows button for Front when there is a front side and another one', () => {
    spectator.setInput('enclosure', {
      front_loaded: true,
      rear_slots: 2,
    } as DashboardEnclosure);

    const buttons = spectator.queryAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveText('Front');

    spectator.click(buttons[0]);

    expect(spectator.inject(EnclosureStore).selectSide).toHaveBeenCalledWith(EnclosureSide.Front);
  });

  it('shows button for Top when there is a top side and another one', () => {
    spectator.setInput('enclosure', {
      top_loaded: true,
      rear_slots: 2,
    } as DashboardEnclosure);

    const buttons = spectator.queryAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveText('Top');

    spectator.click(buttons[0]);

    expect(spectator.inject(EnclosureStore).selectSide).toHaveBeenCalledWith(EnclosureSide.Top);
  });

  it('shows button for Rear when there is a rear side and another one', () => {
    spectator.setInput('enclosure', {
      rear_slots: 1,
      internal_slots: 2,
    } as DashboardEnclosure);

    const buttons = spectator.queryAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveText('Rear');

    spectator.click(buttons[0]);

    expect(spectator.inject(EnclosureStore).selectSide).toHaveBeenCalledWith(EnclosureSide.Rear);
  });

  it('shows button for Internal when there is an internal side and another one', () => {
    spectator.setInput('enclosure', {
      internal_slots: 1,
      rear_slots: 2,
    } as DashboardEnclosure);

    const buttons = spectator.queryAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[1]).toHaveText('Internal');

    spectator.click(buttons[1]);

    expect(spectator.inject(EnclosureStore).selectSide).toHaveBeenCalledWith(EnclosureSide.Internal);
  });
});
