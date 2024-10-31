import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { InstanceDevicesComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';

describe('InstanceDevicesComponent', () => {
  let spectator: Spectator<InstanceDevicesComponent>;

  const demoInstance = {
    id: 'demo',
    name: 'Demo',
    type: 'CONTAINER',
    status: 'RUNNING',
    cpu: '525',
    autostart: true,
    image: {
      architecture: 'amd64',
      description: 'Almalinux 8 amd64 (20241030_23:38)',
      os: 'Almalinux',
      release: '8',
    },
    memory: 131072000,
  } as unknown as VirtualizationInstance;

  const devices = [
    { dev_type: VirtualizationDeviceType.Gpu },
    { dev_type: VirtualizationDeviceType.Usb },
  ] as VirtualizationDevice[];

  const createComponent = createComponentFactory({
    component: InstanceDevicesComponent,
    declarations: [
      MockComponents(
        MatProgressSpinner,
      ),
    ],
    providers: [
      mockWebSocket([
        mockCall('virt.instance.device_list', devices),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: demoInstance,
      },
    });
  });

  it('checks card title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Devices');
  });

  it('renders details in card', () => {
    const chartExtra = spectator.query('mat-card-content').querySelectorAll('p');
    expect(chartExtra).toHaveLength(2);
    expect(chartExtra[0]).toHaveText('Device Type: Gpu');
    expect(chartExtra[1]).toHaveText('Device Type: Usb');
  });
});
