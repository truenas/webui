import { CdkStepper } from '@angular/cdk/stepper';
import {
  mockProvider, Spectator, SpectatorFactory, createComponentFactory,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { CreateVdevLayout, TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { Pool } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { DedupWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/8-dedup-wizard-step/dedup-wizard-step.component';
import { PoolManagerStore, PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { nonDraidLayouts } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

describe('DedupWizardStepComponent', () => {
  let spectator: Spectator<DedupWizardStepComponent>;

  const fakeInventory = [
    {
      identifier: '{serial_lunid}8HG7MZJH_5000cca2700de678',
      name: 'sdo',
      number: 2272,
      serial: '8HG7MZJH',
      size: 12000138625024,
      type: 'HDD',
    },
    {
      identifier: '{serial_lunid}8DJ61EBH_5000cca2537bba6c',
      name: 'sdv',
      number: 16720,
      serial: '8DJ61EBH',
      size: 12000138625024,
      type: 'HDD',
    },
  ];

  const makeFactory = ({
    pool = null,
    dataLayout = null,
  }: {
    pool?: Partial<Pool> | null;
    dataLayout?: CreateVdevLayout | null;
  } = {}): SpectatorFactory<DedupWizardStepComponent> => createComponentFactory({
    component: DedupWizardStepComponent,
    declarations: [
      MockComponent(LayoutStepComponent),
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(AddVdevsStore, {
        pool$: of(pool as Pool | null),
        isLoading$: of(false),
      }),
      mockProvider(PoolManagerStore, {
        topology$: of({
          [VDevType.Data]: { layout: dataLayout },
        } as PoolManagerTopology),
        getInventoryForStep: jest.fn(() => of(fakeInventory)),
      }),
    ],
  });

  describe('when creating a new pool with a RAIDZ1 data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Raidz1 });

    beforeEach(() => {
      spectator = createComponent();
    });

    it('has the correct inputs', () => {
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.description).toBe(helptextPoolCreation.dedupVdevDescription);
      expect(layoutComponent.inventory).toStrictEqual([...fakeInventory]);
      expect(layoutComponent.type).toStrictEqual(VDevType.Dedup);
    });

    it('locks dedup layout to match the wizard data layout', () => {
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz1]);
      expect(layoutComponent.canChangeLayout).toBeFalsy();
    });
  });

  describe('when creating a new pool without a data layout chosen yet', () => {
    const createComponent = makeFactory();

    it('allows any non-dRAID layout', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.canChangeLayout).toBeTruthy();
      expect(layoutComponent.limitLayouts).toStrictEqual([...nonDraidLayouts]);
    });
  });

  describe('when creating a new pool with a DRAID2 data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Draid2 });

    it('locks dedup layout to the non-dRAID equivalent', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz2]);
      expect(layoutComponent.canChangeLayout).toBeFalsy();
    });
  });

  describe('when adding the first dedup vdev to an existing pool', () => {
    const createComponent = makeFactory({
      pool: {
        topology: {
          [VDevType.Data]: [
            { type: TopologyItemType.Raidz2, children: [{}, {}, {}, {}] },
          ] as VDevItem[],
          [VDevType.Dedup]: [] as VDevItem[],
        },
      } as Pool,
    });

    it('locks dedup layout to match the existing pool data layout', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz2]);
      expect(layoutComponent.canChangeLayout).toBeFalsy();
    });
  });

  describe('when pool has existing dedup vdevs', () => {
    const createComponent = makeFactory({
      pool: {
        topology: {
          [VDevType.Dedup]: [
            { type: TopologyItemType.Mirror, children: [{}, {}] },
          ] as VDevItem[],
        },
      } as Pool,
      dataLayout: CreateVdevLayout.Raidz1,
    });

    it('locks layout to match existing vdev layout', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Mirror]);
      expect(layoutComponent.canChangeLayout).toBeFalsy();
    });
  });
});
