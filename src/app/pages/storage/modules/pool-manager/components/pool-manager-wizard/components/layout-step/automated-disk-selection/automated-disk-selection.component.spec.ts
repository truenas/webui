import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { Subject } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  AutomatedDiskSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/automated-disk-selection.component';
import {
  DraidSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/draid-selection/draid-selection.component';
import {
  NormalSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/normal-selection/normal-selection.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('AutomatedDiskSelection', () => {
  let spectator: Spectator<AutomatedDiskSelectionComponent>;
  let loader: HarnessLoader;

  const startOver$ = new Subject<void>();
  const resetStep$ = new Subject<VdevType>();

  let layoutSelect: IxSelectHarness;

  const inventory: UnusedDisk[] = [] as UnusedDisk[];

  const createComponent = createComponentFactory({
    component: AutomatedDiskSelectionComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      MockComponents(
        NormalSelectionComponent,
        DraidSelectionComponent,
      ),
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        startOver$,
        resetStep$,
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        inventory,
        canChangeLayout: true,
        type: VdevType.Data,
        limitLayouts: Object.values(CreateVdevLayout),
        isStepActive: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    layoutSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Layout' }));
  });

  it('shows NormalSelectionComponent for non-dRAID layouts', async () => {
    let normalSelection = spectator.query(NormalSelectionComponent);
    expect(normalSelection).not.toBeNull();
    expect(normalSelection.type).toBe(VdevType.Data);
    expect(normalSelection.inventory).toBe(inventory);
    expect(normalSelection.isStepActive).toBe(false);

    await layoutSelect.setValue('Mirror');

    normalSelection = spectator.query(NormalSelectionComponent);
    expect(normalSelection).not.toBeNull();
    expect(normalSelection.layout).toBe(CreateVdevLayout.Mirror);

    expect(spectator.query(DraidSelectionComponent)).toBeNull();
  });

  it('shows DraidSelectionComponent for dRAID layouts', async () => {
    await layoutSelect.setValue('dRAID2');

    const draidSelection = spectator.query(DraidSelectionComponent);
    expect(draidSelection).not.toBeNull();
    expect(draidSelection.layout).toBe(CreateVdevLayout.Draid2);
    expect(draidSelection.inventory).toBe(inventory);
    expect(draidSelection.type).toBe(VdevType.Data);
    expect(draidSelection.isStepActive).toBe(false);

    expect(spectator.query(NormalSelectionComponent)).toBeNull();
  });

  it('doesnt let the layout change when canChangeLayout is false', async () => {
    spectator.setInput('canChangeLayout', false);

    layoutSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Layout' }));
    expect(layoutSelect).toBeNull();
  });

  it('resets to default values when store emits a reset event', async () => {
    await layoutSelect.setValue('Mirror');

    startOver$.next();

    expect(await layoutSelect.getValue()).toBe('');
  });

  it('updates layout in store when it is changed', async () => {
    await layoutSelect.setValue('Mirror');

    expect(spectator.inject(PoolManagerStore).setTopologyCategoryLayout).toHaveBeenCalledWith(
      VdevType.Data,
      CreateVdevLayout.Mirror,
    );
  });
});
