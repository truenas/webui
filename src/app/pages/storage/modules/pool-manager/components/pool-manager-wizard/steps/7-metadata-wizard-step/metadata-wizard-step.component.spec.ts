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
import { MetadataWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/7-metadata-wizard-step/metadata-wizard-step.component';
import { PoolManagerStore, PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { nonDraidLayouts } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

describe('MetadataWizardStepComponent', () => {
  let spectator: Spectator<MetadataWizardStepComponent>;

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

    it('locks special layout to match the wizard data layout', () => {
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz1]);
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
    });
  });

  describe('when creating a new pool with a DRAID2 data layout', () => {
    const createComponent = makeFactory({ dataLayout: CreateVdevLayout.Draid2 });

    it('locks special layout to the non-dRAID equivalent', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz2]);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
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

    it('locks special layout to match the existing pool data layout', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz2]);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });

  describe('when the locked layout no longer allows the current store selection', () => {
    const createComponent = makeFactory({
      dataLayout: CreateVdevLayout.Raidz2,
      specialLayout: CreateVdevLayout.Mirror,
    });

    it('resets the special step so the invalid selection is cleared', () => {
      spectator = createComponent();
      const store = spectator.inject(PoolManagerStore);
      expect(store.resetStep).toHaveBeenCalledWith(VDevType.Special);
    });
  });

  describe('when the current store layout matches the lock', () => {
    const createComponent = makeFactory({
      dataLayout: CreateVdevLayout.Raidz2,
      specialLayout: CreateVdevLayout.Raidz2,
    });

    it('does not reset the special step', () => {
      spectator = createComponent();
      const store = spectator.inject(PoolManagerStore);
      expect(store.resetStep).not.toHaveBeenCalled();
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
    });

    it('locks layout to match existing vdev layout', () => {
      spectator = createComponent();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Mirror]);
      expect(layoutComponent.canChangeLayout).toBeTruthy();
    });
  });
});
