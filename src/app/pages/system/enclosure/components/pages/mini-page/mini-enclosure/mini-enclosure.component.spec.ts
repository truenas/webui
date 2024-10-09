import {
  ChangeDetectionStrategy, Component, input, model,
} from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { EnclosureElementType, EnclosureStatus } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot,
} from 'app/interfaces/enclosure.interface';
import { EnclosureSideComponent } from 'app/pages/system/enclosure/components/enclosure-side/enclosure-side.component';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import {
  MiniEnclosureComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-enclosure/mini-enclosure.component';
import {
  MiniSlotStatusComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-enclosure/mini-slot-status/mini-slot-status.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

// TODO: Not properly supported in ng-mocks yet https://github.com/help-me-mom/ng-mocks/issues/8634
@Component({
  selector: 'ix-enclosure-side',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EnclosureSideStubComponent {
  readonly enclosure = input.required<string>();
  readonly slotTintFn = input<TintingFunction[]>();
  readonly selectedSlot = model<DashboardEnclosureSlot | null>(null);
}

describe('MiniEnclosureComponent', () => {
  let spectator: Spectator<MiniEnclosureComponent>;
  const enclosure = {
    elements: {
      [EnclosureElementType.ArrayDeviceSlot]: {
        1: {
          dev: 'ada1',
          status: EnclosureStatus.Ok,
          is_front: true,
          drive_bay_number: 1,
        } as DashboardEnclosureSlot,
        2: {
          dev: 'ada2',
          status: EnclosureStatus.Crit,
          is_front: true,
          drive_bay_number: 2,
        } as DashboardEnclosureSlot,
        3: {
          dev: null,
          status: EnclosureStatus.Ok,
          is_front: true,
          drive_bay_number: 3,
        } as DashboardEnclosureSlot,
      },
    } as DashboardEnclosureElements,
  } as DashboardEnclosure;
  const createComponent = createComponentFactory({
    component: MiniEnclosureComponent,
    imports: [
      MockComponent(MiniSlotStatusComponent),
    ],
    overrideComponents: [
      [
        MiniEnclosureComponent,
        {
          remove: { imports: [EnclosureSideComponent] },
          add: { imports: [EnclosureSideStubComponent] },
        },
      ],
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: () => enclosure,
        selectedSlot: () => null as DashboardEnclosureSlot,
        poolColors: () => ({ 'pool-1': 'red', 'pool-2': 'blue' }),
        selectSlot: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders slots and their dev names or "Empty"', () => {
    const slots = spectator.query('.slots-and-numbers').children;
    expect(slots).toHaveLength(3);
    expect(slots[0]).toHaveText('1 ada1');
    expect(slots[1]).toHaveText('2 ada2');
    expect(slots[2]).toHaveText('3 Empty');
  });

  it('renders an enclosure graphic', () => {
    const enclosureComponent = spectator.query(EnclosureSideStubComponent);
    expect(enclosureComponent).toExist();
    expect(enclosureComponent.enclosure()).toBe(enclosure);
    expect(enclosureComponent.selectedSlot()).toBeNull();
  });

  it('shows disk statuses', () => {
    const slotStatuses = spectator.queryAll(MiniSlotStatusComponent);
    expect(slotStatuses).toHaveLength(3);
    expect(slotStatuses[0].slot).toBe(enclosure.elements[EnclosureElementType.ArrayDeviceSlot][1]);
  });

  it('selects a slot when it is clicked on in enclosure svg', () => {
    const enclosureComponent = spectator.query(EnclosureSideStubComponent);
    enclosureComponent.selectedSlot.set(enclosure.elements[EnclosureElementType.ArrayDeviceSlot][1]);

    expect(spectator.inject(EnclosureStore).selectSlot).toHaveBeenCalledWith(1);
  });
});
