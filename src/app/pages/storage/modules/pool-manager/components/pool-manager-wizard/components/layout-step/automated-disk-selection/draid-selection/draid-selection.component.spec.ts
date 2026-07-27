import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnSelectHarness } from '@truenas/ui-components';
import { Subject } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  fillControlValues, getDisabledStates, indexFormControls,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';
import {
  DiskSizeSelectsComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';
import {
  DraidSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/draid-selection/draid-selection.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('DraidSelectionComponent', () => {
  let spectator: Spectator<DraidSelectionComponent>;
  let loader: HarnessLoader;

  const startOver$ = new Subject<void>();
  const resetStep$ = new Subject<void>();

  // The draid form mixes ix-* (Disk Size) and tn-* controls; `indexFormControls` indexes both by
  // label so the tests can fill/read/inspect by label as before.
  function getControls(): Promise<Record<string, IxFormControlHarness>> {
    return indexFormControls(loader);
  }

  const form = {
    // Re-query controls per value: some controls (e.g. the "Treat Disk Size as
    // Minimum" checkbox) only render after an earlier value is filled.
    fillForm: async (values: Record<string, unknown>): Promise<void> => {
      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const label in values) {
        await fillControlValues(await getControls(), { [label]: values[label] });
      }
    },
    getDisabledState: async (): Promise<Record<string, boolean>> => {
      return getDisabledStates(await getControls());
    },
  };

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

  beforeEach(() => {
    spectator = createComponent({
      props: {
        type: VDevType.Spare,
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  function getSelect(formControlName: string): Promise<TnSelectHarness> {
    return loader.getHarness(TnSelectHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  it('keeps inputs disabled until disks are selected', async () => {
    expect(await form.getDisabledState()).toEqual({
      'Disk Size': false,
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

    const dataDevices = await getSelect('dataDevicesPerGroup');
    expect(await dataDevices.getOptions()).toEqual(['2', '3', '4']);
  });

  it('updates Spares and Children options when Data Devices are selected', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Data Devices': '2',
      },
    );

    const spares = await getSelect('spares');
    expect(await spares.getOptions()).toEqual(['0', '1', '2']);
    expect(await spares.getDisplayText()).toBe('0');
    await spares.close();

    const children = await getSelect('children');
    expect(await children.getOptions()).toEqual(['3', '4', '5']);
  });

  it('updates Children when Spares are selected', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Data Devices': '2',
        'Distributed Hot Spares': '1',
      },
    );

    const children = await getSelect('children');
    expect(await children.getOptions()).toEqual(['4', '5']);
  });

  it('defaults Children to optimal number, but only once', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Data Devices': '2',
      },
    );

    const children = await getSelect('children');
    expect(await children.getDisplayText()).toBe('5');

    await form.fillForm({
      'Treat Disk Size as Minimum': true,
    });
    expect(await children.getDisplayText()).toBe('6');
  });

  it('updates number of vdevs when Children are selected', async () => {
    await form.fillForm(
      {
        'Disk Size': '10 GiB (HDD)',
        'Treat Disk Size as Minimum': true,
        'Data Devices': '2',
      },
    );

    const vdevs = await getSelect('vdevsNumber');
    expect(await vdevs.getOptions()).toEqual(['1']);
    await vdevs.close();

    await form.fillForm({
      Children: '3',
    });

    expect(await vdevs.getOptions()).toEqual(['1', '2']);
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
      VDevType.Spare,
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
        Children: '4',
      },
    );

    startOver$.next();

    // Start Over clears the disk selection and restores the form defaults. `tn-select` renders
    // a value verbatim even when no option matches it (`ix-select` used to blank it), so these
    // assertions read exactly what the user sees: the defaults the reset writes back, and an
    // empty Children — there is no optimal width to default to without disks.
    const controls = await getControls();
    expect(await controls['Disk Size'].getValue()).toBe('');
    expect(await controls['Data Devices'].getValue()).toBe('8');
    expect(await controls['Distributed Hot Spares'].getValue()).toBe('0');
    expect(await controls.Children.getValue()).toBe('');
    expect(await controls['Number of VDEVs'].getValue()).toBe('1');
  });
});
