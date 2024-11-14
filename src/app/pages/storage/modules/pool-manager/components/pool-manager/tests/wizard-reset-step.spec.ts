import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
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

describe('PoolManagerComponent – wizard step reset', () => {
  let spectator: Spectator<PoolManagerComponent>;
  let wizard: PoolManagerHarness;
  const createComponent = createComponentFactory({
    component: PoolManagerComponent,
    imports: [
      ...commonImports,
    ],
    componentProviders: [
      ...commonProviders,
      mockApi([
        mockCall('pool.validate_name', true),
        // TODO: see if all disk.details calls from multiple files can be extracted somewhere.
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
              devname: 'sda0',
              size: 20 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id4',
                drive_bay_number: 0,
              },
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
              devname: 'sda3',
              size: 20 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id2',
                drive_bay_number: 0,
              },
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
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
  });

  it('sets wizard steps and then resets them', async () => {
    await wizard.clickNext();
    await wizard.clickNext();

    // DATA step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Data');
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });
    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({ 'Data:': '1 × STRIPE | 1 × 20 GiB (HDD)' });
    const resetDataButton = (await (await wizard.getActiveStep()).getHarness(MatButtonHarness.with({ text: 'Reset Step' })));
    await resetDataButton.click();
    expect(await wizard.getStepValues()).toStrictEqual({
      'Disk Size': '',
      Layout: '',
      'Number of VDEVs': '',
      'Treat Disk Size as Minimum': false,
      Width: '',
    });
    await wizard.clickNext();

    // LOG step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Log (Optional)');
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });
    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({ 'Log:': '1 × STRIPE | 1 × 20 GiB (HDD)' });
    const resetLogButton = (await (await wizard.getActiveStep()).getHarness(MatButtonHarness.with({ text: 'Reset Step' })));
    await resetLogButton.click();
    expect(await wizard.getStepValues()).toStrictEqual({
      'Disk Size': '',
      Layout: '',
      'Treat Disk Size as Minimum': false,
      Width: '',
    });
    await wizard.clickNext();

    // SPARE step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Spare (Optional)');
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });
    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({ 'Spare:': '1 × 20 GiB (HDD)' });
    const resetSpareButton = (await (await wizard.getActiveStep()).getHarness(MatButtonHarness.with({ text: 'Reset Step' })));
    await resetSpareButton.click();
    expect(await wizard.getStepValues()).toStrictEqual({
      'Disk Size': '',
      Width: '',
      'Treat Disk Size as Minimum': false,
    });
    await wizard.clickNext();

    // CACHE step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Cache (Optional)');
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });
    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({ 'Cache:': '1 × 20 GiB (HDD)' });
    const resetCacheButton = (await (await wizard.getActiveStep()).getHarness(MatButtonHarness.with({ text: 'Reset Step' })));
    await resetCacheButton.click();
    expect(await wizard.getStepValues()).toStrictEqual({
      'Disk Size': '',
      'Treat Disk Size as Minimum': false,
      Width: '',
    });

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': 'None',
      'Log:': 'None',
      'Spare:': 'None',
      'Cache:': 'None',
      'Dedup:': 'None',
    });
  });
});
