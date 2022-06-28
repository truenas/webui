import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatIconHarness } from '@angular/material/icon/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDev } from 'app/interfaces/storage.interface';
import { DeviceIconComponent } from 'app/pages/storage2/modules/devices/components/device-icon/device-icon.component';

describe('DeviceIconComponent', () => {
  let spectator: Spectator<DeviceIconComponent>;
  let matIcon: MatIconHarness;
  const createComponent = createComponentFactory({
    component: DeviceIconComponent,
  });

  async function setupTest(device: VDev): Promise<void> {
    spectator = createComponent({
      props: {
        device,
      },
    });

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    matIcon = await loader.getHarness(MatIconHarness);
  }

  it('shows an icon for a disk', async () => {
    await setupTest({
      disk: 'sda',
      type: VDevType.Disk,
    } as VDev);

    expect(await matIcon.getName()).toBe('save');
  });

  it('shows an icon for an mirror', async () => {
    await setupTest({
      name: 'MIRROR-1',
      type: VDevType.Mirror,
    } as VDev);

    expect(await matIcon.getName()).toBe('folder');
  });
});
