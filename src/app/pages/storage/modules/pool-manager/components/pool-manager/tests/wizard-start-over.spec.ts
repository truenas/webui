import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
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

describe('PoolManagerComponent – start over functionality', () => {
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
    // GENERAL step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('General Info');
    await wizard.fillStep({
      Name: 'I will be erased',
    });
    await wizard.clickNext();

    // ENCLOSURE step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Enclosure Options');
    const enclosureOptions = await (await wizard.getActiveStep()).getHarness(IxRadioGroupHarness);
    await enclosureOptions.setValue('Limit Pool To A Single Enclosure');
    await wizard.clickNext();

    // DATA step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Data');
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });
    await wizard.clickNext();

    // LOG step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Log (Optional)');
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });
    await wizard.clickNext();

    // SPARE step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Spare (Optional)');
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });
    await wizard.clickNext();

    // CACHE step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Cache (Optional)');
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });
    await wizard.clickNext();

    // METADATA step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Metadata (Optional)');
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });
    await wizard.clickNext();

    // DEDUP step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Dedup (Optional)');
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × STRIPE | 1 × 20 GiB (HDD)',
      'Log:': '1 × STRIPE | 1 × 20 GiB (HDD)',
      'Spare:': '1 × 20 GiB (HDD)',
      'Cache:': '1 × 20 GiB (HDD)',
      'Dedup:': '1 × STRIPE | 1 × 20 GiB (HDD)',
    });
    await wizard.clickNext();

    // REVIEW step activated
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Review');
    await wizard.clickStartOver();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Start Over',
    }));

    // START OVER submitted

    // GENERAL step activated and reset to default
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('General Info');
    expect(await wizard.getStepValues()).toStrictEqual({
      Name: '',
      Encryption: false,
    });
    await wizard.clickNext();

    // ENCLOSURE step activated and reset to default
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Enclosure Options');
    expect(await wizard.getStepValues()).toStrictEqual({
      '': 'No Enclosure Dispersal Strategy',
    });
    await wizard.clickNext();

    // DATA step activated and reset to default
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Data');
    expect(await wizard.getStepValues()).toStrictEqual({
      'Disk Size': '',
      Layout: '',
      'Number of VDEVs': '',
      'Treat Disk Size as Minimum': false,
      Width: '',
    });
    await wizard.clickNext();

    // LOG step activated and reset to default
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Log (Optional)');
    expect(await wizard.getStepValues()).toStrictEqual({
      'Disk Size': '',
      Layout: '',
      'Treat Disk Size as Minimum': false,
      Width: '',
    });
    await wizard.clickNext();

    // SPARE step activated and reset to default
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Spare (Optional)');
    expect(await wizard.getStepValues()).toStrictEqual({
      'Disk Size': '',
      Width: '',
      'Treat Disk Size as Minimum': false,
    });
    await wizard.clickNext();

    // CACHE step activated and reset to default
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Cache (Optional)');
    expect(await wizard.getStepValues()).toStrictEqual({
      'Disk Size': '',
      'Treat Disk Size as Minimum': false,
      Width: '',
    });
    await wizard.clickNext();

    // METADATA step activated and reset to default
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Metadata (Optional)');
    expect(await wizard.getStepValues()).toStrictEqual({
      Layout: '',
      'Disk Size': '',
      'Number of VDEVs': '',
      'Treat Disk Size as Minimum': false,
      Width: '',
    });
    await wizard.clickNext();

    // DEDUP step activated and reset to default
    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Dedup (Optional)');
    expect(await wizard.getStepValues()).toStrictEqual({
      Layout: '',
      'Disk Size': '',
      'Number of VDEVs': '',
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
