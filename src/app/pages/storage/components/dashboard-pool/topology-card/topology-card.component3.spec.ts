import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MockStorageGenerator, MockStorageScenario } from 'app/core/testing/utils/mock-storage-generator.utils';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  PoolCardIconComponent,
} from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import {
  TopologyCardComponent,
} from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';

// eslint-disable-next-line jest/no-focused-tests
describe('TopologyCardComponent3', () => {
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
  });

  beforeEach(() => {
    // Create storage object with empty topologies
    const storage = new MockStorageGenerator();

    // Add Topologies to Storage
    storage.addDataTopology({
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Mirror,
      diskSize: 8,
      width: 2,
      repeats: 6,
    }).addSpecialTopology({
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Mirror,
      diskSize: 8,
      width: 3,
      repeats: 1,
    }).addLogTopology(2, true, 2)
      .addCacheTopology(2, 2)
      .addSpareTopology(3, 8);

    spectator = createComponent({
      props: {
        poolState: storage.poolState as Pool,
        disks: storage.disks,
      },
    });
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
