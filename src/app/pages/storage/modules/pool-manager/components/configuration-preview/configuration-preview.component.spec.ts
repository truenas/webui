import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  ConfigurationPreviewComponent,
} from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import {
  ConfigurationPreviewHarness,
} from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.harness';
import {
  TopologyCategoryDescriptionPipe,
} from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { PoolManagerStore, PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('ConfigurationPreviewComponent', () => {
  let spectator: Spectator<ConfigurationPreviewComponent>;
  let configurationPreview: ConfigurationPreviewHarness;
  const createComponent = createComponentFactory({
    component: ConfigurationPreviewComponent,
    imports: [
      FileSizePipe,
      MapValuePipe,
      CastPipe,
      TopologyCategoryDescriptionPipe,
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        name$: of('tank'),
        encryption$: of('AES-256'),
        totalUsableCapacity$: of(10 * GiB),
        topology$: of({
          [VdevType.Data]: {
            diskSize: 2 * GiB,
            vdevsNumber: 2,
            layout: CreateVdevLayout.Stripe,
            width: 3,
            diskType: DiskType.Hdd,
            vdevs: [[{}], [{}]],
          },
          [VdevType.Log]: {
            diskSize: 3 * GiB,
            vdevsNumber: 2,
            layout: CreateVdevLayout.Raidz1,
            width: 3,
            diskType: DiskType.Hdd,
            vdevs: [[{}], [{}]],
          },
          [VdevType.Spare]: {
            diskSize: 3 * GiB,
            vdevsNumber: 2,
            layout: CreateVdevLayout.Raidz1,
            width: 3,
            diskType: DiskType.Hdd,
            hasCustomDiskSelection: true,
            vdevs: [[{}], [{}]],
          },
          [VdevType.Cache]: {
            diskSize: 5 * GiB,
            vdevsNumber: 5,
            layout: CreateVdevLayout.Raidz1,
            width: 2,
            diskType: DiskType.Hdd,
            vdevs: [[{}], [{}]],
          },
          [VdevType.Dedup]: {
            diskSize: 5 * GiB,
            vdevsNumber: 0,
            layout: CreateVdevLayout.Raidz1,
            width: 0,
            diskType: DiskType.Hdd,
            vdevs: [],
          },
          [VdevType.Special]: {
            diskSize: 5 * GiB,
            vdevsNumber: 0,
            layout: CreateVdevLayout.Raidz1,
            width: 0,
            diskType: DiskType.Hdd,
            vdevs: [],
          },
        } as PoolManagerTopology),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    configurationPreview = await TestbedHarnessEnvironment.harnessForFixture(
      spectator.fixture,
      ConfigurationPreviewHarness,
    );
  });

  it('shows pool name', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Name:': 'tank',
    });
  });

  it('shows description for every vdev type in topology', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Data:': '2 × STRIPE | 3 × 2 GiB (HDD)',
      'Cache:': '2 × 5 GiB (HDD)',
      'Dedup:': 'None',
      'Log:': '2 × RAIDZ1 | 3 × 3 GiB (HDD)',
      'Spare:': 'Manual layout | 2 VDEVs',
      'Metadata:': 'None',
    });
  });

  it('shows encryption', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Encryption:': 'AES-256',
    });
  });

  it('shows total raw capacity', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Total Raw Capacity:': '10 GiB',
    });
  });
});
