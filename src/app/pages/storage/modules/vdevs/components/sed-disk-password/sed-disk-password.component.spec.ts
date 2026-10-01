import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import {
  TnBannerHarness, TnInputHarness, TnRadioGroupHarness, TnRadioHarness,
} from '@truenas/ui-components';
import { firstValueFrom } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { SedDiskPasswordComponent } from 'app/pages/storage/modules/vdevs/components/sed-disk-password/sed-disk-password.component';
import {
  mockSedDiskPasswordCalls, sedEntitledProvider,
} from 'app/pages/storage/modules/vdevs/components/sed-disk-password/testing/sed-disk-password-mocks';

function sedDisk(status: SedStatus): WebUiQueryEntity<'disk.query'> {
  return { name: 'sdi', sed: true, sed_status: status } as WebUiQueryEntity<'disk.query'>;
}

describe('SedDiskPasswordComponent', () => {
  let spectator: SpectatorHost<SedDiskPasswordComponent>;
  let loader: HarnessLoader;
  let api: MockTypedApiService;

  const createHost = createHostFactory({
    component: SedDiskPasswordComponent,
    providers: [sedEntitledProvider],
  });

  async function setup(options: Parameters<typeof mockSedDiskPasswordCalls>[0]): Promise<void> {
    spectator = createHost('<ix-sed-disk-password [poolId]="4" [disk]="\'sdi\'"></ix-sed-disk-password>', {
      // Spread: a per-host override takes a flat provider list.
      providers: [
        ...mockTypedApi([
          ...mockSedDiskPasswordCalls(options),
          mockTypedCall('disk.setup_sed', true),
          mockTypedCall('disk.unlock_sed', true),
        ]),
      ],
    });
    api = spectator.inject(TypedApiService) as unknown as MockTypedApiService;
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    // The typed double answers on a microtask.
    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();
  }

  it('stays hidden and asks for nothing when the disk is not SED', async () => {
    await setup({ allSed: true, disks: [{ name: 'sdi', sed: false } as WebUiQueryEntity<'disk.query'>] });

    expect(spectator.query('.sed-disk-password')).not.toExist();
    expect(spectator.component.isValid()).toBe(true);
    await firstValueFrom(spectator.component.prepareDisk());
    expect(api.call).not.toHaveBeenCalledWith('disk.unlock_sed', expect.anything());
  });

  it('stays hidden for an uninitialized disk joining a pool that is not all-SED', async () => {
    await setup({ allSed: false, disks: [sedDisk(SedStatus.Uninitialized)] });

    expect(spectator.query('.sed-disk-password')).not.toExist();
  });

  it('leaves a locked disk to the global password by default', async () => {
    await setup({ disks: [sedDisk(SedStatus.Locked)] });

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('sdi is a locked self-encrypting drive');
    const source = await loader.getHarness(TnRadioGroupHarness);
    expect(await source.getCheckedLabel()).toBe('Global SED password');
    expect(spectator.component.isValid()).toBe(true);

    await firstValueFrom(spectator.component.prepareDisk());
    expect(api.call).not.toHaveBeenCalledWith('disk.unlock_sed', expect.anything());
  });

  it('unlocks a locked disk with an individual password', async () => {
    await setup({ disks: [sedDisk(SedStatus.Locked)] });

    const source = await loader.getHarness(TnRadioGroupHarness);
    await source.select('Individual password for this disk');
    expect(spectator.component.isValid()).toBe(false);

    const inputs = await loader.getAllHarnesses(TnInputHarness);
    expect(inputs).toHaveLength(1);
    await inputs[0].setValue('disk-secret');
    expect(spectator.component.isValid()).toBe(true);

    await firstValueFrom(spectator.component.prepareDisk());
    expect(api.call).toHaveBeenCalledWith('disk.unlock_sed', [{ name: 'sdi', password: 'disk-secret' }]);
  });

  it('sets up an uninitialized disk in an all-SED pool with a confirmed individual password', async () => {
    await setup({ allSed: true, disks: [sedDisk(SedStatus.Uninitialized)] });

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('sdi is an uninitialized self-encrypting drive');

    const source = await loader.getHarness(TnRadioGroupHarness);
    await source.select('Individual password for this disk');
    const [password, confirm] = await loader.getAllHarnesses(TnInputHarness);
    await password.setValue('disk-secret');
    await confirm.setValue('other');
    expect(spectator.component.isValid()).toBe(false);

    await confirm.setValue('disk-secret');
    expect(spectator.component.isValid()).toBe(true);

    await firstValueFrom(spectator.component.prepareDisk());
    expect(api.call).toHaveBeenCalledWith('disk.setup_sed', [{ name: 'sdi', password: 'disk-secret' }]);
  });

  it('requires an individual password when no global SED password is set', async () => {
    await setup({ disks: [sedDisk(SedStatus.Locked)], isGlobalPasswordSet: false });

    const globalOption = await loader.getHarness(TnRadioHarness.with({ label: 'Global SED password (not set)' }));
    expect(await globalOption.isDisabled()).toBe(true);
    const source = await loader.getHarness(TnRadioGroupHarness);
    expect(await source.getCheckedLabel()).toBe('Individual password for this disk');
    expect(spectator.component.isValid()).toBe(false);
  });
});
