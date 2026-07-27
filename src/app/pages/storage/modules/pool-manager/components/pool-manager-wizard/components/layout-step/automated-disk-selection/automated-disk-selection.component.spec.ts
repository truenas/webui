import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnFormFieldComponent, TnFormFieldHarness, TnSelectComponent, TnSelectHarness,
} from '@truenas/ui-components';
import { MockComponents, ngMocks } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
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

// `MockComponents(NormalSelectionComponent, DraidSelectionComponent)` deep-mocks their
// standalone import graphs, which transitively include the tn-* form primitives — that
// mock leaks into the TestBed and blanks *this* component's own real Layout field.
ngMocks.globalKeep(TnFormFieldComponent);
ngMocks.globalKeep(TnSelectComponent);

describe('AutomatedDiskSelection', () => {
  let spectator: Spectator<AutomatedDiskSelectionComponent>;
  let loader: HarnessLoader;

  const startOver$ = new Subject<void>();
  const resetStep$ = new Subject<VDevType>();

  let layoutSelect: TnSelectHarness | null;

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
    layoutSelect = await getLayoutSelect();
  });

  // Scoped to this component's own `.layout-container`, so "the Layout select is gone" can't be
  // satisfied by an unrelated select disappearing — the read-only branch renders no such wrapper.
  function getLayoutSelect(): Promise<TnSelectHarness | null> {
    return loader.getHarnessOrNull(TnSelectHarness.with({ ancestor: '.layout-container' }));
  }

  async function getLayoutHint(): Promise<string | null> {
    const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'Layout' }));
    return field.getHint();
  }

  it('shows NormalSelectionComponent for non-dRAID layouts', async () => {
    let normalSelection = spectator.query(NormalSelectionComponent)!;
    expect(normalSelection).not.toBeNull();
    expect(normalSelection.type).toBe(VDevType.Data);
    expect(normalSelection.inventory).toBe(inventory);
    expect(normalSelection.isStepActive).toBe(false);

    await layoutSelect!.selectOption('Mirror');

    normalSelection = spectator.query(NormalSelectionComponent)!;
    expect(normalSelection).not.toBeNull();
    expect(normalSelection.layout).toBe(CreateVdevLayout.Mirror);

    expect(spectator.query(DraidSelectionComponent)).toBeNull();
  });

  it('shows DraidSelectionComponent for dRAID layouts', async () => {
    await layoutSelect!.selectOption('dRAID2');

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

    layoutSelect = await getLayoutSelect();
    expect(layoutSelect).toBeNull();
  });

  it('resets to default values when store emits a reset event', async () => {
    await layoutSelect!.selectOption('Mirror');

    startOver$.next();

    expect(await layoutSelect!.getDisplayText()).toBe('Select an option');
  });

  it('keeps the sole allowed layout selected after a reset when parity-locked', () => {
    spectator.setInput('limitLayouts', [CreateVdevLayout.Raidz2]);

    resetStep$.next(VDevType.Data);

    expect(spectator.component.layoutControl.value).toBe(CreateVdevLayout.Raidz2);
  });

  it('updates layout in store when it is changed', async () => {
    await layoutSelect!.selectOption('Mirror');

    expect(spectator.inject(PoolManagerStore).setTopologyCategoryLayout).toHaveBeenCalledWith(
      VDevType.Data,
      CreateVdevLayout.Mirror,
    );
  });

  it('does not show the data parity hint for data vdevs', async () => {
    expect(await getLayoutHint()).toBeNull();
  });

  it('does not show the data parity hint for metadata vdevs when any layout is allowed', async () => {
    spectator.setInput('type', VDevType.Special);

    expect(await getLayoutHint()).toBeNull();
  });

  it('shows the single-layout hint for metadata vdevs when the layout is strict-locked', async () => {
    spectator.setInput('type', VDevType.Special);
    spectator.setInput('limitLayouts', [CreateVdevLayout.Raidz2]);

    expect(await getLayoutHint()).toContain('Locked to this layout');
  });

  it('shows the single-layout hint for dedup vdevs when the layout is strict-locked', async () => {
    spectator.setInput('type', VDevType.Dedup);
    spectator.setInput('limitLayouts', [CreateVdevLayout.Raidz2]);

    expect(await getLayoutHint()).toContain('Locked to this layout');
  });

  it('shows the parity-level hint for metadata vdevs when multiple layouts match data parity', async () => {
    spectator.setInput('type', VDevType.Special);
    spectator.setInput('limitLayouts', [
      CreateVdevLayout.Mirror, CreateVdevLayout.Raidz2, CreateVdevLayout.Raidz3,
    ]);

    expect(await getLayoutHint()).toContain('tolerate at least as many drive failures');
  });
});
