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

  const makeFactory = ({
    pool = null,
    dataLayout = null,
    dataWidth = null,
    specialLayout = null,
  }: {
    pool?: Partial<Pool> | null;
    dataLayout?: CreateVdevLayout | null;
    dataWidth?: number | null;
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
          [VDevType.Data]: { layout: dataLayout, width: dataWidth },
          [VDevType.Special]: { layout: specialLayout },
        } as PoolManagerTopology),
        getInventoryForStep: jest.fn(() => of(fakeInventory)),
      }),
    ],
  });

  describe('when creating a new pool with a RAIDZ1 data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Raidz1, dataWidth: 3 });

    beforeEach(() => {
      spectator = createComponent();
    });

    it('has the correct inputs', () => {
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.description).toBe(helptextPoolCreation.specialVdevDescription);
      expect(layoutComponent.inventory).toStrictEqual([...fakeInventory]);
      expect(layoutComponent.type).toStrictEqual(VDevType.Special);
    });

    it('allows any layout that tolerates at least 1 drive failure', () => {
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([
        CreateVdevLayout.Mirror, CreateVdevLayout.Raidz1, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
      ]);
      expect(layoutComponent.minMirrorWidth).toBe(2);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });

  describe('when creating a new pool without a data layout chosen yet', () => {
    const createComponent = makeFactory();

    it('allows any non-dRAID layout', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.canChangeLayout).toBeTruthy();
      expect(layoutComponent.limitLayouts).toStrictEqual([...nonDraidLayouts]);
      expect(layoutComponent.minMirrorWidth).toBe(2);
    });
  });

  describe('when creating a new pool with a DRAID2 data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Draid2, dataWidth: 4 });

    it('matches dRAID2 parity: RAIDZ2, RAIDZ3, or a 3+-way mirror', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([
        CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
      ]);
      expect(layoutComponent.minMirrorWidth).toBe(3);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });

  describe('when creating a new pool with a 3-way mirror data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Mirror, dataWidth: 3 });

    it('raises minMirrorWidth to match the data mirror width', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([
        CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
      ]);
      expect(layoutComponent.minMirrorWidth).toBe(3);
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

    it('matches existing data parity: RAIDZ2, RAIDZ3, or 3+-way mirror', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([
        CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
      ]);
      expect(layoutComponent.minMirrorWidth).toBe(3);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });

  describe('when the lock changes with a stale store selection', () => {
    const createComponent = makeFactory({
      dataLayout: CreateVdevLayout.Raidz2,
      dataWidth: 4,
      specialLayout: CreateVdevLayout.Stripe,
    });

    it('applies the new parity lock even while the store selection is stale', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([
        CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
      ]);
      expect(layoutComponent.minMirrorWidth).toBe(3);
    });
  });

  describe('when pool has existing special vdevs', () => {
    const createComponent = makeFactory({
      pool: {
        topology: {
          [VDevType.Special]: [
            { type: TopologyItemType.Mirror, children: [{}, {}] },
          ] as VDevItem[],
        },
      } as Pool,
      dataLayout: CreateVdevLayout.Raidz1,
      dataWidth: 3,
    });

    it('strict-locks to the existing category layout (no parity-level fan-out)', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Mirror]);
      expect(layoutComponent.minMirrorWidth).toBe(2);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });
});
