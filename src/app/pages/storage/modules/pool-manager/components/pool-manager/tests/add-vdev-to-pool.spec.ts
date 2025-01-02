import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddVdevsComponent } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/add-vdevs.component';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { existingPool, existingPoolDisks } from 'app/pages/storage/modules/pool-manager/components/pool-manager/tests/add-vdev-to-pool-data';
import {
  commonImports,
  commonProviders,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager/tests/common.utils';
import {
  PoolManagerHarness,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager/tests/pool-manager.harness';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';

describe('AddVdevsComponent – Add Vdev to existing pool', () => {
  let spectator: Spectator<AddVdevsComponent>;
  let wizard: PoolManagerHarness;

  const createComponent = createComponentFactory({
    component: AddVdevsComponent,
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
              devname: 'sda4',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id3',
                drive_bay_number: 1,
              },
              exported_zpool: 'anotherpool',
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
          ] as DetailsDisk[],
          unused: [
            {
              devname: 'sda0',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
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
        mockJob('pool.update', fakeSuccessfulJob()),
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockProvider(AddVdevsStore, {
        initialize: jest.fn(),
        isLoading$: of(false),
        pool$: of(existingPool),
        poolDisks$: of(existingPoolDisks),
        loadPoolData: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
    jest.spyOn(spectator.inject(Router), 'navigate').mockImplementation();
  });

  it('adds Vdevs to existing Pool', async () => {
    // General Info Step
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('General Info');

    const generalStepValues = await wizard.getStepValues();
    expect(generalStepValues).toEqual({
      Name: 'APPS',
    });

    // Data Step
    await wizard.clickNext();
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Data');

    const dataStepValues = await wizard.getStepValues();
    expect(dataStepValues).toEqual({
      'Disk Size': '',
      Layout: TopologyItemType.Mirror,
      'Number of VDEVs': '',
      'Treat Disk Size as Minimum': false,
      Width: '',
    });

    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      'Treat Disk Size as Minimum': true,
      Width: '2',
      'Number of VDEVs': '1',
    });

    expect(await wizard.getExistingConfigurationPreviewSummary()).toMatchObject({
      'Data:': '3 × MIRROR | 2 × 10.91 TiB (HDD)',
    });

    expect(await wizard.getNewDevicesConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × MIRROR | 2 × 20 GiB (HDD)',
    });

    // Log step
    await wizard.clickNext();
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Log (Optional)');

    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      'Treat Disk Size as Minimum': true,
      Width: '1',
    });

    expect(await wizard.getNewDevicesConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × MIRROR | 2 × 20 GiB (HDD)',
      'Log:': '1 × STRIPE | 1 × 20 GiB (HDD)',
    });

    // Spare step
    await wizard.clickNext();
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Spare (Optional)');

    // Cache step
    await wizard.clickNext();
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Cache (Optional)');

    // Metadata step
    await wizard.clickNext();
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Metadata (Optional)');

    // Dedup step
    await wizard.clickNext();
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Dedup (Optional)');

    await wizard.fillStep({
      Layout: 'Mirror',
      'Disk Size': '20 GiB (HDD)',
      'Treat Disk Size as Minimum': true,
      Width: '3',
      'Number of VDEVs': '1',
    });

    expect(await wizard.getNewDevicesConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × MIRROR | 2 × 20 GiB (HDD)',
      'Log:': '1 × STRIPE | 1 × 20 GiB (HDD)',
      'Dedup:': '1 × MIRROR | 3 × 20 GiB (HDD)',
    });

    // Review step
    const stepper = await wizard.getStepper();
    await stepper.selectStep({ label: 'Review' });

    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Review');

    await wizard.clickUpdatePoolButton();

    expect(spectator.inject(DialogService, true).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService, true).job).toHaveBeenCalledWith('pool.update', [
      1,
      {
        topology: {
          cache: [],
          data: [
            { type: TopologyItemType.Mirror, disks: ['sda3', 'sda0'] },
          ],
          dedup: [
            { type: TopologyItemType.Mirror, disks: ['sda2', 'sda5', 'sda6'] },
          ],
          log: [
            { type: TopologyItemType.Stripe, disks: ['sda1'] },
          ],
          spares: [],
          special: [],
        },
        allow_duplicate_serials: false,
      },
    ]);
  });
});
