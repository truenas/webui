import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MockStorageGenerator, MockStorageScenario } from 'app/core/testing/utils/mock-storage-generator.utils';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  PoolCardIconComponent,
} from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { TopologyCardComponent } from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';

describe('TopologyCardComponent2', () => {
  // eslint-disable-next-line unused-imports/no-unused-vars
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
});
