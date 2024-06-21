import {
  ChangeDetectionStrategy, Component, input, model,
} from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MSeriesModel } from 'app/constants/server-series.constant';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot,
} from 'app/interfaces/enclosure.interface';
import {
  EnclosureSideComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side/enclosure-side.component';
import { EnclosureSide, supportedEnclosures } from 'app/pages/system/enclosure/utils/supported-enclosures';

// TODO: Not properly supported in ng-mocks yet https://github.com/help-me-mom/ng-mocks/issues/8634
@Component({
  selector: 'ix-enclosure-svg',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EnclosureSvgStubComponent {
  readonly svgUrl = input.required<string>();
  readonly slots = input<DashboardEnclosureSlot[]>();
  readonly enableMouseEvents = input(true);
  readonly slotTintFn = input<(slot: DashboardEnclosureSlot) => string>();
  readonly selectedSlot = model<DashboardEnclosureSlot | null>(null);
}

describe('EnclosureSideComponent', () => {
  let spectator: Spectator<EnclosureSideComponent>;
  const createComponent = createComponentFactory({
    component: EnclosureSideComponent,
    declarations: [
      MockComponent(EnclosureSvgStubComponent),
    ],
  });

  const props = {
    enableMouseEvents: true,
    slotTintFn: jest.fn(),
    enclosure: {
      id: 'enclosure-id',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          1: { drive_bay_number: 1 } as DashboardEnclosureSlot,
          2: { drive_bay_number: 2 } as DashboardEnclosureSlot,
        },
      } as DashboardEnclosureElements,
      model: MSeriesModel.M40,
    } as DashboardEnclosure,
    selectedSlot: { drive_bay_number: 1 } as DashboardEnclosureSlot,
    side: EnclosureSide.Rear,
  };

  beforeEach(() => {
    spectator = createComponent({ props });
  });

  it('renders an svg component with correct svg url and passes input properties', () => {
    const svg = spectator.query(EnclosureSvgStubComponent);
    expect(svg).toExist();
    expect(svg.selectedSlot).toBe(props.selectedSlot);
    expect(svg.slotTintFn).toBe(props.slotTintFn);
    expect(svg.enableMouseEvents).toBe(props.enableMouseEvents);
    expect(svg.slots).toEqual(Object.values(props.enclosure.elements[EnclosureElementType.ArrayDeviceSlot]));
    expect(svg.svgUrl).toBe(supportedEnclosures[props.enclosure.model][props.side]);
  });

  it('automatically selects Front or Top enclosure based on what is available when side is undefined', () => {
    spectator.setInput('side', undefined);

    const svg = spectator.query(EnclosureSvgStubComponent);
    expect(svg.svgUrl).toBe(supportedEnclosures[props.enclosure.model][EnclosureSide.Front]);
  });
});
