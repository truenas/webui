import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { VmDeviceType, VmDisplayType } from 'app/enums/vm.enum';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { DeviceDetailsComponent } from 'app/pages/vm/devices/device-list/device-details/device-details.component';

describe('DeviceDetailsComponent', () => {
  let spectator: Spectator<DeviceDetailsComponent>;
  const createComponent = createComponentFactory({
    component: DeviceDetailsComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          dtype: VmDeviceType.Display,
          attributes: {
            web: true,
            port: 720,
            wait: true,
            type: VmDisplayType.Spice,
            resolution: '1024x768',
          },
        } as VmDisplayDevice,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows device attributes in a list', () => {
    const attributes = spectator.queryAll('.attributes div');
    expect(attributes).toHaveLength(5);
    expect(attributes[0]).toHaveText('web: true');
    expect(attributes[1]).toHaveText('port: 720');
    expect(attributes[2]).toHaveText('wait: true');
    expect(attributes[3]).toHaveText('type: SPICE');
    expect(attributes[4]).toHaveText('resolution: 1024x768');
  });
});
