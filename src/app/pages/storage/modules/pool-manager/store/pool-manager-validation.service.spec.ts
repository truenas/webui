import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DispersalStrategy } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolCreationError } from 'app/pages/storage/modules/pool-manager/interfaces/pool-creation-error';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { selectSystemFeatures } from 'app/store/system-info/system-info.selectors';

describe('PoolManagerValidationService', () => {
  describe('required steps validation', () => {
    let spectator: SpectatorService<PoolManagerValidationService>;

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
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectSystemFeatures,
              value: {
                enclosure: true,
              },
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    it('generates errors for required steps', () => {
      let result: PoolCreationError[] = [];

      spectator.service.getPoolCreationErrors().subscribe((value) => {
        result = value;
      });

      expect(result).toEqual([
        {
          severity: 'error',
          step: 'general',
          text: 'Name not added',
        },
        {
          severity: 'error',
          step: 'enclosure',
          text: 'No Enclosure selected for a Limit Pool To A Single Enclosure.',
        },
        {
          severity: 'error',
          step: 'data',
          text: 'At least 1 data VDEV is required.',
        },
      ]);
    });

    it('generates top level error for each step if exists', () => {
      let result: Partial<{ [key in PoolCreationWizardStep]: string | null }> = {};

      spectator.service.getTopLevelErrorsForEachStep().subscribe((value) => {
        result = value;
      });

      expect(result).toEqual({
        cache: null,
        data: 'At least 1 data VDEV is required.',
        dedup: null,
        enclosure: 'No Enclosure selected for a Limit Pool To A Single Enclosure.',
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

    const mockName$ = of('No error for name');
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
          enclosureSettings$: mockEnclosureSettings$,
          topology$: mockTopology$,
          hasMultipleEnclosuresAfterFirstStep$: mockHasMultipleEnclosuresAfterFirstStep$,
        }),
        provideMockStore({
          selectors: [
            {
              selector: selectSystemFeatures,
              value: {
                enclosure: true,
              },
            },
          ],
        }),
      ],
    });

    beforeEach(() => {
      spectator = createService();
    });

    it('generates warnings for steps', () => {
      let result: PoolCreationError[] = [];

      spectator.service.getPoolCreationErrors().subscribe((value) => {
        result = value;
      });

      expect(result).toEqual([
        {
          severity: 'warning',
          step: 'log',
          text: 'A stripe log vdev may result in data loss if it fails combined with a power outage.',
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
          text: 'A stripe data vdev is highly discouraged and will result in data loss if it fails',
        },
      ]);
    });

    it('generates top level warnings for each step if exists', () => {
      let result: Partial<{ [key in PoolCreationWizardStep]: string | null }> = {};

      spectator.service.getTopLevelWarningsForEachStep().subscribe((value) => {
        result = value;
      });

      expect(result).toEqual(
        {
          cache: null,
          data: 'A stripe data vdev is highly discouraged and will result in data loss if it fails',
          dedup: null,
          enclosure: null,
          general: null,
          log: 'A stripe log vdev may result in data loss if it fails combined with a power outage.',
          metadata: null,
          review: 'Some of the selected disks have exported pools on them. Using those disks will make existing pools on them unable to be imported. You will lose any and all data in selected disks.',
          spare: null,
        },
      );
    });
  });
});
