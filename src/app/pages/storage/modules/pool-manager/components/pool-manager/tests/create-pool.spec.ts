import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
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
import { selectHasEnclosureSupport, selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('PoolManagerComponent – create pool', () => {
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
              name: 'ada0',
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
              name: 'ada2',
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
              name: 'ada3',
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
              name: 'sda0',
              size: 20 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id4',
                drive_bay_number: 0,
              },
            },
            {
              devname: 'sda3',
              name: 'sda3',
              size: 20 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: '2',
                drive_bay_number: 0,
              },
            },
            {
              devname: 'sda4',
              name: 'sda4',
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
              name: 'sda1',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda2',
              name: 'sda2',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda5',
              name: 'sda5',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda6',
              name: 'sda6',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda7',
              size: 20 * GiB,
              name: 'sda7',
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
    wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
  });

  it('creates a pool', async () => {
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

    // Log
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    // Spare
    await wizard.clickNext();
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    // Cache
    await wizard.clickNext();
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    // Metadata
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    // Dedup
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    const reviewView = await wizard.getReviewWizardStep();
    expect(await reviewView.getConfigurationItems()).toEqual({
      Cache: '1 × 20 GiB (HDD)',
      Data: '1 × STRIPE | 1 × 20 GiB (HDD)',
      Dedup: '1 × STRIPE | 1 × 20 GiB (HDD)',
      Log: '1 × STRIPE | 1 × 20 GiB (HDD)',
      Spare: '1 × 20 GiB (HDD)',
      Metadata: '1 × STRIPE | 1 × 20 GiB (HDD)',
    });
    expect(await reviewView.getWarnings()).toEqual([
      'A stripe log VDEV may result in data loss if it fails combined with a power outage.',
    ]);
    expect(await reviewView.getErrors()).toEqual([
      'A stripe data VDEV is highly discouraged and will result in data loss if it fails',
      'A stripe dedup VDEV is highly discouraged and will result in data loss if it fails',
      'A stripe metadata VDEV is highly discouraged and will result in data loss if it fails',
    ]);
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    await (await wizard.getCreatePoolButton()).click();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'pool.create',
      [{
        name: 'pool1',
        topology: {
          cache: [{
            disks: ['sda2'],
            type: 'STRIPE',
          }],
          data: [{
            disks: ['sda3'],
            type: 'STRIPE',
          }],
          dedup: [{
            disks: ['sda6'],
            type: 'STRIPE',
          }],
          log: [{
            disks: ['sda0'],
            type: 'STRIPE',
          }],
          spares: ['sda1'],
          special: [{
            disks: ['sda5'],
            type: 'STRIPE',
          }],
        },
        allow_duplicate_serials: false,
        encryption: false,
      }],
    );
    expect(router.navigate).toHaveBeenCalledWith(['/storage']);
  });
});

describe('PoolManagerComponent – create pool with SED encryption', () => {
  let spectator: Spectator<PoolManagerComponent>;
  let wizard: PoolManagerHarness;

  const sedDisks: DetailsDisk[] = [
    {
      devname: 'sda1',
      name: 'sda1',
      size: 20 * GiB,
      type: DiskType.Hdd,
      sed_status: SedStatus.Uninitialized,
    } as DetailsDisk,
    {
      devname: 'sda2',
      name: 'sda2',
      size: 20 * GiB,
      type: DiskType.Hdd,
      sed_status: SedStatus.Uninitialized,
    } as DetailsDisk,
    {
      devname: 'sda3',
      name: 'sda3',
      size: 20 * GiB,
      type: DiskType.Hdd,
      sed_status: SedStatus.Unlocked,
    } as DetailsDisk,
    {
      devname: 'sda4',
      name: 'sda4',
      size: 20 * GiB,
      type: DiskType.Hdd,
      sed_status: SedStatus.Uninitialized,
    } as DetailsDisk,
    {
      devname: 'sda5',
      name: 'sda5',
      size: 20 * GiB,
      type: DiskType.Hdd,
      sed_status: SedStatus.Uninitialized,
    } as DetailsDisk,
  ];

  // Common providers without the mock store (we'll provide our own)
  const commonProvidersWithoutStore = commonProviders.slice(0, -1);

  describe('when global SED password is not set', () => {
    const createComponent = createComponentFactory({
      component: PoolManagerComponent,
      imports: [...commonImports],
      providers: [
        ...commonProvidersWithoutStore,
        mockApi([
          mockCall('pool.validate_name', true),
          mockCall('disk.details', { used: [], unused: sedDisks }),
          mockCall('enclosure2.query', []),
          mockCall('pool.query', []),
          mockCall('pool.dataset.encryption_algorithm_choices', {}),
          mockCall('system.advanced.sed_global_password_is_set', false),
          mockCall('system.advanced.update', {} as AdvancedConfig),
          mockJob('pool.create', fakeSuccessfulJob()),
        ]),
        mockProvider(PoolWizardNameValidationService, {
          validatePoolName: () => of(null),
        }),
        provideMockStore({
          selectors: [
            { selector: selectHasEnclosureSupport, value: true },
            { selector: selectIsEnterprise, value: true },
          ],
        }),
        mockAuth(),
      ],
    });

    beforeEach(async () => {
      spectator = createComponent();
      wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
    });

    it('shows SED encryption as default when SED disks available and Enterprise', async () => {
      const stepValues = await wizard.getStepValues();
      expect(stepValues['Encryption']).toBe('Self Encrypting Drives (SED)');
    });

    it('requires SED password when no global password exists', async () => {
      await wizard.fillStep({
        Name: 'sedpool',
      });

      const nextButton = await wizard.getNextButton();
      expect(await nextButton.isDisabled()).toBe(true);

      await wizard.fillStep({
        'Global SED Password': 'testpassword123',
        'Confirm SED Password': 'testpassword123',
      });

      expect(await nextButton.isDisabled()).toBe(false);
    });
  });

  describe('when global SED password is already set', () => {
    const createComponent = createComponentFactory({
      component: PoolManagerComponent,
      imports: [...commonImports],
      providers: [
        ...commonProvidersWithoutStore,
        mockApi([
          mockCall('pool.validate_name', true),
          mockCall('disk.details', { used: [], unused: sedDisks }),
          mockCall('enclosure2.query', []),
          mockCall('pool.query', []),
          mockCall('pool.dataset.encryption_algorithm_choices', {}),
          mockCall('system.advanced.sed_global_password_is_set', true),
          mockCall('system.advanced.update', {} as AdvancedConfig),
          mockJob('pool.create', fakeSuccessfulJob()),
        ]),
        mockProvider(PoolWizardNameValidationService, {
          validatePoolName: () => of(null),
        }),
        provideMockStore({
          selectors: [
            { selector: selectHasEnclosureSupport, value: true },
            { selector: selectIsEnterprise, value: true },
          ],
        }),
        mockAuth(),
      ],
    });

    beforeEach(async () => {
      spectator = createComponent();
      wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
    });

    it('allows creating pool without entering password when global password exists', async () => {
      await wizard.fillStep({
        Name: 'sedpool2',
      });

      const nextButton = await wizard.getNextButton();
      expect(await nextButton.isDisabled()).toBe(false);
    });
  });

  describe('SED option visibility - not Enterprise', () => {
    const createComponent = createComponentFactory({
      component: PoolManagerComponent,
      imports: [...commonImports],
      providers: [
        ...commonProvidersWithoutStore,
        mockApi([
          mockCall('pool.validate_name', true),
          mockCall('disk.details', { used: [], unused: sedDisks }),
          mockCall('enclosure2.query', []),
          mockCall('pool.query', []),
          mockCall('pool.dataset.encryption_algorithm_choices', {}),
          mockCall('system.advanced.sed_global_password_is_set', false),
          mockJob('pool.create', fakeSuccessfulJob()),
        ]),
        mockProvider(PoolWizardNameValidationService, {
          validatePoolName: () => of(null),
        }),
        provideMockStore({
          selectors: [
            { selector: selectHasEnclosureSupport, value: true },
            { selector: selectIsEnterprise, value: false },
          ],
        }),
        mockAuth(),
      ],
    });

    beforeEach(async () => {
      spectator = createComponent();
      wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
    });

    it('does not show SED option when not Enterprise', async () => {
      const stepValues = await wizard.getStepValues();
      expect(stepValues['Encryption']).toBe('None');
    });
  });

  describe('SED option visibility - no SED disks', () => {
    const nonSedDisks: DetailsDisk[] = [
      {
        devname: 'sda1',
        name: 'sda1',
        size: 20 * GiB,
        type: DiskType.Hdd,
        sed_status: SedStatus.Unsupported,
      } as DetailsDisk,
      {
        devname: 'sda2',
        name: 'sda2',
        size: 20 * GiB,
        type: DiskType.Hdd,
      } as DetailsDisk,
    ];

    const createComponent = createComponentFactory({
      component: PoolManagerComponent,
      imports: [...commonImports],
      providers: [
        ...commonProvidersWithoutStore,
        mockApi([
          mockCall('pool.validate_name', true),
          mockCall('disk.details', { used: [], unused: nonSedDisks }),
          mockCall('enclosure2.query', []),
          mockCall('pool.query', []),
          mockCall('pool.dataset.encryption_algorithm_choices', {}),
          mockCall('system.advanced.sed_global_password_is_set', false),
          mockJob('pool.create', fakeSuccessfulJob()),
        ]),
        mockProvider(PoolWizardNameValidationService, {
          validatePoolName: () => of(null),
        }),
        provideMockStore({
          selectors: [
            { selector: selectHasEnclosureSupport, value: true },
            { selector: selectIsEnterprise, value: true },
          ],
        }),
        mockAuth(),
      ],
    });

    beforeEach(async () => {
      spectator = createComponent();
      wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
    });

    it('does not show SED option when no SED-capable disks', async () => {
      const stepValues = await wizard.getStepValues();
      expect(stepValues['Encryption']).toBe('None');
    });
  });
});
