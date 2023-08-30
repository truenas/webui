import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { CoreComponents } from 'app/core/core-components.module';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import {
  ConfigurationPreviewComponent,
} from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import {
  TopologyCategoryDescriptionPipe,
} from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { PoolManagerStore, PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('ConfigurationPreviewComponent', () => {
  let spectator: Spectator<ConfigurationPreviewComponent>;
  const createComponent = createComponentFactory({
    component: ConfigurationPreviewComponent,
    imports: [
      CoreComponents,
    ],
    declarations: [
      TopologyCategoryDescriptionPipe,
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        name$: of('tank'),
        encryption$: of('AES-256'),
        totalUsableCapacity$: of(10 * GiB),
        usesDraidLayout$: of(false),
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

  beforeEach(() => {
    spectator = createComponent();
  });

  function getItems(): Record<string, string> {
    const items: Record<string, string> = {};
    spectator.queryAll<HTMLElement>('.details-item').forEach((item) => {
      const label = item.querySelector('.label').textContent.trim();
      const value = item.querySelector('.value').textContent.trim();
      items[label] = value;
    });
    return items;
  }

  it('shows pool name', () => {
    expect(getItems()).toMatchObject({
      'Name:': 'tank',
    });
  });

  it('shows description for every vdev type in topology', () => {
    expect(getItems()).toMatchObject({
      'Data:': '2 × STRIPE | 3 × 2 GiB (HDD)',
      'Cache:': '5 × RAIDZ1 | 2 × 5 GiB (HDD)',
      'Dedup:': 'None',
      'Log:': '2 × RAIDZ1 | 3 × 3 GiB (HDD)',
      'Spare:': 'Manual layout | 2 VDEVs',
      'Special:': 'None',
    });
  });

  it('shows encryption', () => {
    expect(getItems()).toMatchObject({
      'Encryption:': 'AES-256',
    });
  });

  it('shows total raw capacity', () => {
    expect(getItems()).toMatchObject({
      'Total Raw Capacity:': '10 GiB',
    });
  });
});
