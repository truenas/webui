import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
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

  let widthSelect: IxSelectHarness;
  let vdevsSelect: IxSelectHarness;
  let sizeSelect: IxSelectHarness;

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
        getLayoutsForVdevType: jest.fn((vdevType: VdevType) => {
          switch (vdevType) {
            case VdevType.Cache:
              return of([CreateVdevLayout.Stripe]);
            case VdevType.Dedup:
              return of([CreateVdevLayout.Mirror]);
            case VdevType.Log:
              return of([CreateVdevLayout.Mirror, CreateVdevLayout.Stripe]);
            case VdevType.Spare:
              return of([CreateVdevLayout.Stripe]);
            case VdevType.Special:
              return of([CreateVdevLayout.Mirror]);
            default:
              return of([...Object.values(CreateVdevLayout)]);
          }
        }),
        startOver$,
        resetStep$,
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        layout: CreateVdevLayout.Stripe,
        type: VdevType.Data,
        inventory: [...unusedDisks],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));
  });

  it('updates width and vdev options when layout is mirror', async () => {
    spectator.setInput('layout', CreateVdevLayout.Mirror);
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['2', '3', '4', '5', '6', '7']);

    await widthSelect.setValue('2');

    expect(await vdevsSelect.getOptionLabels()).toStrictEqual(['1', '2', '3']);
  });

  it('updates width and vdev options when layout changes to Raidz1', async () => {
    spectator.setInput('layout', CreateVdevLayout.Raidz1);
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['3', '4', '5', '6', '7']);

    await widthSelect.setValue('3');

    expect(await vdevsSelect.getOptionLabels())
      .toStrictEqual(['1', '2']);
  });

  it('updates width and vdev options when layout changes to Raidz2', async () => {
    spectator.setInput('layout', CreateVdevLayout.Raidz2);
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['4', '5', '6', '7']);

    await widthSelect.setValue('4');

    expect(await vdevsSelect.getOptionLabels()).toStrictEqual(['1']);
  });

  it('updates width and vdev options when layout changes to Raidz3', async () => {
    spectator.setInput('layout', CreateVdevLayout.Raidz3);
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['5', '6', '7']);

    await widthSelect.setValue('5');

    expect(await vdevsSelect.getOptionLabels()).toStrictEqual(['1']);
  });

  it('updates width and vdev options when layout changes to Stripe', async () => {
    spectator.setInput('layout', CreateVdevLayout.Stripe);
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);

    await widthSelect.setValue('1');

    expect(await vdevsSelect.getOptionLabels())
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('auto fills select when only one value is available', async () => {
    spectator.setInput('isStepActive', true);
    spectator.setInput('layout', CreateVdevLayout.Stripe);
    await sizeSelect.setValue('1 TiB (HDD)');

    expect(await widthSelect.getOptionLabels()).toStrictEqual(['1']);

    const widthValue = await widthSelect.getValue();
    expect(widthValue).toBe('1');

    expect(await vdevsSelect.getOptionLabels()).toStrictEqual(['1']);

    const vdevsValue = await widthSelect.getValue();
    expect(vdevsValue).toBe('1');
  });

  it('saves the topology layout on form updates', async () => {
    const poolManagerStore = spectator.inject(PoolManagerStore);

    spectator.setInput('layout', CreateVdevLayout.Mirror);
    await sizeSelect.setValue('12 TiB (HDD)');

    await widthSelect.setValue('2');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VdevType.Data, {
      width: 2,
      vdevsNumber: null,
    });

    await vdevsSelect.setValue('2');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VdevType.Data, {
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
    await sizeSelect.setValue('12 TiB (HDD)');
    expect(await widthSelect.isDisabled()).toBeFalsy();
    expect(await vdevsSelect.isDisabled()).toBeFalsy();
  });

  it('resets to default values when store emits a reset event', async () => {
    spectator.setInput('layout', CreateVdevLayout.Mirror);
    await sizeSelect.setValue('12 TiB (HDD)');
    await widthSelect.setValue('2');
    await vdevsSelect.setValue('2');

    startOver$.next();

    expect(await widthSelect.getValue()).toBe('');
    expect(await vdevsSelect.getValue()).toBe('');
  });

  it('calls store.openManualSelectionDialog when button clicked', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Manual Disk Selection' }));
    await button.click();

    expect(spectator.inject(PoolManagerStore).openManualSelectionDialog).toHaveBeenCalled();
  });
});
