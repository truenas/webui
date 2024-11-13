import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
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

describe('PoolManagerComponent – unsetting on fewer disks', () => {
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
          ] as DetailsDisk[],
        }),
        mockCall('enclosure2.query', [
          {
            id: 'id1',
            name: 'enclosure1',
            label: 'First Enclosure',
          },
          {
            id: 'id2',
            name: 'enclosure0',
            label: 'Second Enclosure',
          },
        ] as Enclosure[]),
        mockCall('pool.query', []),
        mockCall('pool.dataset.encryption_algorithm_choices', {}),
        mockCall('pool.validate_name', true),
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
  });

  it('unsets previously selected fields when new layout requires more disks than previously selected', async () => {
    await wizard.fillStep({
      Name: 'newpool',
    });

    await wizard.clickNext();
    await wizard.clickNext();

    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × STRIPE | 1 × 20 GiB (HDD)',
    });

    await wizard.fillStep({
      Layout: 'Mirror',
    });

    expect(await wizard.getStepValues()).toMatchObject({
      Width: '',
      'Number of VDEVs': '',
    });
    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': 'None',
    });
  });

  it('unsets previously selected fields when due to changes in enclosure settings there not enough disks', async () => {
    await wizard.fillStep({
      Name: 'newpool',
    });
    await wizard.clickNext();
    await wizard.clickNext();

    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '4',
      'Number of VDEVs': '1',
    });

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × STRIPE | 4 × 20 GiB (HDD)',
    });

    await wizard.clickBack();
    const enclosureOptions = await (await wizard.getActiveStep()).getHarness(IxRadioGroupHarness);
    await enclosureOptions.setValue('Limit Pool To A Single Enclosure');
    await wizard.fillStep({
      Enclosure: 'Second Enclosure',
    });

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': 'None',
    });

    await wizard.clickNext();
    expect(await wizard.getStepValues()).toMatchObject({
      'Disk Size': '',
      Width: '',
      'Number of VDEVs': '',
    });
  });

  it('unsets previously selected fields when due to changes in ignored warnings about exported pools', async () => {
    await wizard.fillStep({
      Name: 'newpool',
    });
    const exportedPoolCheckbox = await (await wizard.getActiveStep()).getHarness(MatCheckboxHarness.with({ label: /oldpool/ }));
    await exportedPoolCheckbox.check();

    await wizard.clickNext();
    await wizard.clickNext();

    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '10 GiB (HDD)',
      Width: '3',
      'Number of VDEVs': '1',
    });

    await wizard.clickNext();

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × STRIPE | 3 × 10 GiB (HDD)',
    });

    await wizard.clickBack();
    await wizard.clickBack();

    await exportedPoolCheckbox.uncheck();

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': 'None',
    });

    await wizard.clickNext();
    await wizard.clickNext();

    expect(await wizard.getStepValues()).toMatchObject({
      'Disk Size': '',
      Width: '',
    });
  });

  it('does not reset category if after changing disks constraints there are still enough disks to satisfy previous vdev settings', async () => {
    await wizard.fillStep({
      Name: 'newpool',
    });
    const anotherExportedPoolCheckbox = await (await wizard.getActiveStep()).getHarness(MatCheckboxHarness.with({ label: /anotherpool/ }));
    await anotherExportedPoolCheckbox.check();

    await wizard.clickNext();
    await wizard.clickNext();

    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '10 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × STRIPE | 1 × 10 GiB (HDD)',
    });

    await wizard.clickBack();
    await wizard.clickBack();

    const oldPoolExportedCheckbox = await (await wizard.getActiveStep()).getHarness(MatCheckboxHarness.with({ label: /oldpool/ }));
    await oldPoolExportedCheckbox.check();
    await anotherExportedPoolCheckbox.uncheck();

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × STRIPE | 1 × 10 GiB (HDD)',
    });
  });
});
