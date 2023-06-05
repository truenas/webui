import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { IxRadioGroupHarness } from 'app/modules/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { PoolWarningsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

const duplicateSerialDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf8694',
  duplicate_serial: ['sdb', 'sdc'],
  devname: 'sda',
} as UnusedDisk;

const exportedPoolDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf8695',
  duplicate_serial: [],
  exported_zpool: 'FAKE_POOL',
  devname: 'sdb',
} as UnusedDisk;

const duplicateSerialAndExportedPoolDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf866',
  duplicate_serial: ['sdb'],
  exported_zpool: 'MOCK_POOL',
  devname: 'sdc',
} as UnusedDisk;

describe('PoolWarningsComponent', () => {
  let spectator: Spectator<PoolWarningsComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: PoolWarningsComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        allDisks$: of([duplicateSerialDisk, exportedPoolDisk, duplicateSerialAndExportedPoolDisk]),
        setDiskWarningOptions: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks allow non unique serial radio button', async () => {
    const allowNonUniqueSerial = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Allow non-unique serialed disks' }));
    await allowNonUniqueSerial.setValue('Allow');

    expect(spectator.inject(PoolManagerStore).setDiskWarningOptions).toHaveBeenCalledWith({
      allowNonUniqueSerialDisks: true,
      allowExportedPools: [],
    });
  });

  it('checks exported pools checkboxes', async () => {
    const exportedPoolCheckboxes = await loader.getAllHarnesses(MatCheckboxHarness);

    expect(exportedPoolCheckboxes).toHaveLength(2);

    await exportedPoolCheckboxes[0].check();
    await exportedPoolCheckboxes[1].check();

    expect(spectator.inject(PoolManagerStore).setDiskWarningOptions).toHaveBeenCalledWith({
      allowNonUniqueSerialDisks: false,
      allowExportedPools: ['FAKE_POOL', 'MOCK_POOL'],
    });
  });

  it('checks warning message', () => {
    const [nonUnique, exportedDisks] = spectator.queryAll('ix-warning');
    expect(nonUnique).toHaveText('There are 2 disks available that have non-unique serial numbers');
    expect(exportedDisks).toHaveText('You will lose any and all data in selected disks.');
  });
});
