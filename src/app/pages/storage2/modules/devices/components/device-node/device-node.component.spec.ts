import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDev } from 'app/interfaces/storage.interface';
import { DatasetStore } from 'app/pages/datasets/store/dataset-store.service';
import { DeviceIconComponent } from 'app/pages/storage2/modules/devices/components/device-icon/device-icon.component';
import { DeviceNodeComponent } from 'app/pages/storage2/modules/devices/components/device-node/device-node.component';

describe('DeviceNodeComponent', () => {
  let spectator: Spectator<DeviceNodeComponent>;
  const device = {
    disk: 'sda',
    type: VDevType.Disk,
  } as VDev;
  const createComponent = createComponentFactory({
    component: DeviceNodeComponent,
    declarations: [
      DeviceIconComponent,
    ],
    providers: [
      mockWebsocket([
      ]),
      mockProvider(DatasetStore, {
        onReloadList: new Subject<void>(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { device },
    });
  });

  it('shows an icon for current device', () => {
    const icon = spectator.query(DeviceIconComponent);
    expect(icon).toBeTruthy();
    expect(icon.device).toBe(device);
  });

  it('shows device name', () => {
    expect(spectator.query('.name')).toHaveText('sda');
  });
});
