import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import {
  AddVdevsStore,
} from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import {
  DispersalStrategy,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import {
  PoolManagerValidationService,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import {
  PoolManagerStore,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { selectHasEnclosureSupport } from 'app/store/system-info/system-info.selectors';

describe('PoolManagerValidationService', () => {
  describe('required steps validation', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;
    let testScheduler: TestScheduler;

    const mockName$ = of('');
    const mockTopology$ = of({
      [VdevType.Data]: { vdevs: [] },
      [VdevType.Log]: { vdevs: [] },
    });
    const mockEnclosureSettings$ = of({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.LimitToSingle,
    });
    const mockHasMultipleEnclosuresAfterFirstStep$ = of(true);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name$: mockName$,
          nameErrors$: of({
            required: true,
          }),
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        mockProvider(AddVdevsStore, {
          pool$: of(null),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectHasEnclosureSupport,
              value: true,
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
      testScheduler = getTestScheduler();
    });

    it('generates errors for required steps', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getPoolCreationErrors()).toBe('a', {
          a: [
            {
              severity: 'error',
              step: 'general',
              text: 'Name not added',
            },
            {
              severity: 'error',
              step: 'enclosure',
              text: 'An enclosure must be selected when \'Limit Pool to a Single Enclosure\' is enabled.',
            },
            {
              severity: 'error',
              step: 'data',
              text: 'At least 1 data VDEV is required.',
            },
          ],
        });
      });
    });

    it('generates top level error for each step if exists', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getTopLevelErrorsForEachStep()).toBe('a', {
          a: {
            cache: null,
            data: 'At least 1 data VDEV is required.',
            dedup: null,
            enclosure: 'An enclosure must be selected when \'Limit Pool to a Single Enclosure\' is enabled.',
            general: 'Name not added',
            log: null,
            metadata: null,
            review: null,
            spare: null,
          },
        });
      });
    });
  });

  describe('warnings generation', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;
    let testScheduler: TestScheduler;

    const mockName$ = of('No error for name');
    const mockNameErrors$ = of(null);
    const mockTopology$ = of({
      [VdevType.Data]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [
          [
            {
              identifier: '{serial_lunid}8HG29G5H_5000cca2700430f8',
              name: 'sdc',
              subsystem: 'scsi',
              exported_zpool: 'new',
              duplicate_serial: ['duplicate_serial'],
              number: 2080,
              serial: '8HG29G5H',
              lunid: '5000cca2700430f8',
              enclosure: {
                number: 0,
                slot: 1,
              },
              devname: 'sdc',
            },
          ],
        ],
      },
      [VdevType.Log]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [
          {
            identifier: '{serial_lunid}8HG5ZRMH_5000cca2700ae4d8',
            name: 'sdf',
            subsystem: 'scsi',
            number: 2128,
            serial: '8HG5ZRMH',
            lunid: '5000cca2700ae4d8',
            size: 12000138625024,
            description: '',
            enclosure: {
              number: 0,
              slot: 1,
            },
            devname: 'sdf',
          },
        ],
      },
    });
    const mockEnclosureSettings$ = of({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep$ = of(true);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name$: mockName$,
          nameErrors$: mockNameErrors$,
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        mockProvider(AddVdevsStore, {
          pool$: of(null),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectHasEnclosureSupport,
              value: true,
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
      testScheduler = getTestScheduler();
    });

    it('generates warnings for steps', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getPoolCreationErrors()).toBe('a', {
          a: [
            {
              severity: 'warning',
              step: 'log',
              text: 'A stripe log VDEV may result in data loss if it fails combined with a power outage.',
            },
            {
              severity: 'warning',
              step: 'review',
              text: 'Some of the selected disks have exported pools on them. Using those disks will make existing pools on them unable to be imported. You will lose any and all data in selected disks.',
            },
            {
              severity: 'warning',
              step: 'review',
              text: 'Warning: There are 1 disks available that have non-unique serial numbers. Non-unique serial numbers can be caused by a cabling issue and adding such disks to a pool can result in lost data.',
            },
            {
              severity: 'error-warning',
              step: 'data',
              text: 'A stripe data VDEV is highly discouraged and will result in data loss if it fails',
            },
          ],
        });
      });
    });

    it('generates top level warnings for each step if exists', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getTopLevelWarningsForEachStep()).toBe('a', {
          a: {
            cache: null,
            data: 'A stripe data VDEV is highly discouraged and will result in data loss if it fails',
            dedup: null,
            enclosure: null,
            general: null,
            log: 'A stripe log VDEV may result in data loss if it fails combined with a power outage.',
            metadata: null,
            review: 'Some of the selected disks have exported pools on them. Using those disks will make existing pools on them unable to be imported. You will lose any and all data in selected disks.',
            spare: null,
          },
        });
      });
    });
  });

  describe('errors when adding vdevs to existing pool and no vdevs are selected', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;
    let testScheduler: TestScheduler;

    const mockName$ = of('No error for name');
    const mockTopology$ = of({
      [VdevType.Data]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [],
      },
    });
    const mockEnclosureSettings$ = of({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep$ = of(true);
    const mockNameErrors$ = of(null);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name$: mockName$,
          nameErrors$: mockNameErrors$,
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        mockProvider(AddVdevsStore, {
          pool$: of({ topology: { data: [{ type: 'MIRROR' }] } } as Pool),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectHasEnclosureSupport,
              value: true,
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
      testScheduler = getTestScheduler();
    });

    it('throws error when no vdevs are selected', () => {
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.getPoolCreationErrors()).toBe('a', {
          a: [
            {
              severity: 'error',
              step: 'review',
              text: 'At least 1 vdev is required to make an update to the pool.',
            },
          ],
        });
      });
    });
  });

  describe('dRAID validation', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;

    const mockName$ = of('Pool');
    const mockTopology$ = of({
      [VdevType.Data]: {
        hasCustomDiskSelection: false,
        layout: CreateVdevLayout.Draid1,
        vdevs: [[{}]],
        draidDataDisks: 1,
        draidSpareDisks: 0,
        width: 9,
      } as PoolManagerTopologyCategory,
    });
    const mockEnclosureSettings$ = of({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep$ = of(true);
    const mockNameErrors$ = of(null);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name$: mockName$,
          nameErrors$: mockNameErrors$,
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        mockProvider(AddVdevsStore, {
          pool$: of(null),
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectHasEnclosureSupport,
              value: true,
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    // TODO: Spit apart and add more boundary checks.
    it('adds a warning when dRAID data disk is not a power of two', async () => {
      const errors = await firstValueFrom(spectator.service.getPoolCreationErrors());
      expect(errors).toContainEqual({
        text: 'Recommended number of data disks for optimal space allocation should be power of 2 (2, 4, 8, 16...).',
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    });

    it('adds a warning when dRAID children is less than 10', async () => {
      const errors = await firstValueFrom(spectator.service.getPoolCreationErrors());
      expect(errors).toContainEqual({
        text: 'In order for dRAID to overweight its benefits over RaidZ the minimum recommended number of disks per dRAID vdev is 10.',
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    });

    it('adds a warning when dRAID does not have spares added', async () => {
      const errors = await firstValueFrom(spectator.service.getPoolCreationErrors());
      expect(errors).toContainEqual({
        text: 'At least one spare is recommended for dRAID. Spares cannot be added later.',
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    });
  });
});
