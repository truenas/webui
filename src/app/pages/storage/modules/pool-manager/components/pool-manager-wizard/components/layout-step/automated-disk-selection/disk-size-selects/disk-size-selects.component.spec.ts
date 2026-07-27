import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  DiskSizeSelectsComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('DiskSizeSelectsComponent', () => {
  let spectator: Spectator<DiskSizeSelectsComponent>;
  let loader: HarnessLoader;
  let diskSizeSelect: TnSelectHarness;
  const startOver$ = new Subject<void>();
  const resetStep$ = new Subject<void>();

  const inventoryDisks = [
    { type: DiskType.Hdd, size: 10 * GiB, name: 'disk1' },
    { type: DiskType.Hdd, size: 10 * GiB, name: 'disk2' },
    { type: DiskType.Hdd, size: 20 * GiB, name: 'disk3' },
    { type: DiskType.Ssd, size: 20 * GiB, name: 'disk4' },
  ] as DetailsDisk[];

  const createComponent = createComponentFactory({
    component: DiskSizeSelectsComponent,
    imports: [
      ReactiveFormsModule,
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
        type: VDevType.Spare,
        inventory: inventoryDisks,
        isStepActive: true,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    diskSizeSelect = await loader.getHarness(TnSelectHarness);

    jest.spyOn(spectator.component.disksSelected, 'emit');
  });

  describe('disk type and size', () => {
    it('shows dropdown with disk types and sizes', async () => {
      const options = await diskSizeSelect.getOptions();
      expect(options).toEqual(['10 GiB (HDD)', '20 GiB (HDD)', '20 GiB (SSD)']);
    });

    it('updates value in store when disk type/size is selected', async () => {
      await diskSizeSelect.selectOption('20 GiB (HDD)');

      expect(spectator.inject(PoolManagerStore).setTopologyCategoryDiskSizes).toHaveBeenCalledWith(
        VDevType.Spare,
        {
          diskType: DiskType.Hdd,
          diskSize: 20 * GiB,
          treatDiskSizeAsMinimum: false,
        },
      );
    });

    it('emits (disksSelected) when dropdown is updated', async () => {
      await diskSizeSelect.selectOption('10 GiB (HDD)');

      expect(spectator.component.disksSelected.emit).toHaveBeenLastCalledWith([
        { type: DiskType.Hdd, size: 10 * GiB, name: 'disk1' },
        { type: DiskType.Hdd, size: 10 * GiB, name: 'disk2' },
      ]);
    });
  });

  describe('Treat Disk Size as Minimum', () => {
    it('does not show Treat Disk Size as Minimum until disk size is selected', async () => {
      const minimumCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ selector: '[formControlName="treatDiskSizeAsMinimum"]' }));
      expect(minimumCheckbox).toBeNull();
    });

    it('does not show Treat Disk Size as Minimum unless users selects a disk when larger disks are available', async () => {
      await diskSizeSelect.selectOption('20 GiB (HDD)');

      const minimumCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ selector: '[formControlName="treatDiskSizeAsMinimum"]' }));
      expect(minimumCheckbox).toBeNull();

      await diskSizeSelect.selectOption('10 GiB (HDD)');
      expect(await loader.getHarness(TnCheckboxHarness.with({ selector: '[formControlName="treatDiskSizeAsMinimum"]' }))).toBeTruthy();
    });

    it('updates value in store when Treat as minimum is changed', async () => {
      await diskSizeSelect.selectOption('10 GiB (HDD)');

      const minimumCheckbox = await loader.getHarness(TnCheckboxHarness.with({ selector: '[formControlName="treatDiskSizeAsMinimum"]' }));
      await minimumCheckbox.check();

      expect(spectator.inject(PoolManagerStore).setTopologyCategoryDiskSizes).toHaveBeenLastCalledWith(
        VDevType.Spare,
        {
          diskSize: 10 * GiB,
          diskType: DiskType.Hdd,
          treatDiskSizeAsMinimum: true,
        },
      );
    });

    it('emits (disksSelected) when checkbox is ticked', async () => {
      await diskSizeSelect.selectOption('10 GiB (HDD)');
      const minimumCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ selector: '[formControlName="treatDiskSizeAsMinimum"]' }));
      await minimumCheckbox.check();
      const expectedDisks = inventoryDisks.filter(
        (disk) => disk.type === DiskType.Hdd && disk.size >= 10 * GiB,
      );

      expect(spectator.component.disksSelected.emit).toHaveBeenCalledWith(expectedDisks);
    });
  });

  it('selects disk size and type if there only one option available', async () => {
    const singleDisk = { type: DiskType.Hdd, size: 10 * GiB, name: 'disk1' } as DetailsDisk;
    spectator.setInput('inventory', [singleDisk]);

    expect(await diskSizeSelect.getDisplayText()).toBe('10 GiB (HDD)');
    expect(spectator.inject(PoolManagerStore).setTopologyCategoryDiskSizes).toHaveBeenCalledWith(
      VDevType.Spare,
      {
        diskType: DiskType.Hdd,
        diskSize: 10 * GiB,
        treatDiskSizeAsMinimum: false,
      },
    );
    expect(spectator.component.disksSelected.emit).toHaveBeenCalledWith([singleDisk]);
  });

  it('resets to default values when store emits a reset event', async () => {
    await diskSizeSelect.selectOption('10 GiB (HDD)');
    let minimumCheckbox = await loader.getHarness(TnCheckboxHarness.with({ selector: '[formControlName="treatDiskSizeAsMinimum"]' }));
    await minimumCheckbox.check();

    startOver$.next();

    expect(await diskSizeSelect.getDisplayText()).toBe('Select an option');

    minimumCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ selector: '[formControlName="treatDiskSizeAsMinimum"]' }));
    expect(minimumCheckbox).toBeNull();
  });
});
