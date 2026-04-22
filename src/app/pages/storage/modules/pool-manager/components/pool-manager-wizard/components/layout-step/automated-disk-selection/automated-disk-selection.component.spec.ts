import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
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
  const resetStep$ = new Subject<VDevType>();

  let layoutSelect: IxSelectHarness | null;

  const inventory: DetailsDisk[] = [] as DetailsDisk[];

  const createComponent = createComponentFactory({
    component: AutomatedDiskSelectionComponent,
    imports: [
      ReactiveFormsModule,
      CastPipe,
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
        isLoading$: of(false),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        inventory,
        canChangeLayout: true,
        type: VDevType.Data,
        limitLayouts: Object.values(CreateVdevLayout),
        isStepActive: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    layoutSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Layout' }));
  });

  it('shows NormalSelectionComponent for non-dRAID layouts', async () => {
    let normalSelection = spectator.query(NormalSelectionComponent)!;
    expect(normalSelection).not.toBeNull();
    expect(normalSelection.type).toBe(VDevType.Data);
    expect(normalSelection.inventory).toBe(inventory);
    expect(normalSelection.isStepActive).toBe(false);

    await layoutSelect!.setValue('Mirror');

    normalSelection = spectator.query(NormalSelectionComponent)!;
    expect(normalSelection).not.toBeNull();
    expect(normalSelection.layout).toBe(CreateVdevLayout.Mirror);

    expect(spectator.query(DraidSelectionComponent)).toBeNull();
  });

  it('shows DraidSelectionComponent for dRAID layouts', async () => {
    await layoutSelect!.setValue('dRAID2');

    const draidSelection = spectator.query(DraidSelectionComponent)!;
    expect(draidSelection).not.toBeNull();
    expect(draidSelection.layout).toBe(CreateVdevLayout.Draid2);
    expect(draidSelection.inventory).toBe(inventory);
    expect(draidSelection.type).toBe(VDevType.Data);
    expect(draidSelection.isStepActive).toBe(false);

    expect(spectator.query(NormalSelectionComponent)).toBeNull();
  });

  it('does not let the layout change when canChangeLayout is false', async () => {
    spectator.setInput('canChangeLayout', false);

    layoutSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Layout' }));
    expect(layoutSelect).toBeNull();
  });

  it('resets to default values when store emits a reset event', async () => {
    await layoutSelect!.setValue('Mirror');

    startOver$.next();

    expect(await layoutSelect!.getValue()).toBe('');
  });

  it('keeps the sole allowed layout selected after a reset when parity-locked', () => {
    spectator.setInput('limitLayouts', [CreateVdevLayout.Raidz2]);

    resetStep$.next(VDevType.Data);

    expect(spectator.component.layoutControl.value).toBe(CreateVdevLayout.Raidz2);
  });

  it('updates layout in store when it is changed', async () => {
    await layoutSelect!.setValue('Mirror');

    expect(spectator.inject(PoolManagerStore).setTopologyCategoryLayout).toHaveBeenCalledWith(
      VDevType.Data,
      CreateVdevLayout.Mirror,
    );
  });

  it('does not show the data parity hint for data vdevs', () => {
    expect(spectator.query('mat-hint')).toBeNull();
  });

  it('does not show the data parity hint for metadata vdevs when any layout is allowed', () => {
    spectator.setInput('type', VDevType.Special);

    expect(spectator.query('mat-hint')).toBeNull();
  });

  it('shows the single-layout hint for metadata vdevs when the layout is strict-locked', () => {
    spectator.setInput('type', VDevType.Special);
    spectator.setInput('limitLayouts', [CreateVdevLayout.Raidz2]);

    const hint = spectator.query('mat-hint');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('Locked to this layout');
  });

  it('shows the single-layout hint for dedup vdevs when the layout is strict-locked', () => {
    spectator.setInput('type', VDevType.Dedup);
    spectator.setInput('limitLayouts', [CreateVdevLayout.Raidz2]);

    const hint = spectator.query('mat-hint');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('Locked to this layout');
  });

  it('shows the parity-level hint for metadata vdevs when multiple layouts match data parity', () => {
    spectator.setInput('type', VDevType.Special);
    spectator.setInput('limitLayouts', [
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);

    const hint = spectator.query('mat-hint');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('tolerate at least as many drive failures');
  });
});
