import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  DiskSizeSelectsComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';
import {
  DraidSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/draid-selection/draid-selection.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('DraidSelectionComponent', () => {
  let spectator: Spectator<DraidSelectionComponent>;
  let form: IxFormHarness;

  const startOver$ = new Subject<void>();
  const resetStep$ = new Subject<void>();

  const createComponent = createComponentFactory({
    component: DraidSelectionComponent,
    imports: [
      ReactiveFormsModule,
      DiskSizeSelectsComponent,
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
        type: VdevType.Spare,
        layout: CreateVdevLayout.Draid1,
        inventory: [
          { type: DiskType.Hdd, size: 10 * GiB, name: 'disk1' },
          { type: DiskType.Hdd, size: 10 * GiB, name: 'disk2' },
          { type: DiskType.Hdd, size: 10 * GiB, name: 'disk3' },
          { type: DiskType.Hdd, size: 10 * GiB, name: 'disk4' },
          { type: DiskType.Hdd, size: 10 * GiB, name: 'disk5' },
          { type: DiskType.Hdd, size: 20 * GiB, name: 'disk6' },
          { type: DiskType.Ssd, size: 20 * GiB, name: 'disk7' },
          { type: DiskType.Ssd, size: 30 * GiB, name: 'disk8' },
          { type: DiskType.Ssd, size: 30 * GiB, name: 'disk9' },
        ] as DetailsDisk[],
        isStepActive: true,
      },
    });
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  it('keeps inputs disabled until disks are selected', async () => {
    expect(await form.getDisabledState()).toEqual({
      'Disk Size': false,
      'Treat Disk Size as Minimum': false,
      Children: true,
      'Data Devices': true,
      'Distributed Hot Spares': true,
      'Number of VDEVs': true,
    });

    await form.fillForm({
      'Disk Size': '10 GiB (HDD)',
    });

    expect(await form.getDisabledState()).toEqual({
      'Disk Size': false,
      'Treat Disk Size as Minimum': false,
      Children: false,
      'Data Devices': false,
      'Distributed Hot Spares': false,
      'Number of VDEVs': false,
    });
  });

  it('updates options in Data Devices dropdown when disks are selected', async () => {
    await form.fillForm({
      'Disk Size': '10 GiB (HDD)',
    });

    const dataDevices = await form.getControl('Data Devices') as IxSelectHarness;
    expect(await dataDevices.getOptionLabels()).toEqual(['2', '3', '4']);
  });

  it('updates Spares and Children options when Data Devices are selected', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Data Devices': '2',
      },
    );

    const spares = await form.getControl('Distributed Hot Spares') as IxSelectHarness;
    expect(await spares.getOptionLabels()).toEqual(['0', '1', '2']);
    expect(await spares.getValue()).toBe('0');

    const children = await form.getControl('Children') as IxSelectHarness;
    expect(await children.getOptionLabels()).toEqual(['3', '4', '5']);
  });

  it('updates Children when Spares are selected', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Data Devices': '2',
        'Distributed Hot Spares': '1',
      },
    );

    const children = await form.getControl('Children') as IxSelectHarness;
    expect(await children.getOptionLabels()).toEqual(['4', '5']);
  });

  it('defaults Children to optimal number, but only once', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Data Devices': '2',
      },
    );

    const children = await form.getControl('Children') as IxSelectHarness;
    expect(await children.getValue()).toBe('5');

    await form.fillForm({
      'Treat Disk Size as Minimum': true,
    });
    expect(await children.getValue()).toBe('9');
  });

  it('updates number of vdevs when Children are selected', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Treat Disk Size as Minimum': true,
        'Data Devices': '2',
      },
    );

    const vdevs = await form.getControl('Number of VDEVs') as IxSelectHarness;
    expect(await vdevs.getOptionLabels()).toEqual(['1']);

    await form.fillForm({
      Children: '4',
    });

    expect(await vdevs.getOptionLabels()).toEqual(['1', '2']);
  });

  it('updates value in store when controls are updated', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Treat Disk Size as Minimum': true,
        'Data Devices': '2',
        'Distributed Hot Spares': '1',
        Children: '5',
        'Number of VDEVs': '1',
      },
    );

    const store = spectator.inject(PoolManagerStore);
    expect(store.setAutomaticTopologyCategory).toHaveBeenLastCalledWith(
      VdevType.Spare,
      {
        draidDataDisks: 2,
        draidSpareDisks: 1,
        vdevsNumber: 1,
        width: 5,
      },
    );
  });

  it('resets to default values when store emits a reset event', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Treat Disk Size as Minimum': true,
        'Data Devices': '2',
        'Distributed Hot Spares': '1',
        Children: '5',
        'Number of VDEVs': '1',
      },
    );

    startOver$.next();

    expect(await form.getValues()).toMatchObject({
      'Data Devices': '',
      Children: '',
      'Distributed Hot Spares': '',
      'Number of VDEVs': '',
    });
  });
});
