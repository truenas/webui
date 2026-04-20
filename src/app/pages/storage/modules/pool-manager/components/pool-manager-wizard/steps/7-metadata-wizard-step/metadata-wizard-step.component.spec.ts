import { CdkStepper } from '@angular/cdk/stepper';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
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

  const createComponent = createComponentFactory({
    component: MetadataWizardStepComponent,
    declarations: [
      MockComponent(LayoutStepComponent),
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(AddVdevsStore, {
        pool$: of(null),
        isLoading$: of(false),
      }),
      mockProvider(PoolManagerStore, {
        topology$: of({
          [VDevType.Data]: { layout: CreateVdevLayout.Raidz1 },
        } as PoolManagerTopology),
        getInventoryForStep: jest.fn(() => of(fakeInventory)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('has the correct inputs', () => {
    const layoutComponent = spectator.query(LayoutStepComponent)!;
    expect(layoutComponent.description).toBe(helptextPoolCreation.specialVdevDescription);
    expect(layoutComponent.inventory).toStrictEqual([...fakeInventory]);
    expect(layoutComponent.type).toStrictEqual(VDevType.Special);
  });

  describe('when creating a new pool without a data layout chosen yet', () => {
    const createComponentNoLayout = createComponentFactory({
      component: MetadataWizardStepComponent,
      declarations: [
        MockComponent(LayoutStepComponent),
      ],
      providers: [
        mockProvider(CdkStepper),
        mockProvider(AddVdevsStore, {
          pool$: of(null),
          isLoading$: of(false),
        }),
        mockProvider(PoolManagerStore, {
          topology$: of({
            [VDevType.Data]: { layout: null },
          } as PoolManagerTopology),
          getInventoryForStep: jest.fn(() => of(fakeInventory)),
        }),
      ],
    });

    it('allows any non-dRAID layout when no data layout is set', () => {
      spectator = createComponentNoLayout();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.canChangeLayout).toBeTruthy();
      expect(layoutComponent.limitLayouts).toStrictEqual([...nonDraidLayouts]);
    });
  });

  describe('when creating a new pool with a RAIDZ1 data layout', () => {
    it('locks special layout to match the wizard data layout', () => {
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz1]);
      expect(layoutComponent.canChangeLayout).toBeFalsy();
    });
  });

  describe('when creating a new pool with a DRAID2 data layout', () => {
    const createComponentDraid = createComponentFactory({
      component: MetadataWizardStepComponent,
      declarations: [
        MockComponent(LayoutStepComponent),
      ],
      providers: [
        mockProvider(CdkStepper),
        mockProvider(AddVdevsStore, {
          pool$: of(null),
          isLoading$: of(false),
        }),
        mockProvider(PoolManagerStore, {
          topology$: of({
            [VDevType.Data]: { layout: CreateVdevLayout.Draid2 },
          } as PoolManagerTopology),
          getInventoryForStep: jest.fn(() => of(fakeInventory)),
        }),
      ],
    });

    it('locks special layout to the non-dRAID equivalent', () => {
      spectator = createComponentDraid();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz2]);
      expect(layoutComponent.canChangeLayout).toBeFalsy();
    });
  });

  describe('when adding the first special vdev to an existing pool', () => {
    const createComponentExistingData = createComponentFactory({
      component: MetadataWizardStepComponent,
      declarations: [
        MockComponent(LayoutStepComponent),
      ],
      providers: [
        mockProvider(CdkStepper),
        mockProvider(AddVdevsStore, {
          pool$: of({
            topology: {
              [VDevType.Data]: [
                { type: TopologyItemType.Raidz2, children: [{}, {}, {}, {}] },
              ] as VDevItem[],
              [VDevType.Special]: [] as VDevItem[],
            },
          } as Pool),
          isLoading$: of(false),
        }),
        mockProvider(PoolManagerStore, {
          topology$: of({
            [VDevType.Data]: { layout: null },
          } as PoolManagerTopology),
          getInventoryForStep: jest.fn(() => of(fakeInventory)),
        }),
      ],
    });

    it('locks special layout to match the existing pool data layout', () => {
      spectator = createComponentExistingData();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Raidz2]);
      expect(layoutComponent.canChangeLayout).toBeFalsy();
    });
  });

  describe('when pool has existing special vdevs', () => {
    const createComponentWithPool = createComponentFactory({
      component: MetadataWizardStepComponent,
      declarations: [
        MockComponent(LayoutStepComponent),
      ],
      providers: [
        mockProvider(CdkStepper),
        mockProvider(AddVdevsStore, {
          pool$: of({
            topology: {
              [VDevType.Special]: [
                { type: TopologyItemType.Mirror, children: [{}, {}] },
              ] as VDevItem[],
            },
          } as Pool),
          isLoading$: of(false),
        }),
        mockProvider(PoolManagerStore, {
          topology$: of({
            [VDevType.Data]: { layout: CreateVdevLayout.Raidz1 },
          } as PoolManagerTopology),
          getInventoryForStep: jest.fn(() => of(fakeInventory)),
        }),
      ],
    });

    it('locks layout to match existing vdev layout', () => {
      spectator = createComponentWithPool();
      const layoutComponent = spectator.query(LayoutStepComponent)!;
      expect(layoutComponent.limitLayouts).toStrictEqual([CreateVdevLayout.Mirror]);
      expect(layoutComponent.canChangeLayout).toBeFalsy();
    });
  });
});
