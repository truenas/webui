import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { UnusedDiskCardComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/unused-disk-card.component';
import { UnusedResourcesComponent } from './unused-resources.component';

describe('UnusedResourcesComponent', () => {
  let spectator: Spectator<UnusedResourcesComponent>;

  const createComponent = createComponentFactory({
    component: UnusedResourcesComponent,
    providers: [
      mockWebsocket([
        mockCall('disk.get_unused', [
          { devname: 'sdb', identifier: '{serial_lunid}BBBBB1' },
          { devname: 'sdc', identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929' },
        ] as UnusedDisk[]),
      ]),
    ],
    declarations: [
      UnusedDiskCardComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        pools: [
          { id: 1, name: 'DEV' },
          { id: 2, name: 'TEST' },
        ] as Pool[],
      },
    });
  });

  it('shows an \'Unassigned Disks\' card when exists unused disks', () => {
    expect(spectator.query('ix-unused-disk-card')).toBeVisible();
  });

  it('hides an \'Unassigned Disks\' card when does not exist unused disks', () => {
    spectator.inject(MockWebsocketService).mockCall('disk.get_unused', []);
    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.query('ix-unused-disk-card')).not.toBeVisible();
  });
});
