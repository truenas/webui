import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { IdentifyLightComponent } from 'app/pages/system/enclosure/components/identify-light/identify-light.component';
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

  const createComponent = createComponentFactory({
    component: DiskDetailsOverviewComponent,
    imports: [
      FileSizePipe,
    ],
    declarations: [
      MockComponents(
        DiskDetailsComponent,
        DiskIconComponent,
        IdentifyLightComponent,
      ),
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectSlot: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        selectedSlot: initialSelectedSlot,
      },
    });
  });

  it('shows Slot is empty when there is no drive in the slot', () => {
    spectator.setInput('selectedSlot', { drive_bay_number: 4 } as DashboardEnclosureSlot);
    spectator.detectChanges();

    expect(spectator.fixture.nativeElement).toHaveText('Slot 4 is empty.');
  });

  it('shows disk icon component', () => {
    const diskIcon = spectator.query(DiskIconComponent)!;
    expect(diskIcon).toExist();
    expect(diskIcon.type).toBe(DiskType.Hdd);
    expect(diskIcon.size).toBe(100 * GiB);
    expect(diskIcon.name).toBe('sda');
  });

  it('shows disks overview details', () => {
    const component = spectator.query(DiskDetailsComponent)!;
    expect(component).toExist();
    expect(component.selectedSlot).toBe(initialSelectedSlot);
  });

  it('shows identify light when enclosure slot has support for it', () => {
    expect(spectator.query(IdentifyLightComponent)).toExist();
  });
});
