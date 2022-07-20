import { MatIcon } from '@angular/material/icon';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { DiskIconComponent } from 'app/pages/storage2/modules/devices/components/disk-icon/disk-icon.component';

describe('DiskIconComponent', () => {
  let spectator: Spectator<DiskIconComponent>;
  const diskSsd = { type: DiskType.Ssd } as Disk;
  const diskHdd = { type: DiskType.Hdd } as Disk;
  const vdevDisk = { children: [] } as VDev;
  const vdevMirror = { children: [{}] } as VDev;

  const createComponent = createComponentFactory({
    component: DiskIconComponent,
  });

  it('shows hdd disk icon', () => {
    spectator = createComponent({
      props: { disk: diskHdd, vdev: vdevDisk },
    });
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-hdd');
  });

  it('shows ssd disk icon', () => {
    spectator = createComponent({
      props: { disk: diskSsd, vdev: vdevDisk },
    });
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-ssd');
  });

  it('shows hdd mirror icon', () => {
    spectator = createComponent({
      props: { disk: diskHdd, vdev: vdevMirror },
    });
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-hdd-mirror');
  });

  it('shows ssd mirror icon', () => {
    spectator = createComponent({
      props: { disk: diskSsd, vdev: vdevMirror },
    });
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-ssd-mirror');
  });
});
