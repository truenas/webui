import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDiskCardComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/unused-disk-card.component';
import { UnusedResourcesComponent } from './unused-resources.component';

describe('UnusedResourcesComponent', () => {
  let spectator: Spectator<UnusedResourcesComponent>;

  const createComponent = createComponentFactory({
    component: UnusedResourcesComponent,
    imports: [
      UnusedDiskCardComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
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

  it('shows an \'Unused Disks\' card when exists unused disks', () => {
    expect(spectator.queryAll('ix-unused-disk-card')).toHaveLength(2);
  });

  it('hides an \'Unassigned Disks\' card when does not exist unused disks', () => {
    spectator.inject(MockApiService).mockCall('disk.details', { used: [], unused: [] });
    spectator.setInput('pools', []);
    spectator.detectChanges();

    expect(spectator.queryAll('ix-unused-disk-card')).toHaveLength(0);

    spectator.inject(MockApiService).mockCall('disk.details', {
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
