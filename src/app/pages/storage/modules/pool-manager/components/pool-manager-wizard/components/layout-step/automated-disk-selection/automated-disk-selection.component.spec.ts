import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { FormBuilder } from '@ngneat/reactive-forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  AutomatedDiskSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/automated-disk-selection.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('AutomatedDiskSelection', () => {
  let spectator: Spectator<AutomatedDiskSelectionComponent>;
  let loader: HarnessLoader;

  let layoutSelect: IxSelectHarness;
  let widthSelect: IxSelectHarness;
  let vdevsSelect: IxSelectHarness;
  let sizeSelect: IxSelectHarness;

  const unusedDisks: UnusedDisk[] = [
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
      size: 1 * TiB,
      type: DiskType.Hdd,
    },
  ] as UnusedDisk[];

  const createComponent = createComponentFactory({
    component: AutomatedDiskSelectionComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(NgControl),
      mockProvider(FormBuilder),
      mockProvider(PoolManagerStore, {
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
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        canChangeLayout: true,
        type: VdevType.Data,
        inventory: [...unusedDisks],
        limitLayouts: Object.values(CreateVdevLayout),
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    layoutSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Layout' }));
    widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));
  });

  it('updates width and vdev options when layout changes to mirror', async () => {
    await layoutSelect.setValue('Mirror');
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['2', '3', '4', '5', '6', '7']);

    await widthSelect.setValue('2');

    expect(await vdevsSelect.getOptionLabels()).toStrictEqual(['1', '2', '3']);
  });

  it('updates width and vdev options when layout changes to Raidz1', async () => {
    await layoutSelect.setValue('RAIDZ1');
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['3', '4', '5', '6', '7']);

    await widthSelect.setValue('3');

    expect(await vdevsSelect.getOptionLabels())
      .toStrictEqual(['1', '2']);
  });

  it('updates width and vdev options when layout changes to Raidz2', async () => {
    await layoutSelect.setValue('RAIDZ2');
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['4', '5', '6', '7']);

    await widthSelect.setValue('4');

    expect(await vdevsSelect.getOptionLabels()).toStrictEqual(['1']);
  });

  it('updates width and vdev options when layout changes to Raidz3', async () => {
    await layoutSelect.setValue('RAIDZ3');
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['5', '6', '7']);

    await widthSelect.setValue('5');

    expect(await vdevsSelect.getOptionLabels()).toStrictEqual(['1']);
  });

  it('updates width and vdev options when layout changes to Stripe', async () => {
    await layoutSelect.setValue('Stripe');
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);

    await widthSelect.setValue('1');

    expect(await vdevsSelect.getOptionLabels())
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('updates the width options when layout changes after already selecting values', async () => {
    await layoutSelect.setValue('Stripe');
    await sizeSelect.setValue('12 TiB (HDD)');

    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);

    await widthSelect.setValue('1');

    expect(await vdevsSelect.getOptionLabels())
      .toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);

    await layoutSelect.setValue('Mirror');
    expect(await widthSelect.getValue()).toBe('');
    expect(await widthSelect.getOptionLabels())
      .toStrictEqual(['2', '3', '4', '5', '6', '7']);
  });

  it('auto fills select when only one value is available', async () => {
    await layoutSelect.setValue('Stripe');
    await sizeSelect.setValue('1 TiB (HDD)');

    expect(await widthSelect.getOptionLabels()).toStrictEqual(['1']);

    const widthValue = await widthSelect.getValue();
    expect(widthValue).toBe(1);

    expect(await vdevsSelect.getOptionLabels()).toStrictEqual(['1']);

    const vdevsValue = await widthSelect.getValue();
    expect(vdevsValue).toBe(1);
  });

  it('doesnt let the layout change', async () => {
    spectator.setInput('canChangeLayout', false);

    const layout = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Layout' }));
    expect(layout).toBeNull();
  });

  it('disables dependent fields until they are valid', async () => {
    expect(await widthSelect.isDisabled()).toBeTruthy();
    expect(await vdevsSelect.isDisabled()).toBeTruthy();
    await layoutSelect.setValue('Mirror');
    expect(await vdevsSelect.isDisabled()).toBeTruthy();
    expect(await widthSelect.isDisabled()).toBeTruthy();
    await sizeSelect.setValue('12 TiB (HDD)');
    expect(await widthSelect.isDisabled()).toBeFalsy();
    expect(await vdevsSelect.isDisabled()).toBeTruthy();
    await widthSelect.setValue('2');
    expect(await widthSelect.isDisabled()).toBeFalsy();
    expect(await vdevsSelect.isDisabled()).toBeFalsy();
  });

  it('saves the topology layout on form updates', async () => {
    const poolManagerStore = spectator.inject(PoolManagerStore);

    await layoutSelect.setValue('Mirror');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: null,
      diskType: null,
      width: undefined,
      vdevsNumber: undefined,
      treatDiskSizeAsMinimum: undefined,
    });

    await sizeSelect.setValue('12 TiB (HDD)');
    const checkValues = {
      layout: CreateVdevLayout.Mirror,
      diskSize: 12 * TiB,
      diskType: DiskType.Hdd,
      width: null as number,
      vdevsNumber: undefined as number,
      treatDiskSizeAsMinimum: false,
    };

    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VdevType.Data, checkValues);

    await widthSelect.setValue('2');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: 12 * TiB,
      diskType: DiskType.Hdd,
      width: 2,
      vdevsNumber: null,
      treatDiskSizeAsMinimum: false,
    });

    await vdevsSelect.setValue('2');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: 12 * TiB,
      diskType: DiskType.Hdd,
      width: 2,
      vdevsNumber: 2,
      treatDiskSizeAsMinimum: false,
    });

    const treatDiskSizeAsMinimumCheckbox = await loader.getHarness(
      IxCheckboxHarness.with({ label: 'Treat Disk Size as Minimum' }),
    );

    await treatDiskSizeAsMinimumCheckbox.setValue(true);
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: 12 * TiB,
      diskType: DiskType.Hdd,
      width: 2,
      vdevsNumber: 2,
      treatDiskSizeAsMinimum: true,
    });
  });

  it('opens manual disk selection modal', async () => {
    jest.spyOn(spectator.component.manualSelectionClicked, 'emit');
    const manualSelectionButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manual Disk Selection' }));
    await manualSelectionButton.click();
    expect(spectator.component.manualSelectionClicked.emit).toHaveBeenCalled();
  });

  describe('treat Disk Size as minimum', () => {
    it('updates width dropdown to include disks with larger size when checkbox is ticked', async () => {
      await layoutSelect.setValue('Stripe');
      await sizeSelect.setValue('12 TiB (HDD)');

      expect(await widthSelect.getOptionLabels()).toStrictEqual(['1', '2', '3', '4', '5', '6', '7']);

      const treatDiskSizeAsMinimumCheckbox = await loader.getHarness(
        IxCheckboxHarness.with({ label: 'Treat Disk Size as Minimum' }),
      );
      await treatDiskSizeAsMinimumCheckbox.setValue(true);

      expect(await widthSelect.getOptionLabels()).toStrictEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });
  });
});
