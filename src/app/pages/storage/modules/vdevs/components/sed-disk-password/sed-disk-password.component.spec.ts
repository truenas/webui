import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { SedDiskPasswordComponent } from 'app/pages/storage/modules/vdevs/components/sed-disk-password/sed-disk-password.component';
import {
  sedEntitledProvider,
} from 'app/pages/storage/modules/vdevs/components/sed-disk-password/testing/sed-disk-password-mocks';

function sedDisk(status: SedStatus): Disk {
  return { name: 'sdi', sed: true, sed_status: status } as Disk;
}

describe('SedDiskPasswordComponent', () => {
  let spectator: SpectatorHost<SedDiskPasswordComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;
  let allSed: boolean;
  let disks: Disk[];
  let isGlobalPasswordSet: boolean;

  const createHost = createHostFactory({
    component: SedDiskPasswordComponent,
    providers: [
      sedEntitledProvider,
      // Factories, so each test can script the answers before the component asks.
      mockApi([
        mockCall('system.advanced.sed_global_password_is_set', () => isGlobalPasswordSet),
        mockCall('pool.query', () => [{ id: 4, all_sed: allSed } as Pool]),
        mockCall('disk.query', () => disks),
        mockCall('disk.setup_sed'),
        mockCall('disk.unlock_sed'),
      ]),
    ],
  });

  function setup(options: { allSed?: boolean; disks: Disk[]; isGlobalPasswordSet?: boolean }): void {
    allSed = options.allSed ?? false;
    disks = options.disks;
    isGlobalPasswordSet = options.isGlobalPasswordSet ?? true;
    spectator = createHost('<ix-sed-disk-password [poolId]="4" [disk]="\'sdi\'"></ix-sed-disk-password>');
    api = spectator.inject(MockApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('stays hidden and asks for nothing when the disk is not SED', async () => {
    setup({ allSed: true, disks: [{ name: 'sdi', sed: false } as Disk] });

    expect(spectator.query('.sed-disk-password')).not.toExist();
    expect(spectator.component.isValid()).toBe(true);
    await firstValueFrom(spectator.component.prepareDisk());
    expect(api.call).not.toHaveBeenCalledWith('disk.unlock_sed', expect.anything());
  });

  it('stays hidden for an uninitialized disk joining a pool that is not all-SED', () => {
    setup({ allSed: false, disks: [sedDisk(SedStatus.Uninitialized)] });

    expect(spectator.query('.sed-disk-password')).not.toExist();
  });

  it('leaves a locked disk to the global password by default', async () => {
    setup({ disks: [sedDisk(SedStatus.Locked)] });

    expect(spectator.query('.message')).toHaveText('sdi is a locked self-encrypting drive');
    const source = await loader.getHarness(IxRadioGroupHarness.with({ label: 'SED Password' }));
    expect(await source.getValue()).toBe('Global SED password');
    expect(spectator.component.isValid()).toBe(true);

    await firstValueFrom(spectator.component.prepareDisk());
    expect(api.call).not.toHaveBeenCalledWith('disk.unlock_sed', expect.anything());
  });

  it('unlocks a locked disk with an individual password', async () => {
    setup({ disks: [sedDisk(SedStatus.Locked)] });

    const source = await loader.getHarness(IxRadioGroupHarness.with({ label: 'SED Password' }));
    await source.setValue('Individual password for this disk');
    expect(spectator.component.isValid()).toBe(false);

    const inputs = await loader.getAllHarnesses(IxInputHarness);
    expect(inputs).toHaveLength(1);
    await inputs[0].setValue('disk-secret');
    expect(spectator.component.isValid()).toBe(true);

    await firstValueFrom(spectator.component.prepareDisk());
    expect(api.call).toHaveBeenCalledWith('disk.unlock_sed', [{ name: 'sdi', password: 'disk-secret' }]);
  });

  it('sets up an uninitialized disk in an all-SED pool with a confirmed individual password', async () => {
    setup({ allSed: true, disks: [sedDisk(SedStatus.Uninitialized)] });

    expect(spectator.query('.message')).toHaveText('sdi is an uninitialized self-encrypting drive');

    const source = await loader.getHarness(IxRadioGroupHarness.with({ label: 'SED Password' }));
    await source.setValue('Individual password for this disk');
    const password = await loader.getHarness(IxInputHarness.with({ label: 'Password' }));
    const confirm = await loader.getHarness(IxInputHarness.with({ label: 'Confirm Password' }));
    await password.setValue('disk-secret');
    await confirm.setValue('other');
    expect(spectator.component.isValid()).toBe(false);

    await confirm.setValue('disk-secret');
    expect(spectator.component.isValid()).toBe(true);

    await firstValueFrom(spectator.component.prepareDisk());
    expect(api.call).toHaveBeenCalledWith('disk.setup_sed', [{ name: 'sdi', password: 'disk-secret' }]);
  });

  it('requires an individual password when no global SED password is set', async () => {
    setup({ disks: [sedDisk(SedStatus.Locked)], isGlobalPasswordSet: false });

    const source = await loader.getHarness(IxRadioGroupHarness.with({ label: 'SED Password' }));
    expect(await source.getValue()).toBe('Individual password for this disk');
    expect(spectator.component.isValid()).toBe(false);

    await source.setValue('Global SED password (not set)');
    expect(spectator.component.isValid()).toBe(false);
  });
});
