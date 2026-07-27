import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnSelectHarness } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  DiskSizeSelectsComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';
import {
  NormalSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/normal-selection/normal-selection.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('NormalSelectionComponent', () => {
  let spectator: Spectator<NormalSelectionComponent>;
  let loader: HarnessLoader;

  let widthSelect: TnSelectHarness;
  let vdevsSelect: TnSelectHarness;
  let sizeSelect: TnSelectHarness;

  const unusedDisks: DetailsDisk[] = [
    {
      devname: 'sdo',
      size: 12 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdr',
      size: 12 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdq',
      size: 12 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdw',
      size: 12 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdt',
      size: 12 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdu',
      size: 12 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdh',
      size: 12 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdg',
      size: 14 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdj',
      size: 14 * TiB,
      type: DiskType.Hdd,
    },
    {
      devname: 'sdk',
      size: TiB,
      type: DiskType.Hdd,
    },
  ] as DetailsDisk[];
  const startOver$ = new Subject<void>();
  const resetStep$ = new Subject<void>();

  const createComponent = createComponentFactory({
    component: NormalSelectionComponent,
    imports: [
      ReactiveFormsModule,
      DiskSizeSelectsComponent,
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        openManualSelectionDialog: jest.fn(),
        startOver$,
        resetStep$,
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        layout: CreateVdevLayout.Stripe,
        type: VDevType.Data,
        inventory: [...unusedDisks],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    widthSelect = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="width"]' }));
    vdevsSelect = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="vdevsNumber"]' }));
    sizeSelect = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="sizeAndType"]' }));
  });

  it('updates width and vdev options when layout is mirror', async () => {
    spectator.setInput('layout', CreateVdevLayout.Mirror);
    await sizeSelect.selectOption('12 TiB (HDD)');

    expect(await widthSelect.getOptions())
      .toStrictEqual(['2', '3', '4', '5', '6', '7']);

    await widthSelect.selectOption('2');

    expect(await vdevsSelect.getOptions()).toStrictEqual(['1', '2', '3']);
  });

  it('raises the mirror width floor when minMirrorWidth is set', async () => {
    spectator.setInput('layout', CreateVdevLayout.Mirror);
    spectator.setInput('minMirrorWidth', 3);
    await sizeSelect.selectOption('12 TiB (HDD)');

    expect(await widthSelect.getOptions()).toStrictEqual(['3', '4', '5', '6', '7']);
  });

  it('does not affect non-Mirror layouts when minMirrorWidth is set', async () => {
    spectator.setInput('layout', CreateVdevLayout.Raidz1);
    spectator.setInput('minMirrorWidth', 4);
    await sizeSelect.selectOption('12 TiB (HDD)');

    expect(await widthSelect.getOptions()).toStrictEqual(['3', '4', '5', '6', '7']);
  });

  it('updates width and vdev options when layout changes to Raidz1', async () => {
    spectator.setInput('layout', CreateVdevLayout.Raidz1);
    await sizeSelect.selectOption('12 TiB (HDD)');

    expect(await widthSelect.getOptions())
      .toStrictEqual(['3', '4', '5', '6', '7']);

    await widthSelect.selectOption('3');

    expect(await vdevsSelect.getOptions())
      .toStrictEqual(['1', '2']);
  });

  it('updates width and vdev options when layout changes to Raidz2', async () => {
    spectator.setInput('layout', CreateVdevLayout.Raidz2);
    await sizeSelect.selectOption('12 TiB (HDD)');

    expect(await widthSelect.getOptions())
      .toStrictEqual(['4', '5', '6', '7']);

    await widthSelect.selectOption('4');

    expect(await vdevsSelect.getOptions()).toStrictEqual(['1']);
  });

  it('updates width and vdev options when layout changes to Raidz3', async () => {
    spectator.setInput('layout', CreateVdevLayout.Raidz3);
    await sizeSelect.selectOption('12 TiB (HDD)');

    expect(await widthSelect.getOptions())
      .toStrictEqual(['5', '6', '7']);

    await widthSelect.selectOption('5');

    expect(await vdevsSelect.getOptions()).toStrictEqual(['1']);
  });

  it('updates width and vdev options when layout changes to Stripe', async () => {
    spectator.setInput('layout', CreateVdevLayout.Stripe);
    await sizeSelect.selectOption('12 TiB (HDD)');

    expect(await widthSelect.getOptions())
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);

    await widthSelect.selectOption('1');

    expect(await vdevsSelect.getOptions())
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('auto fills select when only one value is available', async () => {
    spectator.setInput('isStepActive', true);
    spectator.setInput('layout', CreateVdevLayout.Stripe);
    await sizeSelect.selectOption('1 TiB (HDD)');

    expect(await widthSelect.getOptions()).toStrictEqual(['1']);

    const widthValue = await widthSelect.getDisplayText();
    expect(widthValue).toBe('1');
    // getOptions leaves the panel open; close it so the next select's option
    // read isn't polluted by this one's still-open overlay.
    await widthSelect.close();

    expect(await vdevsSelect.getOptions()).toStrictEqual(['1']);

    const vdevsValue = await vdevsSelect.getDisplayText();
    expect(vdevsValue).toBe('1');
  });

  it('saves the topology layout on form updates', async () => {
    const poolManagerStore = spectator.inject(PoolManagerStore);

    spectator.setInput('layout', CreateVdevLayout.Mirror);
    await sizeSelect.selectOption('12 TiB (HDD)');

    await widthSelect.selectOption('2');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VDevType.Data, {
      width: 2,
      vdevsNumber: null,
    });

    await vdevsSelect.selectOption('2');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VDevType.Data, {
      width: 2,
      vdevsNumber: 2,
    });
  });

  it('disables dependent fields until they are valid', async () => {
    expect(await widthSelect.isDisabled()).toBeTruthy();
    expect(await vdevsSelect.isDisabled()).toBeTruthy();
    spectator.setInput('layout', CreateVdevLayout.Mirror);
    expect(await vdevsSelect.isDisabled()).toBeTruthy();
    expect(await widthSelect.isDisabled()).toBeTruthy();
    await sizeSelect.selectOption('12 TiB (HDD)');
    expect(await widthSelect.isDisabled()).toBeFalsy();
    expect(await vdevsSelect.isDisabled()).toBeFalsy();
  });

  it('resets to default values when store emits a reset event', async () => {
    spectator.setInput('layout', CreateVdevLayout.Mirror);
    await sizeSelect.selectOption('12 TiB (HDD)');
    await widthSelect.selectOption('2');
    await vdevsSelect.selectOption('2');

    startOver$.next();

    expect(await widthSelect.getDisplayText()).toBe('Select an option');
    expect(await vdevsSelect.getDisplayText()).toBe('Select an option');
  });

  it('calls store.openManualSelectionDialog when button clicked', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Manual Disk Selection' }));
    await button.click();

    expect(spectator.inject(PoolManagerStore).openManualSelectionDialog).toHaveBeenCalled();
  });
});
