import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { IdentifyLightComponent } from 'app/pages/system/enclosure/components/identify-light/identify-light.component';
import {
  MiniDriveDetailsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-details/mini-drive-details.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getItemValueFactory } from 'app/pages/system/enclosure/utils/get-item-value-factory.utils';

describe('MiniDriveDetailsComponent', () => {
  let spectator: Spectator<MiniDriveDetailsComponent>;
  const slot = {
    model: 'A3',
    rotationrate: 7200,
    serial: '12345',
    supports_identify_light: true,
    pool_info: {
      pool_name: 'pool1',
      disk_status: EnclosureDiskStatus.Online,
    },
  } as DashboardEnclosureSlot;

  let getItemValue: (name: string) => string;

  const createComponent = createComponentFactory({
    component: MiniDriveDetailsComponent,
    declarations: [
      MockComponent(IdentifyLightComponent),
    ],
    imports: [
      MapValuePipe,
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
        slot,
      },
    });
    getItemValue = getItemValueFactory(spectator);
  });

  it('shows pool for the selected slot', () => {
    expect(getItemValue('Pool:')).toMatch('pool1');
  });

  it('shows disk model', () => {
    expect(getItemValue('Model:')).toBe('A3');
  });

  it('shows disk serial', () => {
    expect(getItemValue('Serial:')).toMatch('12345');
  });

  it('shows disk rotation rate', () => {
    expect(getItemValue('Rotation Rate:')).toMatch('7200 RPM');
  });

  it('shows disk status', () => {
    expect(getItemValue('Status:')).toMatch('Online');
  });

  it('unselects a slot when X is pressed', () => {
    spectator.click('ix-icon');

    expect(spectator.inject(EnclosureStore).selectSlot).toHaveBeenCalledWith(null);
  });

  // TODO: Test case for VDEV

  it('shows "Disk not attached to any pools" when this is the case', () => {
    spectator.setInput('slot', {
      pool_info: null,
    } as DashboardEnclosureSlot);
    spectator.detectChanges();

    expect(getItemValue('Pool:')).toMatch('Disk not attached to any pools.');
  });

  it('shows identify light when enclosure slot has support for it', () => {
    expect(spectator.query(IdentifyLightComponent)).toExist();
  });
});
