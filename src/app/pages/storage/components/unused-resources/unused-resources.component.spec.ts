import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDiskCardComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/unused-disk-card.component';
import { UnusedResourcesComponent } from './unused-resources.component';

const pools = [
  { id: 1, name: 'DEV' },
  { id: 2, name: 'TEST' },
] as Pool[];

describe('UnusedResourcesComponent', () => {
  let spectator: Spectator<UnusedResourcesComponent>;

  const createComponent = createComponentFactory({
    component: UnusedResourcesComponent,
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('disk.details', {
          used: [
            { devname: 'sdb', identifier: '{serial_lunid}BBBBB1', exported_zpool: 'pool' },
          ] as DetailsDisk[],
          unused: [
            { devname: 'sdc', identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929' },
          ] as DetailsDisk[],
        }),
      ]),
    ],
    declarations: [
      UnusedDiskCardComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        pools,
      },
    });
  });

  it('shows an \'Unused Disks\' card when exists unused disks', () => {
    spectator.setInput('pools', pools);
    expect(spectator.queryAll('ix-unused-disk-card')).toHaveLength(2);
  });

  it('hides an \'Unassigned Disks\' card when does not exist unused disks', () => {
    spectator.inject(MockWebSocketService).mockCall('disk.details', { used: [], unused: [] });
    spectator.setInput('pools', []);
    spectator.detectChanges();

    expect(spectator.queryAll('ix-unused-disk-card')).toHaveLength(0);

    spectator.inject(MockWebSocketService).mockCall('disk.details', {
      used: [],
      unused: [
        { devname: 'sdc', identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929' },
      ] as DetailsDisk[],
    });
    spectator.setInput('pools', []);
    spectator.detectChanges();

    expect(spectator.queryAll('ix-unused-disk-card')).toHaveLength(1);
  });
});
