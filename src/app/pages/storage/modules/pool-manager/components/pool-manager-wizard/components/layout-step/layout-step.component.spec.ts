import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import {
  AutomatedDiskSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/automated-disk-selection.component';
import {
  CustomLayoutAppliedComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/custom-layout-applied/custom-layout-applied.component';
import {
  LayoutStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import {
  PoolManagerState,
  PoolManagerStore,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('LayoutStepComponent', () => {
  let spectator: Spectator<LayoutStepComponent>;

  const limitLayouts = [CreateVdevLayout.Stripe, CreateVdevLayout.Mirror];
  const inventory = [
    { devname: 'sda' },
    { devname: 'sdb' },
  ] as DetailsDisk[];
  const enclosures = [{ name: 'enclosure' }] as Enclosure[];

  const topologyCategory = {
    layout: CreateVdevLayout.Stripe,
    vdevs: [
      [{ devname: 'sda' }],
    ],
    hasCustomDiskSelection: false,
  } as PoolManagerTopologyCategory;

  const state = {
    topology: {
      [VdevType.Data]: topologyCategory,
    },
    enclosures,
  } as PoolManagerState;
  const state$ = new BehaviorSubject(state);

  const createComponent = createComponentFactory({
    component: LayoutStepComponent,
    declarations: [
      MockComponents(
        AutomatedDiskSelectionComponent,
        CustomLayoutAppliedComponent,
      ),
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        state$: state$.asObservable(),
        resetTopologyCategory: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    state$.next(state);
    spectator = createComponent({
      props: {
        limitLayouts,
        type: VdevType.Data,
        canChangeLayout: true,
        inventory,
      },
    });
  });

  it('by default shows automated disk selection passing inputs', () => {
    const automatedSelection = spectator.query(AutomatedDiskSelectionComponent)!;
    expect(automatedSelection).toBeTruthy();
    expect(automatedSelection.limitLayouts).toBe(limitLayouts);
    expect(automatedSelection.type).toBe(VdevType.Data);
    expect(automatedSelection.canChangeLayout).toBe(true);
    expect(automatedSelection.inventory).toBe(inventory);
  });

  it('shows custom layout block when custom layout has been applied', () => {
    state$.next({
      ...state,
      topology: {
        ...state.topology,
        [VdevType.Data]: {
          ...state.topology[VdevType.Data],
          hasCustomDiskSelection: true,
        },
      },
    });
    spectator.detectChanges();

    expect(spectator.query(AutomatedDiskSelectionComponent)).toBeFalsy();
    const customLayout = spectator.query(CustomLayoutAppliedComponent)!;
    expect(customLayout).toBeTruthy();
    expect(customLayout.type).toBe(VdevType.Data);
    expect(customLayout.vdevs).toBe(topologyCategory.vdevs);
  });
});
