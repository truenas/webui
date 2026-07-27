import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnFormFieldHarness, TnRadioHarness } from '@truenas/ui-components';
import { BehaviorSubject, of } from 'rxjs';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolWarningsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

const duplicateSerialDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf8694',
  duplicate_serial: ['sdb', 'sdc'],
  devname: 'sda',
} as DetailsDisk;

const exportedPoolDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf8695',
  duplicate_serial: [] as string[],
  exported_zpool: 'FAKE_POOL',
  devname: 'sdb',
} as DetailsDisk;

const duplicateSerialAndExportedPoolDisk = {
  identifier: '{uuid}bb73faf5-6d50-4af9-ae30-bc8ba0cf866',
  duplicate_serial: ['sdb'],
  exported_zpool: 'MOCK_POOL',
  devname: 'sdc',
} as DetailsDisk;

describe('PoolWarningsComponent', () => {
  let spectator: Spectator<PoolWarningsComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: PoolWarningsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        setDiskWarningOptions: jest.fn(),
        encryptionType$: of(EncryptionType.None),
      }),
      mockProvider(DiskStore, {
        selectableDisks$: of([duplicateSerialDisk, exportedPoolDisk, duplicateSerialAndExportedPoolDisk]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks allow non unique serial radio button', async () => {
    // The group label lives on the wrapping tn-form-field; assert it so a bare "Allow" radio
    // can't satisfy this test if the group it belongs to changes.
    const group = await loader.getHarness(
      TnFormFieldHarness.with({ label: 'Allow non-unique serialed disks (not recommended)' }),
    );
    expect(group).toBeTruthy();

    const allowRadio = await loader.getHarness(TnRadioHarness.with({ label: 'Allow' }));
    await allowRadio.check();

    expect(spectator.inject(PoolManagerStore).setDiskWarningOptions).toHaveBeenCalledWith({
      allowNonUniqueSerialDisks: true,
      allowExportedPools: [],
    });
  });

  it('checks exported pools checkboxes', async () => {
    const exportedPoolCheckboxes = await loader.getAllHarnesses(TnCheckboxHarness);

    expect(exportedPoolCheckboxes).toHaveLength(2);

    await exportedPoolCheckboxes[0].check();
    await exportedPoolCheckboxes[1].check();

    expect(spectator.inject(PoolManagerStore).setDiskWarningOptions).toHaveBeenLastCalledWith({
      allowNonUniqueSerialDisks: false,
      allowExportedPools: ['FAKE_POOL', 'MOCK_POOL'],
    });

    await exportedPoolCheckboxes[0].uncheck();

    expect(spectator.inject(PoolManagerStore).setDiskWarningOptions).toHaveBeenLastCalledWith({
      allowNonUniqueSerialDisks: false,
      allowExportedPools: ['MOCK_POOL'],
    });
  });

  it('checks warning message', () => {
    const [nonUnique, exportedDisks] = spectator.queryAll('ix-warning');
    expect(nonUnique).toHaveText('There are 2 disks available that have non-unique serial numbers');
    expect(exportedDisks).toHaveText('You will lose any and all data in selected disks.');
  });

  describe('SED filtering of exported pool disks', () => {
    const sedExportedPoolDisk = {
      identifier: '{uuid}sed-exported',
      duplicate_serial: [] as string[],
      exported_zpool: 'SED_POOL',
      devname: 'sdw',
      sed_status: SedStatus.Uninitialized,
    } as DetailsDisk;

    const nonSedExportedPoolDisk = {
      identifier: '{uuid}non-sed-exported',
      duplicate_serial: [] as string[],
      exported_zpool: 'NON_SED_POOL',
      devname: 'sdi',
    } as DetailsDisk;

    let encryptionType$: BehaviorSubject<EncryptionType>;
    const createSedComponent = createComponentFactory({
      component: PoolWarningsComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockProvider(PoolManagerStore, {
          setDiskWarningOptions: jest.fn(),
          get encryptionType$() { return encryptionType$; },
        }),
        mockProvider(DiskStore, {
          selectableDisks$: of([sedExportedPoolDisk, nonSedExportedPoolDisk]),
        }),
      ],
    });

    it('clears stale exported pool entries when encryption type switches to SED', async () => {
      encryptionType$ = new BehaviorSubject<EncryptionType>(EncryptionType.None);
      const sedSpectator = createSedComponent();
      const sedLoader = TestbedHarnessEnvironment.loader(sedSpectator.fixture);

      let checkboxes = await sedLoader.getAllHarnesses(TnCheckboxHarness);
      expect(checkboxes).toHaveLength(2);

      encryptionType$.next(EncryptionType.Sed);
      sedSpectator.detectChanges();

      checkboxes = await sedLoader.getAllHarnesses(TnCheckboxHarness);
      expect(checkboxes).toHaveLength(1);
      expect(await checkboxes[0].getLabelText()).toContain('SED_POOL');
    });
  });
});
