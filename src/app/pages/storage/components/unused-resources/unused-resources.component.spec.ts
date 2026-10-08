import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDiskCardComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/unused-disk-card.component';
import { UnusedResourcesComponent } from './unused-resources.component';

describe('UnusedResourcesComponent', () => {
  let spectator: Spectator<UnusedResourcesComponent>;

  /** `disk.details` is answered on a microtask; let it land and render. */
  async function settle(): Promise<void> {
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  const createComponent = createComponentFactory({
    component: UnusedResourcesComponent,
    imports: [
      UnusedDiskCardComponent,
    ],
    providers: [
      mockAuth(),
      mockTypedApi([
        mockTypedCall('disk.details', {
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

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        pools: [
          { id: 1, name: 'DEV' },
          { id: 2, name: 'TEST' },
        ] as Pool[],
      },
    });
    await settle();
  });

  it('shows an \'Unassigned Disks\' card when exists Unassigned Disks', () => {
    expect(spectator.queryAll('ix-unused-disk-card')).toHaveLength(2);
  });

  it('hides an \'Unassigned Disks\' card when does not exist Unassigned Disks', async () => {
    spectator.inject(MockTypedApiService).mockCall('disk.details', { used: [], unused: [] });
    spectator.setInput('pools', []);
    await settle();

    expect(spectator.queryAll('ix-unused-disk-card')).toHaveLength(0);

    spectator.inject(MockTypedApiService).mockCall('disk.details', {
      used: [],
      unused: [
        { devname: 'sdc', identifier: '{uuid}7ad07324-f0e9-49a4-a7a4-92edd82a4929' },
      ] as DetailsDisk[],
    });
    spectator.setInput('pools', []);
    await settle();

    expect(spectator.queryAll('ix-unused-disk-card')).toHaveLength(1);
  });
});
