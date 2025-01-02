import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
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

describe('PoolManagerComponent – creating dRAID pool', () => {
  let spectator: Spectator<PoolManagerComponent>;
  let wizard: PoolManagerHarness;
  const createComponent = createComponentFactory({
    component: PoolManagerComponent,
    imports: [
      ...commonImports,
    ],
    providers: [
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
                id: 'id2',
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
      mockProvider(Router),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
  });

  it('creates dRAID1 Pool', async () => {
    await wizard.fillStep({
      Name: 'dRAID',
    });

    await wizard.clickNext();
    await wizard.clickNext();

    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Data');

    await wizard.fillStep({
      Layout: 'dRAID1',
    });

    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      'Data Devices': '2',
      'Distributed Hot Spares': '1',
      Children: '5',
      'Number of VDEVs': '1',
    });

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × DRAID1 | 5 × 20 GiB (HDD)',
    });

    const stepper = await wizard.getStepper();
    await stepper.selectStep({ label: 'Review' });

    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Review');

    await wizard.clickCreatePoolButton();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.create', [{
      name: 'dRAID',
      allow_duplicate_serials: false,
      encryption: false,
      topology: {
        data: [
          {
            disks: ['sda3', 'sda0', 'sda1', 'sda2', 'sda5'],
            type: CreateVdevLayout.Draid1,
            draid_data_disks: 2,
            draid_spare_disks: 1,
          },
        ],
        cache: [],
        dedup: [],
        spares: [],
        log: [],
        special: [],
      },
    }]);
  });
});
