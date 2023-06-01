import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { FormBuilder } from '@ngneat/reactive-forms';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AutomatedDiskSelectionComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/automated-disk-selection.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('AutomatedDiskSelection', () => {
  let spectator: Spectator<AutomatedDiskSelectionComponent>;
  let loader: HarnessLoader;
  let poolManagerStore: PoolManagerStore;

  const unusedDisks: UnusedDisk[] = [
    {
      identifier: '{serial_lunid}8HG7MZJH_5000cca2700de678',
      name: 'sdo',
      number: 2272,
      serial: '8HG7MZJH',
      size: 12000138625024,
      model: 'HUH721212AL4200',
      type: DiskType.Hdd,
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdo',
    },
    {
      identifier: '{serial_lunid}8DKXTD5H_5000cca253dd71e0',
      name: 'sdr',
      number: 16656,
      serial: '8DKXTD5H',
      size: 12000138625024,
      description: '',
      model: 'HUH721212AL4200',
      type: 'HDD',
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdr',
    },
    {
      identifier: '{serial_lunid}8DKA6AMH_5000cca253bba820',
      name: 'sdq',
      number: 16640,
      serial: '8DKA6AMH',
      size: 12000138625024,
      model: 'HUH721212AL4200',
      type: 'HDD',
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdq',
    },
    {
      identifier: '{serial_lunid}8HG53AGH_5000cca270094988',
      name: 'sdw',
      number: 16736,
      serial: '8HG53AGH',
      size: 12000138625024,
      model: 'HUH721212AL4200',
      type: 'HDD',
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdw',
    },
    {
      identifier: '{serial_lunid}8HG647SH_5000cca2700b28b8',
      name: 'sdt',
      number: 16688,
      serial: '8HG647SH',
      size: 12000138625024,
      model: 'HUH721212AL4200',
      type: 'HDD',
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdt',
    },
    {
      identifier: '{serial_lunid}8HG7NKPH_5000cca2700def44',
      name: 'sdu',
      number: 16704,
      serial: '8HG7NKPH',
      size: 12000138625024,
      model: 'HUH721212AL4200',
      type: 'HDD',
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdu',
    },
    {
      identifier: '{serial_lunid}8HG3USZH_5000cca27006f774',
      name: 'sdh',
      subsystem: 'scsi',
      serial: '8HG3USZH',
      size: 12000138625024,
      model: 'HUH721212AL4200',
      type: 'HDD',
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdh',
    },
    {
      identifier: '{serial_lunid}8HG5372H_5000cca2700947e4',
      name: 'sdg',
      number: 2144,
      serial: '8HG5372H',
      size: 12000138625024,
      model: 'HUH721212AL4200',
      type: 'HDD',
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdg',
    },
    {
      identifier: '{serial_lunid}8HG77D9H_5000cca2700d2974',
      name: 'sdj',
      number: 2192,
      serial: '8HG77D9H',
      size: 12000138625024,
      model: 'HUH721212AL4200',
      type: 'HDD',
      duplicate_serial: [],
      enclosure: {
        number: 0,
        slot: 1,
      },
      devname: 'sdj',
    },
  ] as unknown as UnusedDisk[];

  const createComponent = createComponentFactory({
    component: AutomatedDiskSelectionComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(NgControl),
      mockProvider(FormBuilder),
      mockProvider(PoolManagerStore),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    poolManagerStore = spectator.inject(PoolManagerStore);
    jest.spyOn(poolManagerStore, 'getLayoutsForVdevType').mockImplementation(
      (vdevLayout: VdevType): Observable<CreateVdevLayout[]> => {
        switch (vdevLayout) {
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
      },
    );

    spectator.component.canChangeLayout = true;
    spectator.component.type = VdevType.Data;
    spectator.component.inventory = [...unusedDisks];
    spectator.component.limitLayouts = Object.values(CreateVdevLayout);
    spectator.component.ngOnInit();
    spectator.component.ngOnChanges();
  });

  it('updates width and vdev options when layout changes to mirror', async () => {
    const layoutSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    const widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    const vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    const sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));

    await layoutSelect.setValue('Mirror');
    await sizeSelect.setValue('10.91 TiB (HDD)');

    expect(
      await widthSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(2, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );

    await widthSelect.setValue('2');

    expect(
      await vdevsSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(1, Math.floor(unusedDisks.length / 2) + 1).map(
        (num) => num.toString(),
      ),
    );
  });

  it('updates width and vdev options when layout changes to Raidz1', async () => {
    const layoutSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    const widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    const vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    const sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));

    await layoutSelect.setValue('Raidz1');
    await sizeSelect.setValue('10.91 TiB (HDD)');

    expect(
      await widthSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(3, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );

    await widthSelect.setValue('3');

    expect(
      await vdevsSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(1, Math.floor(unusedDisks.length / 3) + 1).map(
        (num) => num.toString(),
      ),
    );
  });

  it('updates width and vdev options when layout changes to Raidz2', async () => {
    const layoutSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    const widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    const vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    const sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));

    await layoutSelect.setValue('Raidz2');
    await sizeSelect.setValue('10.91 TiB (HDD)');

    expect(
      await widthSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(4, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );

    await widthSelect.setValue('4');

    expect(
      await vdevsSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(1, Math.floor(unusedDisks.length / 4) + 1).map(
        (num) => num.toString(),
      ),
    );
  });

  it('updates width and vdev options when layout changes to Raidz3', async () => {
    const layoutSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    const widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    const vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    const sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));

    await layoutSelect.setValue('Raidz3');
    await sizeSelect.setValue('10.91 TiB (HDD)');

    expect(
      await widthSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(5, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );

    await widthSelect.setValue('5');

    expect(
      await vdevsSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(1, Math.floor(unusedDisks.length / 5) + 1).map(
        (num) => num.toString(),
      ),
    );
  });

  it('updates width and vdev options when layout changes to Stripe', async () => {
    const layoutSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    const widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    const vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    const sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));

    await layoutSelect.setValue('Stripe');
    await sizeSelect.setValue('10.91 TiB (HDD)');

    expect(
      await widthSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(1, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );

    await widthSelect.setValue('1');

    expect(
      await vdevsSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(1, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );
  });

  it('updates the width options when layout changes after already selecting values', async () => {
    const layoutSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    const widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    const vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    const sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));

    await layoutSelect.setValue('Stripe');
    await sizeSelect.setValue('10.91 TiB (HDD)');

    expect(
      await widthSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(1, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );

    await widthSelect.setValue('1');

    expect(
      await vdevsSelect.getOptionLabels(),
    ).toStrictEqual(
      _.range(1, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );

    await layoutSelect.setValue('Mirror');
    expect(
      await widthSelect.getValue(),
    ).toBe('');
    expect(await widthSelect.getOptionLabels()).toStrictEqual(
      _.range(2, unusedDisks.length + 1).map(
        (num) => num.toString(),
      ),
    );
  });

  it('limits layout options based on the vdev type', async () => {
    spectator.component.type = VdevType.Log;
    spectator.component.ngOnInit();
    spectator.component.ngOnChanges();
    spectator.detectChanges();
    const layoutSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    expect(await layoutSelect.getOptionLabels()).toStrictEqual(['Stripe', 'Mirror']);
  });

  it('doesnt let the layout change', async () => {
    spectator.component.canChangeLayout = false;
    spectator.detectChanges();

    let error = null;
    try {
      await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    } catch (err: unknown) {
      error = err;
    }

    expect(error).toBeTruthy();
  });

  it('saves the topology layout on form updates', async () => {
    const layoutSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Layout' }));
    const widthSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Width' }));
    const vdevsSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Number of VDEVs' }));
    const sizeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Disk Size' }));

    await layoutSelect.setValue('Mirror');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenNthCalledWith(2, VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: null,
      diskType: null,
      width: null,
      vdevsNumber: null,
      treatDiskSizeAsMinimum: false,
    });

    await sizeSelect.setValue('10.91 TiB (HDD)');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenNthCalledWith(3, VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: 12000138625024,
      diskType: DiskType.Hdd,
      width: null,
      vdevsNumber: null,
      treatDiskSizeAsMinimum: false,
    });

    await widthSelect.setValue('2');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenNthCalledWith(5, VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: 12000138625024,
      diskType: DiskType.Hdd,
      width: 2,
      vdevsNumber: null,
      treatDiskSizeAsMinimum: false,
    });

    await vdevsSelect.setValue('2');
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenNthCalledWith(7, VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: 12000138625024,
      diskType: DiskType.Hdd,
      width: 2,
      vdevsNumber: 2,
      treatDiskSizeAsMinimum: false,
    });

    const treatDiskSizeAsMinimumCheckbox = await loader.getHarness(
      IxCheckboxHarness.with({ label: 'Treat Disk Size as Minimum' }),
    );

    await treatDiskSizeAsMinimumCheckbox.setValue(true);
    expect(poolManagerStore.setAutomaticTopologyCategory).toHaveBeenNthCalledWith(9, VdevType.Data, {
      layout: CreateVdevLayout.Mirror,
      diskSize: 12000138625024,
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
});
