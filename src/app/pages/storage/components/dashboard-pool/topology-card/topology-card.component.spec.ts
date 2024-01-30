import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MockStorageScenario } from 'app/core/testing/enums/mock-storage.enum';
import { diskToDashboardDisk } from 'app/core/testing/utils/mock-storage-dashboard.utils';
import { MockStorageGenerator } from 'app/core/testing/utils/mock-storage-generator.utils';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  PoolCardIconComponent,
} from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import {
  TopologyCardComponent,
} from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';

describe('TopologyCardComponent', () => {
  let spectator: Spectator<TopologyCardComponent>;

  const createComponent = createComponentFactory({
    component: TopologyCardComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(PoolCardIconComponent),
    ],
    providers: [
      mockWebSocket([]),
    ],
  });

  describe('tests with Mixed Capacity', () => {
    beforeEach(() => {
      // Create storage object with empty topologies
      const storage = new MockStorageGenerator();

      // Add Topologies to Storage
      storage.addDataTopology({
        scenario: MockStorageScenario.MixedVdevCapacity,
        layout: TopologyItemType.Raidz3,
        diskSize: 4,
        width: 7,
        repeats: 2,
      }).addSpecialTopology({
        scenario: MockStorageScenario.MixedDiskCapacity,
        layout: TopologyItemType.Raidz2,
        diskSize: 4,
        width: 8,
        repeats: 3,
      });

      spectator = createComponent({
        props: {
          poolState: storage.poolState,
          disks: storage.disks.map((disk: Disk) => diskToDashboardDisk(disk)),
        },
      });
    });

    it('rendering VDEVs rows', () => {
      const captions = spectator.queryAll('.vdev-line b');
      const values = spectator.queryAll('.vdev-line .vdev-value');
      expect(spectator.queryAll('.vdev-line .warning ix-icon')).toHaveLength(2);

      expect(captions[0]).toHaveText('Data VDEVs');
      expect(captions[1]).toHaveText('Metadata');
      expect(values[0]).toHaveText('2 x RAIDZ3 | 7 wide | Mixed Capacity');
      expect(values[1]).toHaveText('3 x RAIDZ2 | 8 wide | Mixed Capacity');
    });
  });

  describe('tests without Mixed Capacity', () => {
    beforeEach(() => {
      // Create storage object with empty topologies
      const storage = new MockStorageGenerator();

      // Add Topologies to Storage
      storage.addDataTopology({
        scenario: MockStorageScenario.Uniform,
        layout: TopologyItemType.Raidz3,
        diskSize: 4,
        width: 7,
        repeats: 2,
      })
        .addSpecialTopology({
          scenario: MockStorageScenario.Uniform,
          layout: TopologyItemType.Mirror,
          diskSize: 4,
          width: 3,
          repeats: 1,
        }).addLogTopology(2, true, 2)
        .addCacheTopology(2, 2)
        .addSpareTopology(3, 8);

      spectator = createComponent({
        props: {
          poolState: storage.poolState,
          disks: storage.disks.map((disk: Disk) => diskToDashboardDisk(disk)),
        },
      });
    });

    it('rendering VDEVs rows', () => {
      const captions = spectator.queryAll('.vdev-line b');
      const values = spectator.queryAll('.vdev-line .vdev-value');
      expect(spectator.queryAll('.vdev-line .warning ix-icon')).toHaveLength(1);
      expect(captions).toHaveLength(6);
      expect(values).toHaveLength(6);

      expect(captions[0]).toHaveText('Data VDEVs');
      expect(values[0]).toHaveText('2 x RAIDZ3 | 7 wide | 4 TiB');

      // Can be Disk or MIRROR
      expect(captions[2]).toHaveText('Log VDEVs');
      expect(values[2]).toHaveText('2 x MIRROR | 2 wide | 2 TiB');

      // Can be DISK Only
      expect(captions[3]).toHaveText('Cache VDEVs');
      expect(values[3]).toHaveText('2 x 2 TiB');

      // Can be DISK only but should also be same size or larger than disk sizes used in data VDEVs
      expect(captions[4]).toHaveText('Spare VDEVs');
      expect(values[4]).toHaveText('3 x 8 TiB');

      // Redundancy level should match data VDEVs
      expect(captions[1]).toHaveText('Metadata');
      expect(values[1]).toHaveText('1 x MIRROR | 3 wide | 4 TiB');
      expect(captions[5]).toHaveText('Dedup VDEVs');
      expect(values[5]).toHaveText('VDEVs not assigned');
    });

    it('rendering status icon', () => {
      expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Safe);
      expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Everything is fine');

      spectator.setInput('poolState', { healthy: false, status: PoolStatus.Online } as Pool);
      expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Warn);
      expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool is not healthy');

      spectator.setInput('poolState', { healthy: true, status: PoolStatus.Offline } as Pool);
      expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Warn);
      expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool contains OFFLINE Data VDEVs');

      spectator.setInput('poolState', { healthy: true, status: PoolStatus.Removed } as Pool);
      expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Error);
      expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool contains REMOVED Data VDEVs');

      spectator.setInput('poolState', { healthy: true, status: PoolStatus.Faulted } as Pool);
      expect(spectator.query(PoolCardIconComponent).type).toBe(PoolCardIconType.Error);
      expect(spectator.query(PoolCardIconComponent).tooltip).toBe('Pool contains FAULTED Data VDEVs');
    });
  });

  describe('tests with offline pools', () => {
    beforeEach(() => {
      // Create storage object with empty topologies
      const storage = new MockStorageGenerator();

      // Add Topologies to Storage
      storage.addDataTopology({
        scenario: MockStorageScenario.Uniform,
        layout: TopologyItemType.Raidz3,
        diskSize: 4,
        width: 7,
        repeats: 2,
      })
        .addSpecialTopology({
          scenario: MockStorageScenario.Uniform,
          layout: TopologyItemType.Mirror,
          diskSize: 4,
          width: 3,
          repeats: 1,
        }).addLogTopology(2, true, 2)
        .addCacheTopology(2, 2)
        .addSpareTopology(3, 8);

      spectator = createComponent({
        props: {
          poolState: { ...storage.poolState, status: PoolStatus.Offline },
          disks: storage.disks.map((disk: Disk) => diskToDashboardDisk(disk)),
        },
      });
    });
    it('rendering VDEVs rows', () => {
      const captions = spectator.queryAll('.vdev-line b');
      const values = spectator.queryAll('.vdev-line .vdev-value');

      expect(spectator.queryAll('.vdev-line .warning ix-icon')).toHaveLength(1);
      expect(captions).toHaveLength(6);
      expect(values).toHaveLength(5);

      expect(captions[0]).toHaveText('Data VDEVs');
      expect(spectator.query('.offline-data-vdevs').textContent).toBe('Offline VDEVs');

      // Redundancy level should match data VDEVs
      expect(captions[1]).toHaveText('Metadata');
      expect(values[0]).toHaveText('N/A');

      // Can be Disk or MIRROR
      expect(captions[2]).toHaveText('Log VDEVs');
      expect(values[1]).toHaveText('N/A');

      // Can be DISK Only
      expect(captions[3]).toHaveText('Cache VDEVs');
      expect(values[2]).toHaveText('N/A');

      // Can be DISK only but should also be same size or larger than disk sizes used in data VDEVs
      expect(captions[4]).toHaveText('Spare VDEVs');
      expect(values[3]).toHaveText('N/A');

      expect(captions[5]).toHaveText('Dedup VDEVs');
      expect(values[4]).toHaveText('N/A');
    });
  });
});
