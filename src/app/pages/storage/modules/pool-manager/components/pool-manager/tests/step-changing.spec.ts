import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import {
  PoolManagerComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';
import {
  commonImports,
  commonProviders,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager/tests/common.utils';
import {
  PoolManagerHarness,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager/tests/pool-manager.harness';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('PoolManagerComponent – step changing', () => {
  let spectator: Spectator<PoolManagerComponent>;
  let wizard: PoolManagerHarness;
  let store: PoolManagerStore;
  const createComponent = createComponentFactory({
    component: PoolManagerComponent,
    imports: [
      ...commonImports,
    ],
    componentProviders: [
      ...commonProviders,
      mockApi([
        mockCall('pool.validate_name', true),
        mockCall('disk.details', {
          used: [
            {
              devname: 'ada0',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id1',
                drive_bay_number: 1,
              },
              exported_zpool: 'oldpool',
            },
            {
              devname: 'ada2',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id1',
                drive_bay_number: 2,
              },
              exported_zpool: 'oldpool',
            },
            {
              devname: 'ada3',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id1',
                drive_bay_number: 3,
              },
              exported_zpool: 'oldpool',
            },
            {
              devname: 'sda0',
              size: 20 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id4',
                drive_bay_number: 0,
              },
            },
            {
              devname: 'sda3',
              size: 20 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: '2',
                drive_bay_number: 0,
              },
            },
            {
              devname: 'sda4',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id3',
                drive_bay_number: 1,
              },
              exported_zpool: 'anotherpool',
            },
          ] as DetailsDisk[],
          unused: [
            {
              devname: 'sda1',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda2',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda5',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda6',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda7',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
          ] as DetailsDisk[],
        }),
        mockCall('enclosure2.query', [] as Enclosure[]),
        mockCall('pool.query', []),
        mockCall('pool.dataset.encryption_algorithm_choices', {}),
        mockJob('pool.create', fakeSuccessfulJob()),
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    store = spectator.inject(PoolManagerStore, true);
    wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
  });

  it('changes the sequence of categories', async () => {
    expect(store.state().categorySequence).toEqual([
      VdevType.Data,
      VdevType.Log,
      VdevType.Special,
      VdevType.Dedup,
      VdevType.Spare,
      VdevType.Cache,
    ]);

    await wizard.fillStep({
      Name: 'pool1',
    });
    await wizard.clickNext();

    // Data
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    expect(store.state().categorySequence).toEqual([
      VdevType.Log,
      VdevType.Special,
      VdevType.Dedup,
      VdevType.Spare,
      VdevType.Cache,
      VdevType.Data,
    ]);

    // Log
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    expect(store.state().categorySequence).toEqual([
      VdevType.Special,
      VdevType.Dedup,
      VdevType.Spare,
      VdevType.Cache,
      VdevType.Data,
      VdevType.Log,
    ]);

    // Spare
    await wizard.clickNext();
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    expect(store.state().categorySequence).toEqual([
      VdevType.Special,
      VdevType.Dedup,
      VdevType.Cache,
      VdevType.Data,
      VdevType.Log,
      VdevType.Spare,
    ]);

    // Cache
    await wizard.clickNext();
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    expect(store.state().categorySequence).toEqual([
      VdevType.Special,
      VdevType.Dedup,
      VdevType.Data,
      VdevType.Log,
      VdevType.Spare,
      VdevType.Cache,
    ]);

    // Metadata
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    expect(store.state().categorySequence).toEqual([
      VdevType.Dedup,
      VdevType.Data,
      VdevType.Log,
      VdevType.Spare,
      VdevType.Cache,
      VdevType.Special,
    ]);

    // Dedup
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    expect(store.state().categorySequence).toEqual([
      VdevType.Data,
      VdevType.Log,
      VdevType.Spare,
      VdevType.Cache,
      VdevType.Special,
      VdevType.Dedup,
    ]);

    // Spare again
    await wizard.clickBack();
    await wizard.clickBack();
    await wizard.clickBack();
    await wizard.fillStep({
      Width: '2',
    });

    expect(store.state().categorySequence).toEqual([
      VdevType.Data,
      VdevType.Log,
      VdevType.Cache,
      VdevType.Special,
      VdevType.Dedup,
      VdevType.Spare,
    ]);

    // Data again
    await wizard.clickBack();
    await wizard.clickBack();
    await wizard.fillStep({
      Width: '2',
    });

    expect(store.state().categorySequence).toEqual([
      VdevType.Log,
      VdevType.Cache,
      VdevType.Special,
      VdevType.Dedup,
      VdevType.Spare,
      VdevType.Data,
    ]);
  });
});
