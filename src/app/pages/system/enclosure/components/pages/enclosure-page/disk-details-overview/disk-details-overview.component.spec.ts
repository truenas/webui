import { signal } from '@angular/core';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import { IxFileSizePipe } from 'app/modules/pipes/ix-file-size/ix-file-size.pipe';
import {
  DiskDetailsOverviewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/disk-details-overview/disk-details-overview.component';
import {
  DiskDetailsComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/disk-details-overview/disks-overview-details/disk-details.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('DiskDetailsOverviewComponent', () => {
  let spectator: Spectator<DiskDetailsOverviewComponent>;
  const initialSelectedSlot = {
    drive_bay_number: 4,
    type: DiskType.Hdd,
    size: 100 * GiB,
    dev: 'sda',
    supports_identify_light: true,
  } as DashboardEnclosureSlot;
  const selectedSlot = signal(initialSelectedSlot);

  const createComponent = createComponentFactory({
    component: DiskDetailsOverviewComponent,
    imports: [
      IxFileSizePipe,
    ],
    declarations: [
      MockComponents(
        DiskDetailsComponent,
        DiskIconComponent,
      ),
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectedSlot,
        selectedEnclosure: () => ({ id: 1 }),
        selectSlot: jest.fn(),
      }),
      mockWebSocket([
        mockCall('enclosure2.set_slot_status'),
      ]),
    ],
  });

  beforeEach(() => {
    selectedSlot.set(initialSelectedSlot);
    spectator = createComponent();
  });

  it('shows Slot is empty when there is no drive in the slot', () => {
    selectedSlot.set({ drive_bay_number: 4 } as DashboardEnclosureSlot);
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText('Slot 4 is empty.');
  });

  it('shows disk icon component', () => {
    const diskIcon = spectator.query(DiskIconComponent);
    expect(diskIcon).toExist();
    expect(diskIcon.type).toBe(DiskType.Hdd);
    expect(diskIcon.size).toBe(100 * GiB);
    expect(diskIcon.name).toBe('sda');
  });

  it('shows disks overview details', () => {
    const component = spectator.query(DiskDetailsComponent);
    expect(component).toExist();
    expect(component.selectedSlot).toBe(initialSelectedSlot);
  });

  describe('identify drive button', () => {
    it('does not show Identify Drive button when slot does not support identification', () => {
      selectedSlot.set({
        ...initialSelectedSlot,
        supports_identify_light: false,
      });
      spectator.detectChanges();

      expect(spectator.query(byText('Identify Drive'))).not.toExist();
    });
  });
});
