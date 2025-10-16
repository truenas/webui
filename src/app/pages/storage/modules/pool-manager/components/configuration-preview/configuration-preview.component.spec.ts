import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  ConfigurationPreviewComponent,
} from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import {
  ConfigurationPreviewHarness,
} from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.harness';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import {
  TopologyCategoryDescriptionPipe,
} from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import {
  PoolManagerStore,
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

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
        encryptionType$: of(EncryptionType.Software),
        totalUsableCapacity$: of(10 * GiB),
        topology$: of({
          [VDevType.Data]: {
            diskSize: 2 * GiB,
            vdevsNumber: 2,
            layout: CreateVdevLayout.Stripe,
            width: 3,
            diskType: DiskType.Hdd,
            vdevs: [[{} as DetailsDisk], [{} as DetailsDisk]],
          },
          [VDevType.Log]: {
            diskSize: 3 * GiB,
            vdevsNumber: 2,
            layout: CreateVdevLayout.Raidz1,
            width: 3,
            diskType: DiskType.Hdd,
            vdevs: [[{} as DetailsDisk], [{} as DetailsDisk]],
          },
          [VDevType.Spare]: {
            diskSize: 3 * GiB,
            vdevsNumber: 2,
            layout: CreateVdevLayout.Raidz1,
            width: 3,
            diskType: DiskType.Hdd,
            hasCustomDiskSelection: true,
            vdevs: [[{} as DetailsDisk], [{} as DetailsDisk]],
          },
          [VDevType.Cache]: {
            diskSize: 5 * GiB,
            vdevsNumber: 5,
            layout: CreateVdevLayout.Raidz1,
            width: 2,
            diskType: DiskType.Hdd,
            vdevs: [[{} as DetailsDisk], [{} as DetailsDisk]],
          },
          [VDevType.Dedup]: {
            diskSize: 5 * GiB,
            vdevsNumber: 0,
            layout: CreateVdevLayout.Raidz1,
            width: 0,
            diskType: DiskType.Hdd,
            vdevs: [] as DetailsDisk[][],
          },
          [VDevType.Special]: {
            diskSize: 5 * GiB,
            vdevsNumber: 0,
            layout: CreateVdevLayout.Raidz1,
            width: 0,
            diskType: DiskType.Hdd,
            vdevs: [] as DetailsDisk[][],
          } as PoolManagerTopologyCategory,
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

  it('shows description for non-empty vdev types in topology', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Data:': '2 × STRIPE | 3 × 2 GiB (HDD)',
      'Cache:': '2 × 5 GiB (HDD)',
      'Log:': '2 × RAIDZ1 | 3 × 3 GiB (HDD)',
      'Spare:': '3 × 3 GiB (HDD)',
    });
  });

  it('shows software encryption with algorithm', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Encryption:': 'Software (ZFS) - AES-256',
    });
  });

  it('shows total raw capacity', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Total Raw Capacity:': '10 GiB',
    });
  });
});

describe('ConfigurationPreviewComponent with no encryption', () => {
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
        encryption$: of(null),
        encryptionType$: of(EncryptionType.None),
        totalUsableCapacity$: of(10 * GiB),
        topology$: of({} as PoolManagerTopology),
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

  it('shows "None" when encryption type is None', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Encryption:': 'None',
    });
  });
});

describe('ConfigurationPreviewComponent with different software encryption algorithm', () => {
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
        encryption$: of('AES-256-GCM'),
        encryptionType$: of(EncryptionType.Software),
        totalUsableCapacity$: of(10 * GiB),
        topology$: of({} as PoolManagerTopology),
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

  it('shows "Software (ZFS) - [algorithm]" when encryption type is Software', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Encryption:': 'Software (ZFS) - AES-256-GCM',
    });
  });
});

describe('ConfigurationPreviewComponent with SED encryption', () => {
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
        encryption$: of(null),
        encryptionType$: of(EncryptionType.Sed),
        totalUsableCapacity$: of(10 * GiB),
        topology$: of({} as PoolManagerTopology),
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

  it('shows "Hardware (SED)" when encryption type is SED', async () => {
    expect(await configurationPreview.getItems()).toMatchObject({
      'Encryption:': 'Hardware (SED)',
    });
  });
});
