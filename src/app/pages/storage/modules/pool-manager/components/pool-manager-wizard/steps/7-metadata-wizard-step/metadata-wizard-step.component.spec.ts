import { CdkStepper } from '@angular/cdk/stepper';
import {
  mockProvider, Spectator, SpectatorFactory, createComponentFactory,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { CreateVdevLayout, TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { MetadataWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/7-metadata-wizard-step/metadata-wizard-step.component';
import { PoolManagerStore, PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { nonDraidLayouts } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

describe('MetadataWizardStepComponent', () => {
  let spectator: Spectator<MetadataWizardStepComponent>;

  const fakeInventory = [
    { name: 'sdo', size: 12000138625024 },
    { name: 'sdv', size: 12000138625024 },
  ] as DetailsDisk[];

  const layoutsWithoutStripeOrDraid = [
    CreateVdevLayout.Mirror, CreateVdevLayout.Raidz1, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
  ];

  const makeFactory = ({
    pool = null,
    dataLayout = null,
    specialLayout = null,
  }: {
    pool?: Partial<Pool> | null;
    dataLayout?: CreateVdevLayout | null;
    specialLayout?: CreateVdevLayout | null;
  } = {}): SpectatorFactory<MetadataWizardStepComponent> => createComponentFactory({
    component: MetadataWizardStepComponent,
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
          [VDevType.Special]: { layout: specialLayout },
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
      expect(layoutComponent.description).toBe(helptextPoolCreation.specialVdevDescription);
      expect(layoutComponent.inventory).toStrictEqual([...fakeInventory]);
      expect(layoutComponent.type).toStrictEqual(VDevType.Special);
    });

    it('exposes Mirror, RAIDZ1, RAIDZ2 and RAIDZ3 with a 2-way Mirror floor', () => {
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
      expect(layoutComponent.minMirrorWidth).toBe(2);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });

  describe('when creating a new pool without a data layout chosen yet', () => {
    const createComponent = makeFactory();

    it('hides Stripe and dRAID until data is set', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.canChangeLayout).toBeTruthy();
      expect(layoutComponent.limitLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
      expect(layoutComponent.minMirrorWidth).toBe(2);
    });
  });

  describe('when creating a new pool with a DRAID2 data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Draid2 });

    it('still allows Mirror + RAIDZ1/2/3 (no parity gating, no dRAID exposure)', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
      expect(layoutComponent.minMirrorWidth).toBe(2);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });

  describe('when creating a new pool with a 3-way mirror data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Mirror });

    it('keeps the Mirror floor at 2-way regardless of data mirror width', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
      expect(layoutComponent.minMirrorWidth).toBe(2);
    });
  });

  describe('when creating a new pool with a Stripe data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Stripe });

    it('exposes Stripe alongside the redundant layouts', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([...nonDraidLayouts]);
      expect(layoutComponent.minMirrorWidth).toBe(2);
    });
  });

  describe('when adding the first special vdev to an existing pool', () => {
    const createComponent = makeFactory({
      pool: {
        topology: {
          [VDevType.Data]: [
            { type: TopologyItemType.Raidz2, children: [{}, {}, {}, {}] },
          ] as VDevItem[],
          [VDevType.Special]: [] as VDevItem[],
        },
      } as Pool,
    });

    it('exposes Mirror + RAIDZ1/2/3 regardless of existing data parity', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
      expect(layoutComponent.minMirrorWidth).toBe(2);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });

  describe('when pool has existing special vdevs of a different layout', () => {
    const createComponent = makeFactory({
      pool: {
        topology: {
          [VDevType.Special]: [
            { type: TopologyItemType.Mirror, children: [{}, {}] },
          ] as VDevItem[],
        },
      } as Pool,
      dataLayout: CreateVdevLayout.Raidz1,
    });

    it('does not lock to the existing category layout (mixing now warned, not blocked)', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual(layoutsWithoutStripeOrDraid);
      expect(layoutComponent.minMirrorWidth).toBe(2);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });
});
