import {
  ChangeDetectionStrategy, Component, input, model,
} from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot,
} from 'app/interfaces/enclosure.interface';
import {
  EnclosureSideComponent,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-side.component';
import {
  EnclosureSvgComponent,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import {
  NotSupportedModelComponent,
} from 'app/pages/system/enclosure/components/enclosure-side/not-supported-model/not-supported-model.component';
import { EnclosureSide, supportedEnclosures } from 'app/pages/system/enclosure/utils/supported-enclosures';

// TODO: Not properly supported in ng-mocks yet https://github.com/help-me-mom/ng-mocks/issues/8634
@Component({
  selector: 'ix-enclosure-svg',
  template: '',
  standalone: true,
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
    imports: [
      MockComponent(NotSupportedModelComponent),
    ],
    overrideComponents: [
      [
        EnclosureSideComponent,
        {
          remove: { imports: [EnclosureSvgComponent] },
          add: { imports: [EnclosureSvgStubComponent] },
        },
      ],
    ],
  });

  const props = {
    enableMouseEvents: true,
    slotTintFn: jest.fn(),
    enclosure: {
      id: 'enclosure-id',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          1: { drive_bay_number: 1, is_rear: true } as DashboardEnclosureSlot,
          2: { drive_bay_number: 2, is_rear: true } as DashboardEnclosureSlot,
          3: { drive_bay_number: 3, is_front: true } as DashboardEnclosureSlot,
        },
      } as DashboardEnclosureElements,
      model: EnclosureModel.M40,
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
    expect(svg.selectedSlot()).toBe(props.selectedSlot);
    expect(svg.slotTintFn()).toBe(props.slotTintFn);
    expect(svg.enableMouseEvents()).toBe(props.enableMouseEvents);
    expect(svg.slots())
      .toEqual(Object.values(props.enclosure.elements[EnclosureElementType.ArrayDeviceSlot]).slice(0, 2));
    expect(svg.svgUrl()).toBe(supportedEnclosures[props.enclosure.model][props.side]);
  });

  it('automatically selects Front or Top enclosure based on what is available when side is undefined', () => {
    spectator.setInput('side', undefined);

    const svg = spectator.query(EnclosureSvgStubComponent);
    expect(svg.svgUrl()).toBe(supportedEnclosures[props.enclosure.model][EnclosureSide.Front]);
  });

  it('renders Not supported model component when svg url is not available', () => {
    spectator.setInput('enclosure', {
      ...props.enclosure,
      model: 'fake-model',
    });

    const notSupportedModel = spectator.query(NotSupportedModelComponent);
    expect(notSupportedModel).toExist();
    expect(notSupportedModel.model).toBe('fake-model');
  });
});
