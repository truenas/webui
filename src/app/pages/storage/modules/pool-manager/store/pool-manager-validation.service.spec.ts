import { signal } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
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

    const mockName = signal('');
    const mockTopology = signal({
      [VDevType.Data]: { vdevs: [] },
      [VDevType.Log]: { vdevs: [] },
    });
    const mockEnclosureSettings = signal({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.LimitToSingle,
    });
    const mockHasMultipleEnclosuresAfterFirstStep = signal(true);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name: mockName,
          nameErrors: signal({
            required: true,
          }),
          enclosureSettings: mockEnclosureSettings,
          topology: mockTopology,
          hasMultipleEnclosuresAfterFirstStep: mockHasMultipleEnclosuresAfterFirstStep,
        }),
        mockProvider(AddVdevsStore, {
          pool: signal(null),
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

    it('generates errors for required steps', () => {
      expect(spectator.service.poolCreationErrors()).toEqual([
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
      ]);
    });

    it('generates top level error for each step if exists', () => {
      expect(spectator.service.topLevelErrorsForEachStep()).toEqual({
        cache: null,
        data: 'At least 1 data VDEV is required.',
        dedup: null,
        enclosure: 'An enclosure must be selected when \'Limit Pool to a Single Enclosure\' is enabled.',
        general: 'Name not added',
        log: null,
        metadata: null,
        review: null,
        spare: null,
      });
    });
  });

  describe('warnings generation', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;

    const mockName = signal('No error for name');
    const mockNameErrors = signal(null);
    const mockTopology = signal({
      [VDevType.Data]: {
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
      [VDevType.Log]: {
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
    const mockEnclosureSettings = signal({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep = signal(true);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name: mockName,
          nameErrors: mockNameErrors,
          enclosureSettings: mockEnclosureSettings,
          topology: mockTopology,
          hasMultipleEnclosuresAfterFirstStep: mockHasMultipleEnclosuresAfterFirstStep,
        }),
        mockProvider(AddVdevsStore, {
          pool: signal(null),
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

    it('generates warnings for steps', () => {
      expect(spectator.service.poolCreationErrors()).toEqual([
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
      ]);
    });

    it('generates top level warnings for each step if exists', () => {
      expect(spectator.service.topLevelWarningsForEachStep()).toEqual({
        cache: null,
        data: 'A stripe data VDEV is highly discouraged and will result in data loss if it fails',
        dedup: null,
        enclosure: null,
        general: null,
        log: 'A stripe log VDEV may result in data loss if it fails combined with a power outage.',
        metadata: null,
        review: 'Some of the selected disks have exported pools on them. Using those disks will make existing pools on them unable to be imported. You will lose any and all data in selected disks.',
        spare: null,
      });
    });
  });

  describe('errors when adding vdevs to existing pool and no vdevs are selected', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;

    const mockName = signal('No error for name');
    const mockTopology = signal({
      [VDevType.Data]: {
        hasCustomDiskSelection: false,
        layout: 'STRIPE',
        vdevs: [],
      },
    });
    const mockEnclosureSettings = signal({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep = signal(true);
    const mockNameErrors = signal(null);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name: mockName,
          nameErrors: mockNameErrors,
          enclosureSettings: mockEnclosureSettings,
          topology: mockTopology,
          hasMultipleEnclosuresAfterFirstStep: mockHasMultipleEnclosuresAfterFirstStep,
        }),
        mockProvider(AddVdevsStore, {
          pool: signal({ topology: { data: [{ type: 'MIRROR' }] } } as Pool),
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

    it('throws error when no vdevs are selected', () => {
      expect(spectator.service.poolCreationErrors()).toEqual([
        {
          severity: 'error',
          step: 'review',
          text: 'At least 1 vdev is required to make an update to the pool.',
        },
      ]);
    });
  });

  describe('dRAID validation', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;

    const mockName = signal('Pool');
    const mockTopology = signal({
      [VDevType.Data]: {
        hasCustomDiskSelection: false,
        layout: CreateVdevLayout.Draid1,
        vdevs: [[{}]],
        draidDataDisks: 1,
        draidSpareDisks: 0,
        width: 9,
      } as PoolManagerTopologyCategory,
    });
    const mockEnclosureSettings = signal({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep = signal(true);
    const mockNameErrors = signal(null);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name: mockName,
          nameErrors: mockNameErrors,
          enclosureSettings: mockEnclosureSettings,
          topology: mockTopology,
          hasMultipleEnclosuresAfterFirstStep: mockHasMultipleEnclosuresAfterFirstStep,
        }),
        mockProvider(AddVdevsStore, {
          pool: signal(null),
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
    it('adds a warning when dRAID data disk is not a power of two', () => {
      const errors = spectator.service.poolCreationErrors();
      expect(errors).toContainEqual({
        text: 'Recommended number of data disks for optimal space allocation should be a power of 2 (2, 4, 8, 16...).',
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    });

    it('adds a warning when dRAID children is less than 10', () => {
      const errors = spectator.service.poolCreationErrors();
      expect(errors).toContainEqual({
        text: 'For dRAID\'s benefits to outweigh those of RaidZ, we recommend at least 10 disks per dRAID vdev.',
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    });

    it('adds a warning when dRAID does not have spares added', () => {
      const errors = spectator.service.poolCreationErrors();
      expect(errors).toContainEqual({
        text: 'At least one distributed spare is recommended for dRAID. Distributed spares cannot be added after the pool is created.',
        severity: PoolCreationSeverity.Warning,
        step: PoolCreationWizardStep.Data,
      });
    });
  });

  describe('add-vdev special stripe redundancy warning', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;

    const mockName = signal('Pool');
    const mockTopology = signal({
      [VDevType.Special]: {
        hasCustomDiskSelection: false,
        layout: CreateVdevLayout.Stripe,
        vdevs: [[{ devname: 'sdc' }]],
      },
    });
    const mockEnclosureSettings = signal({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep = signal(false);
    const mockNameErrors = signal(null);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name: mockName,
          nameErrors: mockNameErrors,
          enclosureSettings: mockEnclosureSettings,
          topology: mockTopology,
          hasMultipleEnclosuresAfterFirstStep: mockHasMultipleEnclosuresAfterFirstStep,
        }),
        mockProvider(AddVdevsStore, {
          pool: signal({ name: 'existing-pool' } as Pool),
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

    it('displays warning when adding stripe special vdev to existing pool', () => {
      expect(spectator.service.poolCreationErrors()).toEqual([
        {
          severity: PoolCreationSeverity.ErrorWarning,
          step: PoolCreationWizardStep.Metadata,
          text: 'Adding a stripe special VDEV introduces a single point of failure to your pool.',
        },
      ]);
    });
  });

  describe('add-vdev dedup stripe redundancy warning', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;

    const mockName = signal('Pool');
    const mockTopology = signal({
      [VDevType.Dedup]: {
        hasCustomDiskSelection: false,
        layout: CreateVdevLayout.Stripe,
        vdevs: [[{ devname: 'sdc' }]],
      },
    });
    const mockEnclosureSettings = signal({
      limitToSingleEnclosure: null,
      dispersalStrategy: DispersalStrategy.None,
    });
    const mockHasMultipleEnclosuresAfterFirstStep = signal(false);
    const mockNameErrors = signal(null);

    const createService = createServiceFactory({
      service: PoolManagerValidationService,
      providers: [
        mockProvider(PoolManagerStore, {
          name: mockName,
          nameErrors: mockNameErrors,
          enclosureSettings: mockEnclosureSettings,
          topology: mockTopology,
          hasMultipleEnclosuresAfterFirstStep: mockHasMultipleEnclosuresAfterFirstStep,
        }),
        mockProvider(AddVdevsStore, {
          pool: signal({ name: 'existing-pool' } as Pool),
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

    it('displays warning when adding stripe dedup vdev to existing pool', () => {
      expect(spectator.service.poolCreationErrors()).toEqual([
        {
          severity: PoolCreationSeverity.ErrorWarning,
          step: PoolCreationWizardStep.Dedup,
          text: 'Adding a stripe dedup VDEV introduces a single point of failure to your pool.',
        },
      ]);
    });
  });

  describe('incomplete optional category validation', () => {
    const emptyCategory: Partial<PoolManagerTopologyCategory> = { vdevs: [], diskSize: null, layout: null };
    const dataCategory: Partial<PoolManagerTopologyCategory> = {
      vdevs: [[{}]] as PoolManagerTopologyCategory['vdevs'],
      layout: CreateVdevLayout.Raidz2,
    };

    const sharedProviders = [
      mockProvider(AddVdevsStore, { pool: signal(null) }),
      provideMockStore({
        selectors: [{ selector: selectHasEnclosureSupport, value: true }],
      }),
    ];
    const sharedStoreMock = {
      name: signal('Pool'),
      nameErrors: signal(null),
      enclosureSettings: signal({
        limitToSingleEnclosure: null,
        dispersalStrategy: DispersalStrategy.None,
      }),
      hasMultipleEnclosuresAfterFirstStep: signal(false),
    };

    describe('when user picked a disk size for metadata but width was cleared', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: dataCategory,
              [VDevType.Special]: {
                ...emptyCategory,
                diskSize: 12000138625024,
                layout: CreateVdevLayout.Raidz2,
                vdevs: [],
              },
            }),
          }),
          ...sharedProviders,
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('flags metadata step', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Error,
          step: PoolCreationWizardStep.Metadata,
          text: 'Special VDEV configuration is incomplete. Complete the layout, width and number of VDEVs.',
        });
      });
    });

    describe('when user picked a disk size for dedup but width was cleared', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: dataCategory,
              [VDevType.Dedup]: {
                ...emptyCategory,
                diskSize: 12000138625024,
                layout: CreateVdevLayout.Raidz2,
                vdevs: [],
              },
            }),
          }),
          ...sharedProviders,
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('flags dedup step', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Error,
          step: PoolCreationWizardStep.Dedup,
          text: 'Dedup VDEV configuration is incomplete. Complete the layout, width and number of VDEVs.',
        });
      });
    });

    describe('when user toggled treatDiskSizeAsMinimum on metadata but nothing else', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: dataCategory,
              [VDevType.Special]: {
                ...emptyCategory,
                treatDiskSizeAsMinimum: true,
                vdevs: [],
              },
            }),
          }),
          ...sharedProviders,
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('flags metadata step', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Error,
          step: PoolCreationWizardStep.Metadata,
          text: 'Special VDEV configuration is incomplete. Complete the layout, width and number of VDEVs.',
        });
      });
    });

    describe('when user picked a width for metadata but diskSize was never set', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: dataCategory,
              [VDevType.Special]: {
                ...emptyCategory,
                width: 2,
                vdevs: [],
              },
            }),
          }),
          ...sharedProviders,
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('flags metadata step even without a disk size', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Error,
          step: PoolCreationWizardStep.Metadata,
          text: 'Special VDEV configuration is incomplete. Complete the layout, width and number of VDEVs.',
        });
      });
    });

    describe.each([
      [VDevType.Log, PoolCreationWizardStep.Log, 'Log'],
      [VDevType.Spare, PoolCreationWizardStep.Spare, 'Spare'],
      [VDevType.Cache, PoolCreationWizardStep.Cache, 'Cache'],
    ])('when %s category is partially configured', (vdevType, step, label) => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: dataCategory,
              [vdevType]: {
                ...emptyCategory,
                diskSize: 12000138625024,
                vdevs: [],
              },
            }),
          }),
          ...sharedProviders,
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it(`flags ${label} step`, () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Error,
          step,
          text: `${label} VDEV configuration is incomplete. Complete the layout, width and number of VDEVs.`,
        });
      });
    });

    describe('when optional categories were never configured', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: dataCategory,
              [VDevType.Log]: emptyCategory,
              [VDevType.Spare]: emptyCategory,
              [VDevType.Cache]: emptyCategory,
              [VDevType.Special]: emptyCategory,
              [VDevType.Dedup]: emptyCategory,
            }),
          }),
          ...sharedProviders,
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('does not flag any incomplete errors', () => {
        const errors = spectator.service.poolCreationErrors();
        const incompleteErrors = errors.filter((err) => err.text.includes('configuration is incomplete'));
        expect(incompleteErrors).toEqual([]);
      });
    });

    describe('when the only disk size on offer was filled in on optional steps the user clicked through', () => {
      const autoSelectedCategory: Partial<PoolManagerTopologyCategory> = {
        ...emptyCategory,
        diskSize: 10 * GiB,
        diskType: DiskType.Hdd,
        isDiskSizeAutoSelected: true,
      };

      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: dataCategory,
              [VDevType.Log]: autoSelectedCategory,
              [VDevType.Spare]: autoSelectedCategory,
              [VDevType.Cache]: autoSelectedCategory,
              [VDevType.Special]: autoSelectedCategory,
              [VDevType.Dedup]: autoSelectedCategory,
            }),
          }),
          ...sharedProviders,
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('does not flag any incomplete errors', () => {
        const errors = spectator.service.poolCreationErrors();
        const incompleteErrors = errors.filter((err) => err.text.includes('configuration is incomplete'));
        expect(incompleteErrors).toEqual([]);
      });
    });

    describe('when the user picked that same disk size on Log and left the rest empty', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: dataCategory,
              [VDevType.Log]: {
                ...emptyCategory,
                diskSize: 10 * GiB,
                diskType: DiskType.Hdd,
                isDiskSizeAutoSelected: false,
              },
            }),
          }),
          ...sharedProviders,
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('flags Log step', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Error,
          step: PoolCreationWizardStep.Log,
          text: 'Log VDEV configuration is incomplete. Complete the layout, width and number of VDEVs.',
        });
      });
    });
  });

  describe('redundancy-mismatch warning (NAS-140839)', () => {
    const sharedStoreMock = {
      name: signal('Pool'),
      nameErrors: signal(null),
      enclosureSettings: signal({
        limitToSingleEnclosure: null,
        dispersalStrategy: DispersalStrategy.None,
      }),
      hasMultipleEnclosuresAfterFirstStep: signal(false),
    };

    describe('when special parity is lower than data parity (new pool)', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Raidz2,
                width: 4,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: 2,
                vdevs: [[{ devname: 'sdb' }, { devname: 'sdc' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('emits a non-blocking metadata redundancy warning', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Metadata,
          text: 'The metadata VDEV redundancy is lower than the data VDEV redundancy. Losing this VDEV will destroy the pool.',
        });
      });
    });

    describe('when special is manually selected (no width set on category)', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Raidz2,
                width: 4,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: null,
                vdevs: [[{ devname: 'sdb' }, { devname: 'sdc' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('still emits the metadata redundancy warning using the smallest vdev disk count', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Metadata,
          text: 'The metadata VDEV redundancy is lower than the data VDEV redundancy. Losing this VDEV will destroy the pool.',
        });
      });
    });

    describe('when data is manually selected Mirror (no width set on category)', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Mirror,
                width: null,
                vdevs: [[{ devname: 'sda' }, { devname: 'sdb' }, { devname: 'sdc' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: 2,
                vdevs: [[{ devname: 'sdd' }, { devname: 'sde' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('emits the metadata redundancy warning using the manual data vdev disk count', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Metadata,
          text: 'The metadata VDEV redundancy is lower than the data VDEV redundancy. Losing this VDEV will destroy the pool.',
        });
      });
    });

    describe('when special width is stale after manual selection added a disk', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Raidz2,
                width: 4,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: 2,
                vdevs: [[{ devname: 'sdb' }, { devname: 'sdc' }, { devname: 'sdd' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('clears the redundancy warning based on the actual vdev disk count, not the stale width', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).not.toContainEqual(expect.objectContaining({
          step: PoolCreationWizardStep.Metadata,
          severity: PoolCreationSeverity.Warning,
          text: expect.stringContaining('redundancy is lower'),
        }));
      });
    });

    describe('when special width is stale after manual selection removed a disk', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Raidz2,
                width: 4,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: 4,
                vdevs: [[{ devname: 'sdb' }, { devname: 'sdc' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('emits the warning based on the actual vdev disk count, not the stale higher width', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Metadata,
          text: 'The metadata VDEV redundancy is lower than the data VDEV redundancy. Losing this VDEV will destroy the pool.',
        });
      });
    });

    describe('when special has mixed-length vdevs', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Raidz2,
                width: 4,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: null,
                vdevs: [
                  [{ devname: 'sdb' }, { devname: 'sdc' }, { devname: 'sdd' }],
                  [{ devname: 'sde' }, { devname: 'sdf' }],
                ],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('uses the smallest vdev disk count (conservative) — emits the warning when the weakest vdev parity is below data', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Metadata,
          text: 'The metadata VDEV redundancy is lower than the data VDEV redundancy. Losing this VDEV will destroy the pool.',
        });
      });
    });

    describe('when special has only empty vdev arrays', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Raidz2,
                width: 4,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: null,
                vdevs: [[]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('suppresses the redundancy warning when no real vdev disks are present', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).not.toContainEqual(expect.objectContaining({
          step: PoolCreationWizardStep.Metadata,
          severity: PoolCreationSeverity.Warning,
          text: expect.stringContaining('redundancy is lower'),
        }));
      });
    });

    describe('when special parity matches data parity', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Raidz2,
                width: 4,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Raidz2,
                width: 4,
                vdevs: [[{ devname: 'sdb' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('does not warn', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors.find((err) => err.text.includes('redundancy is lower'))).toBeUndefined();
      });
    });

    describe('when adding dedup to a pool with higher-redundancy data', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Dedup]: {
                layout: CreateVdevLayout.Mirror,
                width: 2,
                vdevs: [[{ devname: 'sdb' }, { devname: 'sdc' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, {
            pool: signal({
              name: 'pool',
              topology: {
                [VDevType.Data]: [
                  { type: TopologyItemType.Raidz3, children: [{}, {}, {}, {}, {}] },
                ],
              },
            } as Pool),
          }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('emits a dedup redundancy warning', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Dedup,
          text: 'The dedup VDEV redundancy is lower than the data VDEV redundancy. Losing this VDEV will destroy the pool.',
        });
      });
    });

    describe('when both data and special are stripe', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Stripe,
                width: 1,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Stripe,
                width: 1,
                vdevs: [[{ devname: 'sdb' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('does not double-warn (stripe warning handles the message)', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors.find((err) => err.text.includes('redundancy is lower'))).toBeUndefined();
      });
    });
  });

  describe('mixed-layout warning (NAS-140839)', () => {
    const sharedStoreMock = {
      name: signal('Pool'),
      nameErrors: signal(null),
      enclosureSettings: signal({
        limitToSingleEnclosure: null,
        dispersalStrategy: DispersalStrategy.None,
      }),
      hasMultipleEnclosuresAfterFirstStep: signal(false),
    };

    describe('when adding a special vdev with a layout different from existing pool special', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Special]: {
                layout: CreateVdevLayout.Raidz1,
                width: 3,
                vdevs: [[{ devname: 'sdb' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, {
            pool: signal({
              name: 'pool',
              topology: {
                [VDevType.Special]: [
                  { type: TopologyItemType.Mirror, children: [{}, {}] },
                ],
              },
            } as Pool),
          }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('emits a non-blocking mixed-layout warning', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Metadata,
          text: 'Mixing layouts within the metadata class is not recommended.',
        });
      });
    });

    describe('when creating a new pool (no existing pool to mix against)', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Data]: {
                layout: CreateVdevLayout.Mirror,
                width: 2,
                vdevs: [[{ devname: 'sda' }]],
              },
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: 2,
                vdevs: [[{ devname: 'sdb' }, { devname: 'sdc' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, { pool: signal(null) }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('does not warn', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors.find((err) => err.text.includes('Mixing layouts'))).toBeUndefined();
      });
    });

    describe('when adding a dedup vdev with a layout different from existing pool dedup', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Dedup]: {
                layout: CreateVdevLayout.Raidz1,
                width: 3,
                vdevs: [[{ devname: 'sdb' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, {
            pool: signal({
              name: 'pool',
              topology: {
                [VDevType.Dedup]: [
                  { type: TopologyItemType.Mirror, children: [{}, {}] },
                ],
              },
            } as Pool),
          }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('emits a non-blocking dedup mixed-layout warning', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.Warning,
          step: PoolCreationWizardStep.Dedup,
          text: 'Mixing layouts within the dedup class is not recommended.',
        });
      });
    });

    describe('when adding a stripe special vdev on top of an existing mirror special', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Special]: {
                layout: CreateVdevLayout.Stripe,
                width: 1,
                vdevs: [[{ devname: 'sdb' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, {
            pool: signal({
              name: 'pool',
              topology: {
                [VDevType.Special]: [
                  { type: TopologyItemType.Mirror, children: [{}, {}] },
                ],
              },
            } as Pool),
          }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('only surfaces the stripe single-point-of-failure warning, not the mixed-layout one', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors.find((err) => err.text.includes('Mixing layouts'))).toBeUndefined();
        expect(errors).toContainEqual({
          severity: PoolCreationSeverity.ErrorWarning,
          step: PoolCreationWizardStep.Metadata,
          text: 'Adding a stripe special VDEV introduces a single point of failure to your pool.',
        });
      });
    });

    describe('when the new special layout matches the existing pool special layout', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: 2,
                vdevs: [[{ devname: 'sdb' }, { devname: 'sdc' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, {
            pool: signal({
              name: 'pool',
              topology: {
                [VDevType.Special]: [
                  { type: TopologyItemType.Mirror, children: [{}, {}] },
                ],
              },
            } as Pool),
          }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('does not warn', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors.find((err) => err.text.includes('Mixing layouts'))).toBeUndefined();
      });
    });

    describe('when adding the first special vdev to a pool with no existing special class', () => {
      let spectator: SpectatorService<PoolManagerValidationService>;
      const createService = createServiceFactory({
        service: PoolManagerValidationService,
        providers: [
          mockProvider(PoolManagerStore, {
            ...sharedStoreMock,
            topology: signal({
              [VDevType.Special]: {
                layout: CreateVdevLayout.Mirror,
                width: 2,
                vdevs: [[{ devname: 'sdb' }, { devname: 'sdc' }]],
              },
            }),
          }),
          mockProvider(AddVdevsStore, {
            pool: signal({
              name: 'pool',
              topology: {
                [VDevType.Data]: [
                  { type: TopologyItemType.Raidz2, children: [{}, {}, {}, {}] },
                ],
              },
            } as Pool),
          }),
          provideMockStore({
            selectors: [{ selector: selectHasEnclosureSupport, value: true }],
          }),
        ],
      });

      beforeEach(() => {
        spectator = createService();
      });

      it('does not emit a mixed-layout warning when the existing pool has no special class', () => {
        const errors = spectator.service.poolCreationErrors();
        expect(errors.find((err) => err.text.includes('Mixing layouts'))).toBeUndefined();
      });
    });
  });
});
