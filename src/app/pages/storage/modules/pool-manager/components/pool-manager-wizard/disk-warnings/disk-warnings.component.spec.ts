import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { Disk } from 'app/interfaces/storage.interface';
import { IxCheckboxListHarness } from 'app/modules/ix-forms/components/ix-checkbox-list/ix-checkbox-list.harness';
import { IxRadioGroupHarness } from 'app/modules/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { DiskWarningsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/disk-warnings/disk-warnings.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

const duplicateSerialDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf8694',
  duplicate_serial: ['sdb', 'sdc'],
  devname: 'sda',
} as Disk;

const exportedPoolDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf8695',
  duplicate_serial: [],
  exported_zpool: 'POOL',
  devname: 'sdb',
} as unknown as Disk;

const duplicateSerialAndExportedPoolDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf866',
  duplicate_serial: ['sdb'],
  exported_zpool: 'POOL',
  devname: 'sdc',
} as unknown as Disk;

describe('DiskWarningsComponent', () => {
  let spectator: Spectator<DiskWarningsComponent>;
  let loader: HarnessLoader;
  let formGroup: PoolManagerWizardComponent['form']['controls']['general'];

  const createComponent = createComponentFactory({
    component: DiskWarningsComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        unusedDisks$: of([exportedPoolDisk, duplicateSerialDisk, duplicateSerialAndExportedPoolDisk]),
        nonUniqueSerialDisks$: of([duplicateSerialDisk, duplicateSerialAndExportedPoolDisk]),
        exportedPoolDisks$: of([exportedPoolDisk, duplicateSerialAndExportedPoolDisk]),
      }),
    ],
  });

  beforeEach(() => {
    formGroup = new FormGroup({
      allowNonUniqueSerialDisks: new FormControl('false'),
      allowDisksFromExportedPools: new FormControl<string[]>([]),
    }) as unknown as PoolManagerWizardComponent['form']['controls']['general'];

    spectator = createComponent({
      props: {
        form: formGroup,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks allow non unique serial radio button', async () => {
    const allowNonUniqueSerial = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Allow non-unique serialed disks' }));
    await allowNonUniqueSerial.setValue('Allow');

    expect(formGroup.value).toMatchObject({
      allowNonUniqueSerialDisks: 'true',
      allowDisksFromExportedPools: [],
    });
  });

  it('checks exported pool disks exist and represented', async () => {
    const exportedPoolDisks = await loader.getHarness(IxCheckboxListHarness.with({ label: 'Select disks you want to use' }));
    expect(exportedPoolDisks).toExist();

    const checkboxes = await exportedPoolDisks.getCheckboxes();
    expect(checkboxes).toHaveLength(2);
  });

  it('checks warning message', () => {
    const [nonUnique, exportedDisks] = spectator.queryAll('ix-warning');
    expect(nonUnique).toHaveText('There are 2 disks available that have non-unique serial numbers');
    expect(exportedDisks).toHaveText('You will lose any and all data in selected disks.');
  });
});
