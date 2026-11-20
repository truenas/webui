import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { mockApi, mockQuery } from 'app/core/testing/utils/mock-api.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import {
  SedDiskPasswordsComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/sed-disk-passwords/sed-disk-passwords.component';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import {
  PoolManagerStore, PoolManagerTopology, SedDiskPasswords,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('SedDiskPasswordsComponent', () => {
  let spectator: Spectator<SedDiskPasswordsComponent>;
  let loader: HarnessLoader;

  const sdb = {
    identifier: '{serial}B', devname: 'sdb', size: 1024, sed_status: SedStatus.Uninitialized,
  } as DetailsDisk;
  const sdd = {
    identifier: '{serial}D', devname: 'sdd', size: 1024, sed_status: SedStatus.Uninitialized,
  } as DetailsDisk;
  const plain = { identifier: '{serial}P', devname: 'sda', size: 1024 } as DetailsDisk;

  const encryptionType = signal(EncryptionType.Sed);
  const topology = signal({
    [VDevType.Data]: { vdevs: [[sdd, plain, sdb]] },
  } as PoolManagerTopology);
  const setSedDiskPasswords = jest.fn();

  const createComponent = createComponentFactory({
    component: SedDiskPasswordsComponent,
    providers: [
      mockApi([
        mockQuery('disk.query', [
          { identifier: '{serial}B', passwd: 'own-password' },
          { identifier: '{serial}D', passwd: '' },
        ] as WebUiQueryEntity<'disk.query'>[]),
      ]),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: () => <T>(source$: Observable<T>) => source$,
      }),
      mockProvider(PoolManagerStore, {
        encryptionType,
        topology,
        setSedDiskPasswords,
      }),
    ],
  });

  function lastReported(): SedDiskPasswords {
    return setSedDiskPasswords.mock.lastCall![0] as SedDiskPasswords;
  }

  async function selectSource(index: number, option: string): Promise<void> {
    const selects = await loader.getAllHarnesses(TnSelectHarness);
    await selects[index].selectOption(option);
    await spectator.fixture.whenStable();
  }

  beforeEach(async () => {
    encryptionType.set(EncryptionType.Sed);
    setSedDiskPasswords.mockClear();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await spectator.fixture.whenStable();
  });

  it('reads the stored passwords of the uninitialized SED disks in the layout', () => {
    expect(spectator.inject(ApiService).query).toHaveBeenCalledWith(
      'disk.query',
      [['identifier', 'in', ['{serial}B', '{serial}D']]],
      { extra: { passwords: true } },
    );
  });

  it('lists only uninitialized SED disks, defaulting to the password the pool job would use', async () => {
    const disks = spectator.queryAll('.disk-name').map((element) => element.textContent!.trim());
    expect(disks).toEqual([expect.stringContaining('sdb'), expect.stringContaining('sdd')]);

    const selects = await loader.getAllHarnesses(TnSelectHarness);
    expect(await selects[0].getDisplayText()).toBe('Individual password');
    expect(await selects[1].getDisplayText()).toBe('Global SED password');

    const password = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="password"]' }));
    expect(await password.getValue()).toBe('own-password');

    expect(lastReported()).toEqual({ changes: [], isValid: true });
  });

  it('reports an individual password for a disk switched to it, and blocks until it is confirmed', async () => {
    await selectSource(1, 'Individual password');
    expect(lastReported().isValid).toBe(false);

    const passwords = await loader.getAllHarnesses(TnInputHarness.with({ selector: '[formControlName="password"]' }));
    const confirms = await loader.getAllHarnesses(
      TnInputHarness.with({ selector: '[formControlName="passwordConfirm"]' }),
    );
    await passwords[1].setValue('new-password');
    await confirms[1].setValue('different');
    await spectator.fixture.whenStable();
    expect(lastReported().isValid).toBe(false);

    await confirms[1].setValue('new-password');
    await spectator.fixture.whenStable();
    expect(lastReported()).toEqual({
      changes: [{ identifier: '{serial}D', name: 'sdd', password: 'new-password' }],
      isValid: true,
    });
  });

  it('clears the stored password of a disk switched to the global SED password', async () => {
    await selectSource(0, 'Global SED password');

    expect(spectator.queryAll('tn-input')).toHaveLength(0);
    expect(lastReported()).toEqual({
      changes: [{ identifier: '{serial}B', name: 'sdb', password: '' }],
      isValid: true,
    });
  });

  it('reports an edited individual password', async () => {
    const password = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="password"]' }));
    const confirm = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="passwordConfirm"]' }));
    await password.setValue('changed');
    await confirm.setValue('changed');
    await spectator.fixture.whenStable();

    expect(lastReported()).toEqual({
      changes: [{ identifier: '{serial}B', name: 'sdb', password: 'changed' }],
      isValid: true,
    });
  });

  it('shows nothing and asks for nothing when the pool does not use SED', async () => {
    encryptionType.set(EncryptionType.None);
    await spectator.fixture.whenStable();

    expect(spectator.query('.sed-disk-passwords')).not.toExist();
    expect(lastReported()).toEqual({ changes: [], isValid: true });
  });
});
