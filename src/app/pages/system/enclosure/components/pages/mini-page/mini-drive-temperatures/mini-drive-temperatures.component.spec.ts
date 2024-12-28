import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { EnclosureElementType, EnclosureStatus } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot,
} from 'app/interfaces/enclosure.interface';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { MiniDriveTemperaturesComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-temperatures/mini-drive-temperatures.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';

describe('MiniDriveTemperaturesComponent', () => {
  let spectator: Spectator<MiniDriveTemperaturesComponent>;
  const enclosure = {
    elements: {
      [EnclosureElementType.ArrayDeviceSlot]: {
        1: {
          dev: 'ada1',
          status: EnclosureStatus.Ok,
          is_front: true,
        } as DashboardEnclosureSlot,
        2: {
          dev: 'ada2',
          status: EnclosureStatus.Crit,
          is_front: true,
        } as DashboardEnclosureSlot,
        3: {
          dev: null,
          status: EnclosureStatus.Ok,
          is_front: true,
        } as DashboardEnclosureSlot,
      },
    } as DashboardEnclosureElements,
  } as DashboardEnclosure;
  const createComponent = createComponentFactory({
    component: MiniDriveTemperaturesComponent,
    imports: [
      TooltipComponent,
      OrNotAvailablePipe,
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: () => enclosure,
        selectedSlot: () => null as DashboardEnclosureSlot | null,
        selectSlot: jest.fn(),
      }),
      mockProvider(DiskTemperatureService, {
        getTemperature: () => of({ ada1: 37 }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders lines with temperature values', () => {
    const lines = spectator.queryAll('.disk');
    expect(lines).toHaveLength(2);

    const contents = lines.map((line) => {
      return {
        label: line.querySelector('.dev')!.textContent!.trim(),
        temperature: line.querySelector('.temperature')!.textContent!.trim(),
        hideTooltip: !line.querySelector('ix-tooltip'),
      };
    });
    expect(contents).toEqual([
      { label: 'ada1:', temperature: '37 °C', hideTooltip: true },
      { label: 'ada2:', temperature: 'N/A', hideTooltip: false },
    ]);
  });
});
