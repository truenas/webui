import { MatIcon } from '@angular/material/icon';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DiskType } from 'app/enums/disk-type.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Disk, TopologyDisk, VDev } from 'app/interfaces/storage.interface';
import {
  TopologyItemIconComponent,
} from 'app/pages/storage2/modules/devices/components/topology-item-icon/topology-item-icon.component';

describe('TopologyItemIconComponent', () => {
  let spectator: Spectator<TopologyItemIconComponent>;
  const diskSsd = { type: DiskType.Ssd } as Disk;
  const diskHdd = { type: DiskType.Hdd } as Disk;
  const vdevDisk = { type: TopologyItemType.Disk, children: [] } as TopologyDisk;
  const vdevMirror = { type: TopologyItemType.Mirror, children: [{}] } as VDev;

  const createComponent = createComponentFactory({
    component: TopologyItemIconComponent,
  });

  it('shows hdd disk icon', () => {
    spectator = createComponent({
      props: { disk: diskHdd, topologyItem: vdevDisk },
    });
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-hdd');
  });

  it('shows ssd disk icon', () => {
    spectator = createComponent({
      props: { disk: diskSsd, topologyItem: vdevDisk },
    });
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-ssd');
  });

  it('shows hdd mirror icon', () => {
    spectator = createComponent({
      props: { disk: diskHdd, topologyItem: vdevMirror },
    });
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-hdd-mirror');
  });

  it('shows ssd mirror icon', () => {
    spectator = createComponent({
      props: { disk: diskSsd, topologyItem: vdevMirror },
    });
    expect(spectator.query(MatIcon).svgIcon).toBe('ix-ssd-mirror');
  });
});
